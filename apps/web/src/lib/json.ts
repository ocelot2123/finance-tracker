export type JsonValue =
  | null
  | boolean
  | number
  | string
  | JsonValue[]
  | { [key: string]: JsonValue };

type ParseResult =
  | {
      ok: true;
      value: unknown;
    }
  | {
      ok: false;
      error: string;
    };

const MAX_DEPTH = 6;
const MAX_STRING_LENGTH = 500;
const MAX_ARRAY_ITEMS = 20;
const MAX_OBJECT_KEYS = 50;

const REDACTED_HEADER_NAMES = new Set([
  "authorization",
  "cookie",
  "forwarded",
  "x-vercel-oidc-token",
  "x-vercel-proxy-signature",
  "x-vercel-sc-headers",
  "x-webhook-verification-token"
]);

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function safeParseJson(value: string): ParseResult {
  try {
    const parsedValue: unknown = JSON.parse(value);

    return {
      ok: true,
      value: parsedValue
    };
  } catch {
    return {
      ok: false,
      error: "Request body is not valid JSON."
    };
  }
}

export function listObjectKeys(value: unknown): string[] {
  if (!isRecord(value)) {
    return [];
  }

  return Object.keys(value);
}

export function listNestedObjectKeys(value: unknown, path: string[]): string[] {
  let current: unknown = value;

  for (const segment of path) {
    if (!isRecord(current)) {
      return [];
    }

    current = current[segment];
  }

  if (!isRecord(current)) {
    return [];
  }

  return Object.keys(current);
}

export function sanitizeHeaders(headers: Headers): { [key: string]: JsonValue } {
  const sanitized: { [key: string]: JsonValue } = {};

  for (const [name, value] of headers.entries()) {
    sanitized[name] = REDACTED_HEADER_NAMES.has(name.toLowerCase())
      ? "[redacted]"
      : truncateString(value);
  }

  return sanitized;
}

export function sanitizeForLog(value: unknown, depth = 0): JsonValue {
  if (depth >= MAX_DEPTH) {
    return "[max-depth]";
  }

  if (value === null) {
    return null;
  }

  if (typeof value === "string") {
    return truncateString(value);
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : String(value);
  }

  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "bigint") {
    return value.toString();
  }

  if (Array.isArray(value)) {
    const items: JsonValue[] = [];

    for (const item of value.slice(0, MAX_ARRAY_ITEMS)) {
      items.push(sanitizeForLog(item, depth + 1));
    }

    if (value.length > MAX_ARRAY_ITEMS) {
      items.push(`...[${value.length - MAX_ARRAY_ITEMS} more items]`);
    }

    return items;
  }

  if (isRecord(value)) {
    const sanitized: { [key: string]: JsonValue } = {};
    const entries = Object.entries(value);

    for (const [index, entry] of entries.entries()) {
      if (index >= MAX_OBJECT_KEYS) {
        sanitized._truncatedKeys = `${entries.length - MAX_OBJECT_KEYS} more keys`;
        break;
      }

      const [key, nestedValue] = entry;
      sanitized[key] = sanitizeForLog(nestedValue, depth + 1);
    }

    return sanitized;
  }

  return String(value);
}

function truncateString(value: string): string {
  if (value.length <= MAX_STRING_LENGTH) {
    return value;
  }

  return `${value.slice(0, MAX_STRING_LENGTH)}...[truncated ${value.length - MAX_STRING_LENGTH} chars]`;
}
