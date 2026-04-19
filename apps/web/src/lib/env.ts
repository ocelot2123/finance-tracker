type ServerEnv = {
  inboundApiKey: string;
  axiomApiToken: string;
  axiomDataset: string;
  axiomBaseUrl: string;
};

export function getServerEnv(): ServerEnv {
  const inboundApiKey = requireEnv("INBOUND_API_KEY");
  const axiomApiToken = requireEnv("AXIOM_API_TOKEN");
  const axiomDataset = requireEnv("AXIOM_DATASET");
  const axiomBaseUrl = process.env.AXIOM_BASE_URL ?? "https://api.axiom.co";

  return {
    inboundApiKey,
    axiomApiToken,
    axiomDataset,
    axiomBaseUrl
  };
}

function requireEnv(name: "INBOUND_API_KEY" | "AXIOM_API_TOKEN" | "AXIOM_DATASET"): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required env: ${name}`);
  }

  return value;
}
