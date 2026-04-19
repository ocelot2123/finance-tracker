const sampleResponse = `{
  "ok": true,
  "verified": true,
  "webhookEvent": "email.received",
  "endpointId": "endp_123",
  "payloadKeys": ["event", "timestamp", "email", "endpoint"]
}`;

export default function HomePage() {
  return (
    <main>
      <h1>Finance Tracker Webhook</h1>
      <p>
        This app exposes <code>POST /api/inbound</code> for verified inbound.new webhooks and sends a
        truncated payload snapshot to Axiom.
      </p>

      <div className="card">
        <p>
          Local env file: <code>apps/web/.env.local</code>
        </p>
        <p>
          Webhook URL: <code>/api/inbound</code>
        </p>
        <p>
          Health check: <code>GET /api/inbound</code>
        </p>
      </div>

      <div className="card">
        <p>Expected success response:</p>
        <pre>{sampleResponse}</pre>
      </div>
    </main>
  );
}
