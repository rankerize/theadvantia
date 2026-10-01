import { Hono } from "hono";
import { getTransaction } from "../providers/wompi.js";

export const paymentsRouter = new Hono();

paymentsRouter.get("/transactions/:id", async (c) => {
  const { id } = c.req.param();
  const tx = await getTransaction(id);
  return c.json(tx);
});
