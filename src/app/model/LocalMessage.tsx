// src/model/LocalMessage.ts

/** Beschreibt ein PDF, das der User hochgeladen hat */
export interface UploadedPdf {
    name: string;      // z.B. "grundgesetz.pdf"
    content: string;   // Der tatsächlich extrahierte Text (nur intern benutzt)
}

/** Beschreibt eine einzelne Chat-Nachricht */
export interface LocalMessage {
    role: "user" | "assistant" | "system";
    content: string;
    createdAt?: string;
    model?: string;

    /** Dateinamen der PDFs, die zu dieser Nachricht gehören (wenn vom User hochgeladen) */
    attachedPdfNames?: string[];
}
