// src/controller/ChatController.ts

import { ChatRequest, ChatResponse } from "../model/ChatModel";

export async function sendChatRequest(data: ChatRequest): Promise<ChatResponse> {
    const response = await fetch("http://localhost:11434/api/chat", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        throw new Error(`Fehler beim Laden: ${response.status}`);
    }

    const result: ChatResponse = await response.json();
    return result;
}


export function formatDate(date: string): string {
    const d = new Date(date);
    return d.toLocaleString();
}