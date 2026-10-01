import type { Listing } from "../types/index.js";

const BASE_URL = "https://api.mercadolibre.com";

export async function getListing(itemId: string): Promise<Listing> {
  const res = await fetch(`${BASE_URL}/items/${itemId}`, {
    headers: { Authorization: `Bearer ${process.env.MELI_ACCESS_TOKEN}` },
  });
  if (!res.ok) throw new Error(`MeLi ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as Record<string, unknown>;
  return {
    id: data.id as string,
    marketplace: "mercadolibre",
    title: data.title as string,
    price: data.price as number,
    currency: "COP",
    stock: data.available_quantity as number,
    url: data.permalink as string,
  };
}

export async function updateTitle(itemId: string, title: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/items/${itemId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${process.env.MELI_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ title }),
  });
  if (!res.ok) throw new Error(`MeLi update ${res.status}: ${await res.text()}`);
}
