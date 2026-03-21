import { z } from "zod";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const configSchema = z.object({
  nodeEnv: z.enum(["development", "production", "test"]).default("development"),
  port: z.coerce.number().int().default(3030),

  // Database
  databaseUrl: z.string().url(),

  // Redis
  redisUrl: z.string().url().optional(),

  // JWT
  jwtSecret: z.string().min(32),
  jwtAccessExpiry: z.string().default("15m"),
  jwtRefreshExpiry: z.string().default("7d"),

  // Cookies
  cookieName: z.string().default("ims_access_token"),
  cookieMaxAge: z.coerce.number().int().default(15 * 60 * 1000), // 15 minutes

  // CORS
  corsOrigin: z.string().default("http://localhost:5173"),
});

export type Config = z.infer<typeof configSchema>;

function loadConfig(): Config {
  // Load .env file explicitly from the api directory
  try {
    const dotenv = require("dotenv");
    const envPath = path.resolve(__dirname, "../../.env");
    dotenv.config({ path: envPath });
  } catch {
    // dotenv not available, use process.env directly
  }

  const env = {
    nodeEnv: process.env["NODE_ENV"],
    port: process.env["PORT"],
    databaseUrl: process.env["DATABASE_URL"],
    redisUrl: process.env["REDIS_URL"],
    jwtSecret: process.env["JWT_SECRET"],
    jwtAccessExpiry: process.env["JWT_ACCESS_EXPIRY"],
    jwtRefreshExpiry: process.env["JWT_REFRESH_EXPIRY"],
    cookieName: process.env["COOKIE_NAME"],
    cookieMaxAge: process.env["COOKIE_MAX_AGE"],
    corsOrigin: process.env["CORS_ORIGIN"],
  };

  return configSchema.parse(env);
}

export const config = loadConfig();