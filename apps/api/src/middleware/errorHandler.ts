import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { config } from "../config/index.js";
import type { ApiResponse, ApiError } from "@ims/types";

interface AppError extends Error {
  statusCode?: number;
  code?: string;
  details?: Record<string, string[]>;
}

export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error("Error:", err);

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const errorResponse: ApiResponse = {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Validation failed",
        details: err.flatten().fieldErrors as Record<string, string[]>,
      },
    };
    res.status(422).json(errorResponse);
    return;
  }

  // Default error
  const statusCode = err.statusCode || 500;
  const error: ApiError = {
    code: err.code || "INTERNAL_ERROR",
    message: config.nodeEnv === "production" && statusCode === 500
      ? "Internal server error"
      : err.message,
    details: err.details,
  };

  const response: ApiResponse = {
    success: false,
    error,
  };

  res.status(statusCode).json(response);
}

export function notFoundHandler(_req: Request, res: Response): void {
  const response: ApiResponse = {
    success: false,
    error: {
      code: "NOT_FOUND",
      message: "Resource not found",
    },
  };
  res.status(404).json(response);
}

export function createError(message: string, statusCode: number, code?: string): AppError {
  const error = new Error(message) as AppError;
  error.statusCode = statusCode;
  error.code = code;
  return error;
}