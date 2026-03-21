import { getRedisClient } from "../config/redis.js";
import { db } from "../config/database.js";
import type { Session } from "@prisma/client";

const SESSION_PREFIX = "session:";
const SESSION_TTL = 15 * 60; // 15 minutes in seconds

export class SessionCache {
  private redis: ReturnType<typeof getRedisClient> | null = null;
  private redisAvailable: boolean = true;

  constructor() {
    try {
      this.redis = getRedisClient();
    } catch {
      this.redisAvailable = false;
      console.log("Redis not available, falling back to database only");
    }
  }

  private getSessionKey(token: string): string {
    return `${SESSION_PREFIX}${token}`;
  }

  async get(token: string): Promise<Session | null> {
    // Try Redis first
    if (this.redisAvailable && this.redis) {
      try {
        const cached = await this.redis.get(this.getSessionKey(token));
        if (cached) {
          return JSON.parse(cached) as Session;
        }
      } catch (error) {
        console.error("Redis get error:", error);
        this.redisAvailable = false;
      }
    }

    // Fallback to database
    const session = await db.session.findFirst({
      where: {
        token,
        expiresAt: { gt: new Date() },
      },
    });

    // Cache in Redis for next time
    if (session && this.redisAvailable && this.redis) {
      try {
        const ttl = Math.max(
          1,
          Math.floor((session.expiresAt.getTime() - Date.now()) / 1000)
        );
        await this.redis.setex(
          this.getSessionKey(token),
          ttl,
          JSON.stringify(session)
        );
      } catch (error) {
        console.error("Redis setex error:", error);
      }
    }

    return session;
  }

  async set(session: Session): Promise<void> {
    if (this.redisAvailable && this.redis) {
      try {
        const ttl = Math.max(
          1,
          Math.floor((session.expiresAt.getTime() - Date.now()) / 1000)
        );
        await this.redis.setex(
          this.getSessionKey(session.token),
          ttl,
          JSON.stringify(session)
        );
      } catch (error) {
        console.error("Redis set error:", error);
      }
    }
  }

  async delete(token: string): Promise<void> {
    if (this.redisAvailable && this.redis) {
      try {
        await this.redis.del(this.getSessionKey(token));
      } catch (error) {
        console.error("Redis delete error:", error);
      }
    }
  }

  async clear(): Promise<void> {
    if (this.redisAvailable && this.redis) {
      try {
        const keys = await this.redis.keys(`${SESSION_PREFIX}*`);
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      } catch (error) {
        console.error("Redis clear error:", error);
      }
    }
  }
}

export const sessionCache = new SessionCache();
