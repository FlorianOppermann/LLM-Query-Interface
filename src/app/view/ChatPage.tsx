"use client";

import React, { useState } from "react";
import {
    Container,
    Card,
    CardContent,
    TextField,
    Button,
    Typography,
    Box,
    Alert
} from "@mui/material";

import { sendChatRequest, formatDate } from "../controller/ChatController";
import { ChatMessage, ChatResponse } from "../model/ChatModel";
import { LocalMessage } from "../model/LocalMessage";
import LoadingSpinner from "../components/LoadingSpinner";

const ChatPage: React.FC = () => {
    // State: User-Eingabe
    const [userMessage, setUserMessage] = useState("");
    // State: Bisherige Nachrichten (User + Assistant)
    const [messages, setMessages] = useState<LocalMessage[]>([]);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setLoading(true);
        setError("");

        // 1) User-Nachricht in lokale messages pushen
        const newUserMessage: LocalMessage = {
            role: "user",
            content: userMessage
        };
        const updatedMessages = [...messages, newUserMessage];

        // 2) Request-Body vorbereiten
        const requestBody = {
            model: "llama3.1",
            stream: false,
            messages: updatedMessages.map((m) => ({
                role: m.role,
                content: m.content
            })) as ChatMessage[]
        };

        try {
            // 3) Anfrage ans LLM schicken
            const response: ChatResponse = await sendChatRequest(requestBody);
            console.log("Received chatResponse:", response);

            // 4) Assistant-Nachricht aus der Response in unsere messages einfügen
            const assistantMsg: LocalMessage = {
                role: "assistant",
                content: response.message.content,
                model: response.model,
                createdAt: response.created_at
            };

            // 5) Lokale Messages updaten
            const finalMessages = [...updatedMessages, assistantMsg];
            setMessages(finalMessages);

            // Eingabefeld leeren
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
                Chat mit LLM
            </Typography>

            {/* Eingabe-Card */}
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

            {/* Loading Spinner */}
            {loading && (
                <Box display="flex" justifyContent="center" mb={2}>
                    <LoadingSpinner />
                </Box>
            )}

            {/* Fehlermeldung */}
            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {/* Chat-Verlauf (alle Nachrichten)
          -> Neueste zuerst, daher reverse() beim Rendern */}
            {[...messages].reverse().map((msg, index) => (
                <Card
                    key={index}
                    variant="outlined"
                    sx={{
                        mb: 2,
                        backgroundColor:
                            msg.role === "assistant" ? "azure" : "whitesmoke"
                    }}
                >
                    <CardContent>
                        <Typography variant="subtitle2" color="text.secondary">
                            {msg.role === "user" ? "You" : "Assistant"}
                        </Typography>
                        <Typography variant="body1" paragraph>
                            {msg.content}
                        </Typography>

                        {/* Metadaten nur für Assistant */}
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
