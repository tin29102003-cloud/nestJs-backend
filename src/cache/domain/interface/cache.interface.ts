export const CACHE_SERVICE_INTERFACE = Symbol('CACHE_SERVICE_INTERFACE');
export interface CacheServiceInterface {
    get<T>(key: string): Promise<T | null>;
    set<T>(key: string, value: T, ttl?: number): Promise<void>;
    delete(key: string | string[]): Promise<void>;
    clear(): Promise<void>;
}