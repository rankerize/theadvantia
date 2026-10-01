export type WompiCurrency = "COP";
export type WompiPaymentMethod = "CARD" | "NEQUI" | "PSE" | "BANCOLOMBIA_TRANSFER";

export interface WompiTransaction {
  id: string;
  status: "PENDING" | "APPROVED" | "DECLINED" | "VOIDED" | "ERROR";
  amount_in_cents: number;
  currency: WompiCurrency;
  payment_method_type: WompiPaymentMethod;
  reference: string;
  customer_email: string;
  created_at: string;
}

export interface WompiEvent {
  event: "transaction.updated";
  data: { transaction: WompiTransaction };
  signature: { properties: string[]; checksum: string };
  timestamp: number;
  sent_at: string;
}
