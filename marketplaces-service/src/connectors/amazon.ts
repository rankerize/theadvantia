import type { Listing } from "../types/index.js";

// TODO: Amazon SP-API
export async function getListing(_asin: string): Promise<Listing> {
  throw new Error("Amazon connector not yet implemented");
}
