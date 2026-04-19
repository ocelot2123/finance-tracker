import { Inbound, verifyWebhookFromHeaders } from "inboundemail";

import { getServerEnv } from "@/lib/env";

export async function verifyInboundWebhook(headers: Headers): Promise<boolean> {
  const env = getServerEnv();
  const inbound = new Inbound({ apiKey: env.inboundApiKey });

  return verifyWebhookFromHeaders(headers, inbound);
}
