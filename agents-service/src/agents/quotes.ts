import type { WhatsAppMessage, AgentResponse } from "../types/index.js";

// Processes supplier quote requests and returns a comparative analysis table
export async function handleQuotes(msg: WhatsAppMessage): Promise<AgentResponse> {
  // TODO: parse product request from msg.body, query supplier DB, return comparison
  return {
    to: msg.from,
    message: "Procesando tu solicitud de cotización. En breve te enviamos la tabla comparativa.",
  };
}
