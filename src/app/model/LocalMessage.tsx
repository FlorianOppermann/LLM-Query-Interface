// src/model/LocalMessage.ts
export interface LocalMessage {
    role: "user" | "assistant";
    content: string;
    createdAt?: string;
    model?: string;
}

// Optional: Falls du mehr Infos zum PDF speichern willst
export interface UploadedPdf {
    name: string;
    content: string; // Der extrahierte Text aus dem PDF
}
