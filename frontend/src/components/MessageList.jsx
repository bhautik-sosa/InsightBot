import { useEffect, useRef } from 'react';
import Message from './Message';

const MessageList = ({ messages }) => {
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    return (
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
            {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className="glass rounded-3xl p-8 max-w-md">
                        <div className="text-6xl mb-4">🤖</div>
                        <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                            SQL Chatbot
                        </h2>
                        <p className="text-gray-300 text-sm">
                            Ask me anything about your loan data, and I'll generate the SQL query for you!
                        </p>
                        <div className="mt-6 space-y-2 text-left">
                            <p className="text-xs text-gray-400">Try asking:</p>
                            <div className="space-y-1">
                                <div className="text-xs glass-dark rounded-lg px-3 py-2">
                                    "Show me all active loans"
                                </div>
                                <div className="text-xs glass-dark rounded-lg px-3 py-2">
                                    "Get loans with amount greater than 50000"
                                </div>
                                <div className="text-xs glass-dark rounded-lg px-3 py-2">
                                    "Count loans by status"
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <>
                    {messages.map((message) => (
                        <Message key={message.id} message={message} />
                    ))}
                    <div ref={messagesEndRef} />
                </>
            )}
        </div>
    );
};

export default MessageList;
