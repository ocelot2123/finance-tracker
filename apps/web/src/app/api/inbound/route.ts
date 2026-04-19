import { NextResponse } from "next/server";

import { hasValidWebhookApiKey } from "@/lib/auth";
import { listNestedObjectKeys, listObjectKeys, safeParseJson, sanitizeForLog } from "@/lib/json";
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
    const sanitizedPayload = sanitizeForLog(parsedBody.value);

    console.info(
      `Inbound webhook summary\n${JSON.stringify(
        {
          verified: true,
          webhookEvent,
          endpointId,
          payloadKeys,
          emailKeys,
          parsedDataKeys,
          headers: {
            "content-type": request.headers.get("content-type"),
            "user-agent": request.headers.get("user-agent"),
            "x-webhook-event": webhookEvent,
            "x-webhook-timestamp": request.headers.get("x-webhook-timestamp"),
            "x-endpoint-id": endpointId,
            "x-email-id": request.headers.get("x-email-id"),
            "x-message-id": request.headers.get("x-message-id")
          }
        },
        null,
        2
      )}`
    );

    console.info(`Inbound webhook payload\n${JSON.stringify(sanitizedPayload, null, 2)}`);

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
