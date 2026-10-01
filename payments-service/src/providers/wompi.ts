import crypto from "crypto";
import type { WompiEvent, WompiTransaction } from "../types/index.js";

const BASE_URL =
  process.env.WOMPI_ENV === "production"
    ? "https://production.wompi.co/v1"
    : "https://sandbox.wompi.co/v1";

export async function getTransaction(txId: string): Promise<WompiTransaction> {
  const res = await fetch(`${BASE_URL}/transactions/${txId}`, {
    headers: { Authorization: `Bearer ${process.env.WOMPI_PRIVATE_KEY}` },
  });
  if (!res.ok) throw new Error(`Wompi ${res.status}: ${await res.text()}`);
  const { data } = (await res.json()) as { data: WompiTransaction };
  return data;
}

// SHA-256(timestamp + events_secret) — https://docs.wompi.co/docs/colombia/eventos
export function verifyChecksum(
  event: Pick<WompiEvent, "timestamp" | "signature">
): boolean {
  const expected = crypto
    .createHash("sha256")
    .update(`${event.timestamp}${process.env.WOMPI_EVENTS_SECRET}`)
    .digest("hex");
  return expected === event.signature.checksum;
}
