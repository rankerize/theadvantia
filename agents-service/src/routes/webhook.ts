import { Hono } from "hono";
import { handleCollections } from "../agents/collections.js";
import { handleQuotes } from "../agents/quotes.js";
import { handleOrders } from "../agents/orders.js";
import type { WhatsAppMessage } from "../types/index.js";

export const webhookRouter = new Hono();

// Meta webhook verification challenge
webhookRouter.get("/", (c) => {
  const mode = c.req.query("hub.mode");
  const token = c.req.query("hub.verify_token");
  const challenge = c.req.query("hub.challenge");
  if (mode === "subscribe" && token === process.env.WA_VERIFY_TOKEN) {
    return c.text(challenge ?? "", 200);
  }
  return c.json({ error: "Forbidden" }, 403);
});

// Incoming WhatsApp messages
webhookRouter.post("/", async (c) => {
  const body = await c.req.json<{ agentType: string; message: WhatsAppMessage }>();
  const { agentType, message } = body;

  switch (agentType) {
    case "collections":
      return c.json(await handleCollections(message));
    case "quotes":
      return c.json(await handleQuotes(message));
    case "orders":
      return c.json(await handleOrders(message));
    default:
      return c.json({ error: "Unknown agent type" }, 400);
  }
});
