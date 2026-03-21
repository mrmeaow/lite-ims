import type { Request } from "express";

/**
 * Get a single query param value (handles arrays by taking first element)
 */
export function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  if (Array.isArray(value)) {
    return value[0] as string | undefined;
  }
  return value as string | undefined;
}

/**
 * Get a single param value (handles arrays by taking first element)
 */
export function getParam(req: Request, key: string): string {
  const value = req.params[key];
  if (Array.isArray(value)) {
    return value[0] as string;
  }
  return value as string;
}

/**
 * Get query params as a plain object (handles arrays by taking first element)
 */
export function getQueryParams(req: Request): Record<string, string> {
  const result: Record<string, string> = {};
  Object.entries(req.query).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      result[key] = value[0] as string;
    } else if (value !== undefined) {
      result[key] = value as string;
    }
  });
  return result;
}
