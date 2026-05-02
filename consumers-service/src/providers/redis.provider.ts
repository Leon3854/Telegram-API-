import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisProvider {
  private readonly redis: Redis;

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'redis',
      port: Number(process.env.REDIS_PORT) || 6379,
    });
  }

  async isDuplicate(messageId: string): Promise<boolean> {
    const result = await this.redis.set(`msg:${messageId}`, 'processed', 'EX', 86400, 'NX');
    return result !== 'OK';
  }

  async removeLock(messageId: string): Promise<void> {
    await this.redis.del(`msg:${messageId}`);
  }
}
