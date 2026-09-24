import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AttachmentsService {
  constructor(private prisma: PrismaService) {}

  async create(
    userId: string,
    itemId: string,
    file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Ensure item belongs to user
    const item = await this.prisma.item.findFirst({
      where: { id: itemId, userId },
    });

    if (!item) {
      // Remove uploaded file if item does not exist
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      throw new NotFoundException('Item not found');
    }

    const fileUrl = `/uploads/${file.filename}`;

    const attachment = await this.prisma.attachment.create({
      data: {
        itemId,
        fileName: file.originalname,
        fileUrl,
        fileSize: file.size,
        mimeType: file.mimetype,
      },
    });

    await this.prisma.activity.create({
      data: {
        userId,
        itemId,
        action: 'ATTACHMENT_ADDED',
        details: { fileName: file.originalname, fileSize: file.size },
      },
    });

    return attachment;
  }

  async remove(userId: string, itemId: string, attachmentId: string) {
    const item = await this.prisma.item.findFirst({
      where: { id: itemId, userId },
    });

    if (!item) {
      throw new NotFoundException('Item not found');
    }

    const attachment = await this.prisma.attachment.findFirst({
      where: { id: attachmentId, itemId },
    });

    if (!attachment) {
      throw new NotFoundException('Attachment not found');
    }

    // Remove local file if exists
    const localFilePath = path.join(
      process.cwd(),
      'uploads',
      path.basename(attachment.fileUrl),
    );
    if (fs.existsSync(localFilePath)) {
      try {
        fs.unlinkSync(localFilePath);
      } catch (e) {
        // ignore disk deletion error
      }
    }

    await this.prisma.attachment.delete({
      where: { id: attachmentId },
    });

    return { success: true, id: attachmentId };
  }
}
