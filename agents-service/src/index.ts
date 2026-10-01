import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { webhookRouter } from "./routes/webhook.js";

const app = new Hono();

app.get("/health", (c) => c.json({ status: "ok", service: "agents" }));
app.route("/webhook", webhookRouter);

const PORT = Number(process.env.PORT) || 3002;
serve({ fetch: app.fetch, port: PORT }, () =>
  console.log(`agents-service on :${PORT}`)
);
