import type { WhatsAppMessage, AgentResponse } from "../types/index.js";

// Interprets purchase requests from text, audio, or image and prepares dispatch
export async function handleOrders(msg: WhatsAppMessage): Promise<AgentResponse> {
  // TODO: extract SKUs from msg (text/audio/image), validate stock, create draft order
  return {
    to: msg.from,
    message: "Recibimos tu pedido. Confirmando disponibilidad de stock...",
  };
}
