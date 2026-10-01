import type { WhatsAppMessage, AgentResponse } from "../types/index.js";

// Identifies overdue invoices and runs progressive payment recovery via WhatsApp
export async function handleCollections(msg: WhatsAppMessage): Promise<AgentResponse> {
  // TODO: load overdue invoices from Supabase, build recovery conversation
  return {
    to: msg.from,
    message: "Hola, te contactamos sobre tu factura pendiente. ¿Podemos coordinar el pago?",
  };
}
