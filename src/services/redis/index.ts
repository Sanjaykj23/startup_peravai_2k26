import Redis from 'ioredis';
import { APP_CONFIG } from '@/configs';

// In-memory fallback cache when Redis is not running
const memoryStore = new Map<string, string>();
const memorySubscribers = new Map<string, Set<(message: string) => void>>();

let redisClient: Redis | null = null;
let isRedisConnected = false;

if (process.env.REDIS_URL && !process.env.DISABLE_REDIS) {
  try {
    redisClient = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 1,
      connectTimeout: 2000,
      lazyConnect: true,
      retryStrategy: () => null // don't infinite retry
    });

    redisClient.connect().then(() => {
      isRedisConnected = true;
      console.log('✓ Connected to Redis Cache Layer');
    }).catch((err) => {
      console.warn('! Redis connection failed, falling back to in-memory real-time cache:', err.message);
      redisClient = null;
      isRedisConnected = false;
    });
  } catch (e) {
    redisClient = null;
    isRedisConnected = false;
  }
}

export class RedisCacheService {
  /**
   * Format Redis key matching requirement:
   * bus:BUS001:occupancy
   * bus:BUS001:crowd_status
   * bus:BUS001:location
   */
  static getKey(type: 'occupancy' | 'crowd_status' | 'location' | 'trip', busCodeOrId: string): string {
    return `bus:${busCodeOrId}:${type}`;
  }

  static async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    memoryStore.set(key, serialized);

    if (redisClient && isRedisConnected) {
      try {
        if (ttlSeconds) {
          await redisClient.set(key, serialized, 'EX', ttlSeconds);
        } else {
          await redisClient.set(key, serialized);
        }
      } catch (err) {
        console.warn(`Redis set error for ${key}:`, err);
      }
    }
  }

  static async get<T = any>(key: string): Promise<T | null> {
    if (redisClient && isRedisConnected) {
      try {
        const val = await redisClient.get(key);
        if (val) {
          try {
            return JSON.parse(val) as T;
          } catch {
            return val as unknown as T;
          }
        }
      } catch (err) {
        // fallback to memory
      }
    }

    const memVal = memoryStore.get(key);
    if (!memVal) return null;
    try {
      return JSON.parse(memVal) as T;
    } catch {
      return memVal as unknown as T;
    }
  }

  static async publish(channel: string, message: any): Promise<void> {
    const str = typeof message === 'string' ? message : JSON.stringify(message);
    if (redisClient && isRedisConnected) {
      try {
        await redisClient.publish(channel, str);
      } catch (e) {}
    }
    const handlers = memorySubscribers.get(channel);
    if (handlers) {
      handlers.forEach((h) => h(str));
    }
  }

  static subscribe(channel: string, callback: (message: string) => void): () => void {
    if (!memorySubscribers.has(channel)) {
      memorySubscribers.set(channel, new Set());
    }
    memorySubscribers.get(channel)!.add(callback);
    return () => {
      memorySubscribers.get(channel)?.delete(callback);
    };
  }

  /**
   * Update real-time state for a bus
   */
  static async updateBusRealtimeState(busCode: string, state: {
    occupancy?: number;
    crowd_status?: number;
    location?: { latitude: number; longitude: number; timestamp: string };
  }): Promise<void> {
    if (state.occupancy !== undefined) {
      await this.set(this.getKey('occupancy', busCode), state.occupancy);
    }
    if (state.crowd_status !== undefined) {
      await this.set(this.getKey('crowd_status', busCode), state.crowd_status);
    }
    if (state.location !== undefined) {
      await this.set(this.getKey('location', busCode), state.location);
    }
    await this.publish(`bus:${busCode}:updates`, state);
  }
}
