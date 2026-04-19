import { timingSafeEqual } from "node:crypto";

import { getServerEnv } from "@/lib/env";

export function hasValidWebhookApiKey(headers: Headers): boolean {
  const token = getBearerToken(headers.get("authorization"));

  if (!token) {
    return false;
  }

  return safeEqual(token, getServerEnv().inboundWebhookApiKey);
}

function getBearerToken(authorizationHeader: string | null): string | null {
  if (!authorizationHeader) {
    return null;
  }

  const parts = authorizationHeader.trim().split(/\s+/u);

  if (parts.length !== 2) {
    return null;
  }

  const [scheme, token] = parts;

  if (scheme.toLowerCase() !== "bearer" || token.length === 0) {
    return null;
  }

  return token;
}

function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}
