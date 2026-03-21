import { Request, Response, NextFunction } from "express";

interface LogEntry {
  method: string;
  url: string;
  status?: number;
  duration?: number;
  ip: string;
  userAgent?: string;
}

const logs: LogEntry[] = [];
const MAX_LOGS = 1000;

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();

  res.on("finish", () => {
    const entry: LogEntry = {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: Date.now() - start,
      ip: req.ip || req.socket.remoteAddress || "unknown",
      userAgent: req.get("user-agent"),
    };

    logs.push(entry);
    if (logs.length > MAX_LOGS) {
      logs.shift();
    }

    const timestamp = new Date().toISOString();
    const color = res.statusCode >= 400 ? "\x1b[31m" : "\x1b[32m";
    console.log(
      `${timestamp} ${color}${res.statusCode}\x1b[0m ${req.method} ${req.url} ${entry.duration}ms`
    );
  });

  next();
}

export function getLogs(): LogEntry[] {
  return [...logs];
}