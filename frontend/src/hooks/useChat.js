import { useState, useEffect, useRef } from 'react';

const API_BASE_URL = 'http://localhost:3000';

export const useChat = () => {
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const sendMessage = async (userMessage) => {
        if (!userMessage.trim()) return;

        // Add user message to chat
        const userMsg = {
            id: Date.now(),
            role: 'user',
            content: userMessage,
            timestamp: new Date(),
        };
        setMessages((prev) => [...prev, userMsg]);
        setIsLoading(true);

        // Create assistant message placeholder
        const assistantMsgId = Date.now() + 1;
        const assistantMsg = {
            id: assistantMsgId,
            role: 'assistant',
            content: '',
            timestamp: new Date(),
            isLoading: true,
        };
        setMessages((prev) => [...prev, assistantMsg]);

        try {
            const response = await fetch(`${API_BASE_URL}/api/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: userMessage
                    // history: messages.map((msg) => ({
                    //     role: msg.role,
                    //     content: msg.content
                    // }))
                }),
            });

            const data = await response.json();

            if (data.success) {
                setMessages((prev) =>
                    prev.map((msg) =>
                        msg.id === assistantMsgId
                            ? { ...msg, content: data.response, isLoading: false }
                            : msg
                    )
                );
            } else {
                throw new Error(data.error || 'Failed to get response');
            }
        } catch (error) {
            console.error('Error sending message:', error);
            setMessages((prev) =>
                prev.map((msg) =>
                    msg.id === assistantMsgId
                        ? {
                            ...msg,
                            content: `Error: ${error.message || 'Failed to connect to the server. Please make sure the backend is running.'}`,
                            isError: true,
                            isLoading: false,
                        }
                        : msg
                )
            );
        } finally {
            setIsLoading(false);
        }
    };

    const clearConversation = () => {
        setMessages([]);
    };

    return {
        messages,
        isLoading,
        sendMessage,
        clearConversation,
    };
};
