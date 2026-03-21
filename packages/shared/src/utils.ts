// Simple classname utility (lighter than clsx for production)
type ClassArray = Array<string | number | boolean | null | undefined>;

export function cn(...inputs: ClassArray): string {
  return inputs
    .flat()
    .filter((x): x is string => typeof x === "string" && x.length > 0)
    .join(" ");
}

// Format date to ISO string
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toISOString();
}

// Format number as currency
export function formatCurrency(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}

// Generate SKU
export function generateSKU(prefix: string, id: string): string {
  return `${prefix}-${id.slice(-8).toUpperCase()}`;
}

// Parse search params
export function parseSearchParams(searchParams: URLSearchParams): Record<string, string> {
  const result: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    result[key] = value;
  });
  return result;
}

// Slugify string
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Truncate text
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + "...";
}

// Delay utility
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Retry utility
export async function retry<T>(
  fn: () => Promise<T>,
  options: { maxRetries: number; delay: number } = { maxRetries: 3, delay: 1000 }
): Promise<T> {
  let lastError: Error | undefined;

  for (let i = 0; i <= options.maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (i < options.maxRetries) {
        await delay(options.delay * (i + 1));
      }
    }
  }

  throw lastError;
}

// Unique array by key
export function uniqueBy<T>(array: T[], key: keyof T): T[] {
  const seen = new Set();
  return array.filter((item) => {
    const k = item[key];
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

// Group array by key
export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((result, item) => {
    const k = String(item[key]);
    (result[k] = result[k] || []).push(item);
    return result;
  }, {} as Record<string, T[]>);
}