import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '../generated/prisma/client.js';

function createAdapter(): PrismaMariaDb {
  const databaseURL = process.env.DATABASE_URL;

  if (!databaseURL) {
    throw new Error('DATABASE_URL is not configured');
  }

  return new PrismaMariaDb(databaseURL);
}

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    super({
      adapter: createAdapter(),
    });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}