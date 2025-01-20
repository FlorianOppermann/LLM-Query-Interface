// src/model/ChatModel.ts

/** Einzelne Chat-Nachricht fürs Backend */
export interface ChatMessage {
    role: string;       // "user" oder "assistant"
    content: string;
}

/** Daten, die wir an das LLM schicken */
export interface ChatRequest {
    model: string;
    stream: boolean;
    messages: ChatMessage[];
}

/** Das Antwortformat vom LLM */
export interface ChatResponse {
    model: string;
    created_at: string;
    message: ChatMessage; // Rolle "assistant"
    done_reason: string;
    done: boolean;
    total_duration: number;
    load_duration: number;
    prompt_eval_count: number;
    prompt_eval_duration: number;
    eval_count: number;
    eval_duration: number;
}
