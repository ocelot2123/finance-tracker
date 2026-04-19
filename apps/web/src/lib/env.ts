type ServerEnv = {
  inboundApiKey: string;
  inboundWebhookApiKey: string;
};

export function getServerEnv(): ServerEnv {
  const inboundApiKey = requireEnv("INBOUND_API_KEY");
  const inboundWebhookApiKey = requireEnv("INBOUND_WEBHOOK_API_KEY");

  return {
    inboundApiKey,
    inboundWebhookApiKey
  };
}

function requireEnv(name: "INBOUND_API_KEY" | "INBOUND_WEBHOOK_API_KEY"): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required env: ${name}`);
  }

  return value;
}
