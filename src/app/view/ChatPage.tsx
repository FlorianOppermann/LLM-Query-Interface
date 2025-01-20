"use client";

import React, { useState } from "react";
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Container,
    TextField,
    Typography
} from "@mui/material";

import pdfjsLib from "../controller/pdfLoader";
import { formatDate, sendChatRequest } from "../controller/ChatController";
import { ChatMessage, ChatResponse } from "../model/ChatModel";
import { LocalMessage, UploadedPdf } from "../model/LocalMessage";
import LoadingSpinner from "../components/LoadingSpinner";

const ChatPage: React.FC = () => {
    // Chat-Verlauf
    const [messages, setMessages] = useState<LocalMessage[]>([]);
    // Eingabe-Feld für Prompt
    const [userMessage, setUserMessage] = useState("");
    // Liste hochgeladener PDFs (nur intern, kein UI-Content)
    const [pdfFiles, setPdfFiles] = useState<UploadedPdf[]>([]);

    // Ladezustand & Fehler
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    /**
     * Liest eine einzelne PDF per pdf.js und extrahiert den Text.
     */
    const parsePdfFile = async (file: File): Promise<string> => {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

        let combinedText = "";
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const content = await page.getTextContent();
            const pageText = content.items.map((item: any) => item.str).join(" ");
            combinedText += `\n--- Page ${pageNum} ---\n${pageText}`;
        }
        return combinedText.trim();
    };

    /**
     * PDF-Upload-Handler: Speichert Name+Inhalt in pdfFiles-State
     * => Zeigt aber NICHT den Inhalt an.
     */
    const handlePdfUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        const newlyUploadedNames: string[] = [];  // Dateinamen, die zur nächsten User-Nachricht gehören

        for (const file of files) {
            try {
                const text = await parsePdfFile(file);

                // 1) Im State ablegen (für LLM)
                const uploaded: UploadedPdf = {
                    name: file.name,
                    content: text,
                };
                setPdfFiles((prev) => [...prev, uploaded]);

                // 2) Für diese eine Nachricht speichern wir den Namen
                newlyUploadedNames.push(file.name);
            } catch (err) {
                console.error("Fehler beim Verarbeiten der PDF:", err);
                setError("Fehler beim Verarbeiten einer PDF-Datei");
            }
        }

        // Wir könnten an dieser Stelle bereits eine neue Nachricht im State
        // anlegen, aber das macht oft mehr Sinn beim "Senden" (handleSubmit).
        // => Also merkst du dir "newlyUploadedNames" für die nächste User-Nachricht.

        // Evtl. in localStorage zwischenparken, oder in einem Ref.
        // Für eine schnelle Lösung:
        // => Speichern wir neu hochgeladene Namen in einer globalen Variable:
        window.localStorage.setItem("pendingPdfNames", JSON.stringify(newlyUploadedNames));

        // Input resetten
        if (event.target) {
            event.target.value = "";
        }
    };

    /**
     * Sendet Prompt (userMessage) + PDF-Inhalt (intern) ans LLM
     */
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            // 1) Ggf. aus localStorage die PDF-Dateinamen auslesen,
            //    die gerade hochgeladen wurden
            let pdfNamesForThisMessage: string[] = [];
            const fromStore = window.localStorage.getItem("pendingPdfNames");
            if (fromStore) {
                pdfNamesForThisMessage = JSON.parse(fromStore);
                // clear
                window.localStorage.removeItem("pendingPdfNames");
            }

            // => systemMessage: fasst alle PDF-Inhalte zusammen (falls du das so möchtest)
            const combinedPdfContent = pdfFiles
                .map((pdf) => `PDF: ${pdf.name}\n${pdf.content}`)
                .join("\n\n=== Next PDF ===\n\n");

            // 2) System (nur LLM)
            const systemMsg: LocalMessage = {
                role: "user",
                content: combinedPdfContent
                    ? `Diese PDFs wurden hochgeladen (nur zur Info für das LLM):\n${combinedPdfContent}`
                    : "Keine weiteren Informationen"
            };

            // 3) Erzeuge die "User"-Nachricht inkl. angehängter PDF-Namen
            const userMsg: LocalMessage = {
                role: "user",
                content: userMessage,
                attachedPdfNames: pdfNamesForThisMessage
            };

            // 4) finale Sequenz
            // Du sagtest, Reihenfolge war wichtig – hier ein Beispiel:
            const finalMessages = [
                userMsg,
                systemMsg,
                ...messages,
            ];

            // 5) Request-Body
            const requestBody = {
                model: "llama3.1",
                stream: false,
                messages: finalMessages.map((m) => ({
                    role: "user",
                    content: m.content
                })) as ChatMessage[]
            };

            console.log("=== Final Request Body ===", requestBody);

            // 6) An LLM senden
            const response: ChatResponse = await sendChatRequest(requestBody);

            // 7) LLM-Antwort als Message
            const assistantMsg: LocalMessage = {
                role: "assistant",
                content: response.message.content,
                model: response.model,
                createdAt: response.created_at
            };

            console.log("=== LLM Response ===", response);

            // 8) Chat-Verlauf updaten
            setMessages([...messages, userMsg, assistantMsg]);
            setUserMessage("");
        } catch (err: any) {
            setError(err.message || "Unbekannter Fehler");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container maxWidth="sm" sx={{ pt: 4 }}>
            <Typography variant="h4" gutterBottom>
                Chat mit LLM + PDF-Upload
            </Typography>

            {/* Anzeige aller hochgeladenen PDFs (nur Name) */}
            {pdfFiles.length > 0 && (
                <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                        Bereits hochgeladene PDF(s):
                    </Typography>
                    <ul>
                        {pdfFiles.map((pdf, idx) => (
                            <li key={idx}>{pdf.name}</li>
                        ))}
                    </ul>
                </Box>
            )}

            {/* PDF-Upload */}
            <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                    PDF-Dateien hochladen:
                </Typography>
                <Button variant="outlined" component="label">
                    Dateien auswählen
                    <input
                        hidden
                        type="file"
                        accept="application/pdf"
                        multiple
                        onChange={handlePdfUpload}
                    />
                </Button>
            </Box>

            {/* Prompt-Eingabe */}
            <Card variant="outlined" sx={{ mb: 3 }}>
                <CardContent>
                    <Box
                        component="form"
                        onSubmit={handleSubmit}
                        display="flex"
                        flexDirection="column"
                        gap={2}
                    >
                        <TextField
                            label="Gib hier deinen Prompt ein..."
                            multiline
                            minRows={3}
                            value={userMessage}
                            onChange={(e) => setUserMessage(e.target.value)}
                        />
                        <Button type="submit" variant="contained" disabled={loading}>
                            Senden
                        </Button>
                    </Box>
                </CardContent>
            </Card>

            {loading && (
                <Box display="flex" justifyContent="center" mb={2}>
                    <LoadingSpinner />
                </Box>
            )}

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {/* Nachrichten-Verlauf (neueste oben) */}
            {[...messages].reverse().map((msg, i) => (
                <Card
                    key={i}
                    variant="outlined"
                    sx={{
                        mb: 2,
                        backgroundColor:
                            msg.role === "assistant" ? "azure"
                                : msg.role === "user" ? "whitesmoke"
                                    : "#f0f0f0"
                    }}
                >
                    <CardContent sx={{ position: "relative" }}>
                        {/* Wer ist es? */}
                        <Typography variant="subtitle2" color="text.secondary">
                            {msg.role === "assistant"
                                ? "Assistant"
                                : msg.role === "user"
                                    ? "You"
                                    : "System"}
                        </Typography>

                        {/* Textinhalt */}
                        <Typography variant="body1" paragraph>
                            {msg.content}
                        </Typography>

                        {/* Falls der User PDFs hochgeladen hat, zeigen wir ein kleines Label. */}
                        {msg.attachedPdfNames && msg.attachedPdfNames.length > 0 && (
                            <Box
                                sx={{
                                    position: "absolute",
                                    top: 8,
                                    right: 8,
                                    backgroundColor: "#fff",
                                    border: "1px solid #ccc",
                                    borderRadius: 4,
                                    padding: "4px 8px",
                                    fontSize: "0.8rem"
                                }}
                            >
                                {msg.attachedPdfNames.map((pdfName) => (
                                    <Typography
                                        key={pdfName}
                                        variant="caption"
                                        display="block"
                                        sx={{ fontWeight: 600 }}
                                    >
                                        + {pdfName}
                                    </Typography>
                                ))}
                            </Box>
                        )}

                        {/* Info: Model, Zeit, usw., nur beim Assistant */}
                        {msg.role === "assistant" && (
                            <>
                                {msg.model && (
                                    <Typography variant="caption" display="block">
                                        <strong>Model:</strong> {msg.model}
                                    </Typography>
                                )}
                                {msg.createdAt && (
                                    <Typography variant="caption" display="block">
                                        <strong>Erstellt am:</strong> {formatDate(msg.createdAt)}
                                    </Typography>
                                )}
                            </>
                        )}
                    </CardContent>
                </Card>
            ))}
        </Container>
    );
};

export default ChatPage;
