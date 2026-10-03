import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

const DEFAULT_CATEGORIES = [
  { name: 'Bills', color: '#ef4444', icon: 'receipt' },
  { name: 'Subscriptions', color: '#8b5cf6', icon: 'credit-card' },
  { name: 'Documents', color: '#f59e0b', icon: 'file-text' },
  { name: 'Appointments', color: '#3b82f6', icon: 'calendar' },
  { name: 'Personal', color: '#10b981', icon: 'user' },
  { name: 'Health', color: '#ec4899', icon: 'heart-pulse' },
  { name: 'Work', color: '#6366f1', icon: 'briefcase' },
  { name: 'Other', color: '#6b7280', icon: 'tag' },
];

/** Hash a plaintext reset token so we never store raw tokens in the DB */
function hashResetToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
        name: dto.name,
        timezone: dto.timezone || 'UTC',
        currency: 'USD',
        startOfWeek: 'monday',
        dateFormat: 'MM/DD/YYYY',
      },
    });

    // Seed default categories for this user
    await this.prisma.category.createMany({
      data: DEFAULT_CATEGORIES.map((cat) => ({
        userId: user.id,
        name: cat.name,
        color: cat.color,
        icon: cat.icon,
      })),
    });

    // Create welcome in-app notification
    await this.prisma.inAppNotification.create({
      data: {
        userId: user.id,
        title: 'Welcome to LifeDesk! 🌟',
        message:
          'Your personal life-obligations hub is ready. Start by adding your first bill, document, or subscription.',
        type: 'SYSTEM',
      },
    });

    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.email,
    });

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        timezone: user.timezone,
        currency: user.currency,
        startOfWeek: user.startOfWeek,
        dateFormat: user.dateFormat,
        createdAt: user.createdAt.toISOString(),
      },
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.email,
    });

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        timezone: user.timezone,
        currency: user.currency,
        startOfWeek: user.startOfWeek,
        dateFormat: user.dateFormat,
        createdAt: user.createdAt.toISOString(),
      },
    };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        timezone: true,
        currency: true,
        startOfWeek: true,
        dateFormat: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      // Return success without revealing user existence for security
      return {
        message: 'If an account exists with that email, a password reset token has been issued.',
      };
    }

    // Generate a secure raw token — only returned in the API response (dev) or sent via email (prod)
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashResetToken(rawToken);
    const expiry = new Date(Date.now() + 3600 * 1000); // 1 hour

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        // Store ONLY the hash — the raw token never touches the DB
        resetToken: tokenHash,
        resetTokenExpiry: expiry,
      },
    });

    // Notify user a reset was requested — NEVER embed the token in a notification
    await this.prisma.inAppNotification.create({
      data: {
        userId: user.id,
        title: 'Password Reset Requested 🔑',
        message:
          'A password reset was requested for your account. If this was not you, please secure your account immediately.',
        type: 'SYSTEM',
      },
    });

    const isDev = process.env.NODE_ENV !== 'production';

    return {
      message: 'If an account exists with that email, a password reset token has been issued.',
      // Only expose raw token in dev so the flow can be tested without email infrastructure
      ...(isDev ? { resetToken: rawToken } : {}),
    };
  }

  async resetPassword(token: string, newPassword: string) {
    if (!token || !newPassword || newPassword.length < 6) {
      throw new BadRequestException('Invalid token or password too short');
    }

    // Hash the incoming token before comparing with the stored hash
    const tokenHash = hashResetToken(token);

    const user = await this.prisma.user.findFirst({
      where: {
        resetToken: tokenHash,
        resetTokenExpiry: { gt: new Date() },
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired password reset token');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    return { success: true, message: 'Password has been reset successfully. You can now log in.' };
  }

  async updateProfile(
    userId: string,
    data: { name?: string; timezone?: string; startOfWeek?: string; dateFormat?: string },
  ) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name !== undefined ? data.name : undefined,
        timezone: data.timezone !== undefined ? data.timezone : undefined,
        startOfWeek: data.startOfWeek !== undefined ? data.startOfWeek : undefined,
        dateFormat: data.dateFormat !== undefined ? data.dateFormat : undefined,
      },
      select: {
        id: true,
        email: true,
        name: true,
        timezone: true,
        currency: true,
        startOfWeek: true,
        dateFormat: true,
        createdAt: true,
      },
    });

    return user;
  }

  async changePassword(userId: string, oldPass: string, newPass: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) throw new NotFoundException('User not found');

    const isMatch = await bcrypt.compare(oldPass, user.passwordHash);
    if (!isMatch) {
      throw new BadRequestException('Incorrect current password');
    }

    if (newPass.length < 6) {
      throw new BadRequestException('New password must be at least 6 characters');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPass, salt);

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    return { success: true, message: 'Password updated successfully' };
  }
}
