import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { listingsRouter } from "./routes/listings.js";

const app = new Hono();

app.get("/health", (c) => c.json({ status: "ok", service: "marketplaces" }));
app.route("/listings", listingsRouter);

const PORT = Number(process.env.PORT) || 3001;
serve({ fetch: app.fetch, port: PORT }, () =>
  console.log(`marketplaces-service on :${PORT}`)
);
