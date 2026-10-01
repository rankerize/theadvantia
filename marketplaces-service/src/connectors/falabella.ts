import type { Listing } from "../types/index.js";

// TODO: Falabella Seller Center API
export async function getListing(_sku: string): Promise<Listing> {
  throw new Error("Falabella connector not yet implemented");
}
