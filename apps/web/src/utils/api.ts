import type { ApiResponse } from "@ims/types";

// In production, API is served from the same origin under /api
// In development, we use the Vite proxy
const API_BASE = import.meta.env.PROD ? "/api" : "/api";
const DEBUG_MODE = import.meta.env.DEV ? true : false;


class ApiError extends Error {
  code: string;
  status: number;

  constructor(message: string, code: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;

  const config: RequestInit = {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  };

  const response = await fetch(url, config);
  const data: ApiResponse<T> = await response.json();

  if (DEBUG_MODE) console.info('[DEBUG API CALL]: ' + url + ' \n' + JSON.stringify(data, null, 2))

  if (!response.ok || !data.success) {
    throw new ApiError(
      data.error?.message || "An error occurred",
      data.error?.code || "UNKNOWN_ERROR",
      response.status
    );
  }

  return data.data as T;
}

export const api = {
  get: <T>(endpoint: string) => request<T>(endpoint),
  post: <T>(endpoint: string, body: unknown) =>
    request<T>(endpoint, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  put: <T>(endpoint: string, body: unknown) =>
    request<T>(endpoint, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  patch: <T>(endpoint: string, body: unknown) =>
    request<T>(endpoint, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  delete: <T>(endpoint: string) =>
    request<T>(endpoint, { method: "DELETE" }),
};

export { ApiError };
export type { ApiError as ApiErrorType };