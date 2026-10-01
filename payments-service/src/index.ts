import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { paymentsRouter } from "./routes/payments.js";
import { wompiWebhookRouter } from "./webhooks/wompi.js";

const app = new Hono();

app.get("/health", (c) => c.json({ status: "ok", service: "payments" }));
app.route("/payments", paymentsRouter);
app.route("/webhooks/wompi", wompiWebhookRouter);

const PORT = Number(process.env.PORT) || 3003;
serve({ fetch: app.fetch, port: PORT }, () =>
  console.log(`payments-service on :${PORT}`)
);
