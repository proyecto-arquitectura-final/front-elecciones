export interface ChatRequest {
  question: string;
  electionId?: number;
  sessionId?: string;
}

export interface ChatResponse {
  answer: string;
  toolsUsed: string[];
  sessionId?: string;
  messageId?: number;
  provider?: 'GEMINI' | 'RULES_FALLBACK' | string;
  model?: string;
  fallback?: boolean;
  sources?: string[];
  disclaimer?: string;
  generatedAt?: string;
}

export interface ChatStatus {
  enabled: boolean;
  provider: string;
  model: string;
  persistenceEnabled: boolean;
  historyLimit: number;
  message: string;
}

export interface ChatHistoryMessage {
  id: number;
  role: 'USER' | 'ASSISTANT';
  content: string;
  provider?: string;
  model?: string;
  fallback: boolean;
  helpful?: boolean | null;
  createdAt: string;
}

export interface ChatHistory {
  sessionId: string;
  electionId?: number;
  messages: ChatHistoryMessage[];
}

export interface ChatFeedbackResponse {
  messageId: number;
  saved: boolean;
}
