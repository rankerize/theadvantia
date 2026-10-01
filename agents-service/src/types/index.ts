export type AgentType = "collections" | "quotes" | "orders";

export interface WhatsAppMessage {
  from: string;
  body: string;
  type: "text" | "audio" | "image" | "document";
  mediaUrl?: string;
  timestamp: number;
}

export interface AgentResponse {
  to: string;
  message: string;
}
