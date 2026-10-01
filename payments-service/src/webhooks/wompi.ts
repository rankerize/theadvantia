import { Hono } from "hono";
import { getTransaction, verifyChecksum } from "../providers/wompi.js";
import type { WompiEvent } from "../types/index.js";

export const wompiWebhookRouter = new Hono();

wompiWebhookRouter.post("/", async (c) => {
  const event = await c.req.json<WompiEvent>();

  if (!verifyChecksum(event)) {
    return c.json({ error: "Invalid signature" }, 401);
  }

  const { transaction } = event.data;

  if (transaction.status === "APPROVED") {
    // TODO: activate subscription / update tenant status in Supabase
    console.log(
      `Payment approved: ${transaction.reference} — ${transaction.amount_in_cents / 100} COP`
    );
  }

  return c.json({ received: true });
});
