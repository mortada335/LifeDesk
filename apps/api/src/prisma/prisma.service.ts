import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Prisma connected to PostgreSQL successfully.');
    } catch (err: any) {
      this.logger.error(
        `Failed to connect to database at ${process.env.DATABASE_URL}: ${err.message}. Please ensure PostgreSQL is running or verify your DATABASE_URL in apps/api/.env.`,
      );
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
