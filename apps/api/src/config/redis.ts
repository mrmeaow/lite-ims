import Redis from "ioredis";
import { config } from "./index.js";

let redis: Redis | undefined;

export function getRedisClient(): Redis {
  if (!redis && config.redisUrl) {
    redis = new Redis(config.redisUrl, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });

    redis.on("error", (err) => {
      console.error("Redis connection error:", err);
    });

    redis.on("connect", () => {
      console.log("Connected to Redis");
    });
  }

  if (!redis) {
    throw new Error("Redis is not configured");
  }

  return redis;
}

export async function closeRedis(): Promise<void> {
  if (redis) {
    await redis.quit();
    redis = undefined;
  }
}