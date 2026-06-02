import { RedisService } from '@liaoliaots/nestjs-redis';
import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { CacheServiceInterface } from '../domain/interface/cache.interface';

@Injectable()
export class RedisCacheService implements CacheServiceInterface {
    private readonly redis: Redis;
    constructor(
        private readonly redisService: RedisService
    ){
        this.redis = this.redisService.getOrThrow();
    }
    private parseData<T>(value: T){
        return JSON.stringify(value);
    }
    async set<T>(key: string, value: T, ttl?: number): Promise<void>{
        const data = this.parseData(value);
        if(ttl !== undefined){
            await this.redis.set(key, data,'EX', ttl);
        }else{
            await this.redis.set(key,data);
        }
        
    }
    async get<T>(key: string): Promise<T | null>{
        const value =  await this.redis.get(key);
        if(value === null){
            return null;
        } 
        return JSON.parse(value) as T;
    }
    async delete(key: string | string[]): Promise<void> {
        if (Array.isArray(key)) {
            await this.redis.del(...key);
        } else {
            await this.redis.del(key);
        }
    }
    async clear(): Promise<void> {
        await this.redis.flushdb();
    }

}