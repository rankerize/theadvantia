import type { Listing } from "../types/index.js";

// TODO: Homecenter Seller Portal API
export async function getListing(_productId: string): Promise<Listing> {
  throw new Error("Homecenter connector not yet implemented");
}
