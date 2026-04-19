import { NextResponse } from "next/server";

import { hasValidWebhookApiKey } from "@/lib/auth";
import { listNestedObjectKeys, listObjectKeys, safeParseJson, sanitizeForLog, sanitizeHeaders } from "@/lib/json";
import { verifyInboundWebhook } from "@/lib/inbound";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    ok: true,
    route: "/api/inbound",
    message: "Send verified inbound.new webhooks with POST."
  });
}

export async function POST(request: Request) {
  try {
    if (!hasValidWebhookApiKey(request.headers)) {
      return unauthorizedResponse();
    }

    const isVerified = await verifyInboundWebhook(request.headers);

    if (!isVerified) {
      return unauthorizedResponse();
    }

    const rawBody = await request.text();
    const parsedBody = safeParseJson(rawBody);

    if (!parsedBody.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: parsedBody.error
        },
        {
          status: 400
        }
      );
    }

    const webhookEvent = request.headers.get("x-webhook-event");
    const endpointId = request.headers.get("x-endpoint-id");
    const payloadKeys = listObjectKeys(parsedBody.value);
    const emailKeys = listNestedObjectKeys(parsedBody.value, ["email"]);
    const parsedDataKeys = listNestedObjectKeys(parsedBody.value, ["email", "parsedData"]);

    console.info(JSON.stringify({
      message: "Inbound webhook received",
      verified: true,
      webhookEvent,
      endpointId,
      payloadKeys,
      emailKeys,
      parsedDataKeys,
      headers: sanitizeHeaders(request.headers),
      payload: sanitizeForLog(parsedBody.value)
    }, null, 2));

    return NextResponse.json({
      ok: true,
      verified: true,
      webhookEvent,
      endpointId,
      payloadKeys,
      emailKeys,
      parsedDataKeys
    });
  } catch (error: unknown) {
    console.error("Inbound webhook handler failed", error);

    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unexpected error"
      },
      {
        status: 500
      }
    );
  }
}

function unauthorizedResponse() {
  return NextResponse.json(
    {
      ok: false,
      error: "Unauthorized"
    },
    {
      status: 401
    }
  );
}
