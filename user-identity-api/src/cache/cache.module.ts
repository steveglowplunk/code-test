import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { Global, Module } from '@nestjs/common';
import { createKeyv } from '@keyv/redis';

@Global()
@Module({
  imports: [
    NestCacheModule.registerAsync({
      isGlobal: true,
      useFactory: () => {
        const redisURL = process.env.REDIS_URL;

        if (!redisURL) {
          throw new Error('REDIS_URL is not configured');
        }

        return {
          stores: [createKeyv(redisURL)],
        };
      },
    }),
  ],
  exports: [NestCacheModule],
})
export class RedisCacheModule {}