import { Hono } from "hono";
import { getListing as getMeliListing, updateTitle } from "../connectors/mercadolibre.js";
import {
  getProducts,
  getContentScore,
  getCategoryTree,
  getCategoryAttributes,
  getCategorySuggestion,
  getOrders,
  type FalabellaCredentials,
} from "../connectors/falabella.js";

export const listingsRouter = new Hono();

// Extrae credenciales Falabella de los headers de cada request.
// El caller (portal/API gateway) inyecta las credenciales del tenant autenticado.
function falabellaCreds(c: { req: { header: (k: string) => string | undefined } }): FalabellaCredentials {
  const userId = c.req.header("x-fala-user-id");
  const apiKey = c.req.header("x-fala-api-key");
  if (!userId || !apiKey) throw new Error("Missing Falabella credentials headers");
  return { userId, apiKey };
}

// --- Mercado Libre -----------------------------------------------------------

listingsRouter.get("/mercadolibre/:id", async (c) => {
  const { id } = c.req.param();
  const listing = await getMeliListing(id);
  return c.json(listing);
});

listingsRouter.patch("/mercadolibre/:id/title", async (c) => {
  const { id } = c.req.param();
  const { title } = await c.req.json<{ title: string }>();
  await updateTitle(id, title);
  return c.json({ updated: true });
});

// --- Falabella Seller Center -------------------------------------------------

// GET /listings/falabella/products?offset=0&limit=100&filter=active
listingsRouter.get("/falabella/products", async (c) => {
  const creds = falabellaCreds(c);
  const offset = Number(c.req.query("offset") ?? 0);
  const limit = Number(c.req.query("limit") ?? 100);
  const filter = (c.req.query("filter") ?? "all") as "all" | "active" | "inactive";
  const products = await getProducts(creds, { offset, limit, filter });
  return c.json({ count: products.length, products });
});

// GET /listings/falabella/products/score?skus=SKU1,SKU2
listingsRouter.get("/falabella/products/score", async (c) => {
  const creds = falabellaCreds(c);
  const skus = (c.req.query("skus") ?? "").split(",").filter(Boolean);
  if (!skus.length) return c.json({ error: "skus query param required" }, 400);
  const scores = await getContentScore(creds, skus);
  return c.json({ scores });
});

// GET /listings/falabella/categories
listingsRouter.get("/falabella/categories", async (c) => {
  const creds = falabellaCreds(c);
  const tree = await getCategoryTree(creds);
  return c.json({ categories: tree });
});

// GET /listings/falabella/categories/:name/attributes
listingsRouter.get("/falabella/categories/:name/attributes", async (c) => {
  const creds = falabellaCreds(c);
  const { name } = c.req.param();
  const attrs = await getCategoryAttributes(creds, decodeURIComponent(name));
  const required = attrs.filter((a) => a.IsMandatory === 1);
  return c.json({ total: attrs.length, required: required.length, attributes: attrs });
});

// GET /listings/falabella/categories/suggest?q=nombre+del+producto
listingsRouter.get("/falabella/categories/suggest", async (c) => {
  const creds = falabellaCreds(c);
  const q = c.req.query("q");
  if (!q) return c.json({ error: "q query param required" }, 400);
  const suggestions = await getCategorySuggestion(creds, q);
  return c.json({ suggestions });
});

// GET /listings/falabella/orders?createdAfter=2026-01-01T00:00:00Z&status=delivered
listingsRouter.get("/falabella/orders", async (c) => {
  const creds = falabellaCreds(c);
  const orders = await getOrders(creds, {
    createdAfter: c.req.query("createdAfter"),
    createdBefore: c.req.query("createdBefore"),
    status: c.req.query("status"),
    limit: Number(c.req.query("limit") ?? 100),
    offset: Number(c.req.query("offset") ?? 0),
  });
  return c.json({ count: orders.length, orders });
});

// Ruta legacy — mantiene compatibilidad con llamadas anteriores
listingsRouter.get("/:marketplace/:id", async (c) => {
  const { marketplace, id } = c.req.param();
  if (marketplace !== "mercadolibre") {
    return c.json({ error: "Use marketplace-specific routes: /listings/falabella/..." }, 400);
  }
  const listing = await getMeliListing(id);
  return c.json(listing);
});
