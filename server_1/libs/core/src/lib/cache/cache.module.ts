import { Module, Global } from '@nestjs/common';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { redisStore } from 'cache-manager-redis-store';
import type { RedisClientOptions } from 'redis';
import { Env } from "../config/env.values";

@Global()
@Module({
  imports: [
    NestCacheModule.registerAsync<RedisClientOptions>({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const redisHost = configService.get<string>('REDIS_HOST', 'localhost');
        const redisPort = configService.get<number>('REDIS_PORT', 6379);
        const redisPassword = configService.get<string>('REDIS_PASSWORD');
        const redisDb = configService.get<number>('REDIS_DB', 0);

        // Use Redis if available, otherwise use in-memory cache
        if (redisHost && Env.nodeEnv === 'production') {
          return {
            store: redisStore,
            host: redisHost,
            port: redisPort,
            password: redisPassword,
            db: redisDb,
            ttl: 3600, // Default TTL: 1 hour
          };
        }

        // Fallback to in-memory cache for development
        return {
          ttl: 3600,
          max: 1000, // Maximum number of items in cache
        };
      },
      inject: [ConfigService],
    }),
  ],
  exports: [NestCacheModule],
})
export class CacheModule {}

