import { getServerEnv } from "@/lib/env";
import {
  type JsonValue,
  listNestedObjectKeys,
  listObjectKeys,
  sanitizeForLog,
  sanitizeHeaders
} from "@/lib/json";

type AxiomEvent = {
  time: string;
  data: { [key: string]: JsonValue };
  labels: { [key: string]: string };
};

type LogInboundWebhookInput = {
  headers: Headers;
  payload: unknown;
};

export async function logInboundWebhook({ headers, payload }: LogInboundWebhookInput): Promise<void> {
  const webhookEvent = headers.get("x-webhook-event") ?? "unknown";
  const endpointId = headers.get("x-endpoint-id") ?? "unknown";
  const environment = process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development";

  const event: AxiomEvent = {
    time: new Date().toISOString(),
    labels: {
      service: "finance-tracker-web",
      route: "/api/inbound",
      source: "inbound.new",
      environment
    },
    data: {
      kind: "inbound.webhook.received",
      verified: true,
      webhookEvent,
      endpointId,
      payloadKeys: listObjectKeys(payload),
      emailKeys: listNestedObjectKeys(payload, ["email"]),
      parsedDataKeys: listNestedObjectKeys(payload, ["email", "parsedData"]),
      headers: sanitizeHeaders(headers),
      payload: sanitizeForLog(payload)
    }
  };

  await ingestToAxiom(event);
}

async function ingestToAxiom(event: AxiomEvent): Promise<void> {
  const env = getServerEnv();
  const baseUrl = env.axiomBaseUrl.endsWith("/") ? env.axiomBaseUrl.slice(0, -1) : env.axiomBaseUrl;
  const response = await fetch(`${baseUrl}/v1/datasets/${env.axiomDataset}/ingest`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.axiomApiToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify([event])
  });

  if (response.ok) {
    return;
  }

  const errorText = await response.text();
  const suffix = errorText.length > 0 ? ` - ${errorText}` : "";

  throw new Error(`Axiom ingest failed with ${response.status} ${response.statusText}${suffix}`);
}
