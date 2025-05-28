import { Inject, Injectable } from '@nestjs/common';
import { RedisClientType } from 'redis';

@Injectable()
export class RedisService {
  @Inject('REDIS_CLIENT')
  private redisClient: RedisClientType;

  async keys(pattern: string) {
    return this.redisClient.keys(pattern);
  }

  async get(key: string) {
    return this.redisClient.get(key);
  }

  async set(key: string, value: string | number, ttl?: number) {
    await this.redisClient.set(key, value);

    if (ttl) {
      await this.redisClient.expire(key, ttl);
    }
  }

  async zRankingList(key: string, start: number = 0, end: number = -1) {
    return this.redisClient.zRange(key, start, end, {
      REV: true,
    });
  }

  async zAdd(key: string, members: Record<string, number>) {
    const mems = [];
    for (const mem in members) {
      mems.push({
        value: mem,
        score: members[mem],
      });
    }
    return await this.redisClient.zAdd(key, mems);
  }
}
