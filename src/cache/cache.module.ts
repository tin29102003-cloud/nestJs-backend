import { Global, Module } from '@nestjs/common';
import { RedisModule } from '@liaoliaots/nestjs-redis';
import { CACHE_SERVICE_INTERFACE } from './domain/interface/cache.interface';
import { RedisCacheService } from './infrastructure/ioredis-cache.service';
@Global()
@Module({
    imports: [
        RedisModule.forRoot({
            config: {
                host: process.env.REDIS_HOST || 'localhost',
                port: Number(process.env.REDIS_PORT) || 6379,
                // password: process.env.REDIS_PASSWORD || undefined,
            },
        })
    ],
    providers: [
        {
            provide: CACHE_SERVICE_INTERFACE,
            useClass: RedisCacheService
        }
    ],
    exports: [CACHE_SERVICE_INTERFACE]
})
export class CacheModule {}
