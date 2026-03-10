export interface BandoAnalysis {
  id: string;
  bandoId: string;
  title?: string;
  summary: string;
  requirements?: string;
  deadlines?: string;
  criteria?: string;
  insights?: string;
  suggestions?: string;
  rawContent?: string;
  createdAt: Date;
}

export interface ParsedDocument {
  text: string;
  fileName?: string;
  mimeType?: string;
  pageCount?: number;
  sourceUrl?: string;
}

export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: Date;
}
