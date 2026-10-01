import { Hono } from "hono";
import { getListing, updateTitle } from "../connectors/mercadolibre.js";

export const listingsRouter = new Hono();

listingsRouter.get("/:marketplace/:id", async (c) => {
  const { marketplace, id } = c.req.param();
  if (marketplace !== "mercadolibre") {
    return c.json({ error: "Connector not yet implemented" }, 501);
  }
  const listing = await getListing(id);
  return c.json(listing);
});

listingsRouter.patch("/:marketplace/:id/title", async (c) => {
  const { marketplace, id } = c.req.param();
  const { title } = await c.req.json<{ title: string }>();
  if (marketplace !== "mercadolibre") {
    return c.json({ error: "Connector not yet implemented" }, 501);
  }
  await updateTitle(id, title);
  return c.json({ updated: true });
});
