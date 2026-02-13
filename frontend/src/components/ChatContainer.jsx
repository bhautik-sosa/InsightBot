import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { useChat } from '../hooks/useChat';

const ChatContainer = () => {
    const { messages, isLoading, sendMessage, clearConversation } = useChat();

    return (
        <div className="w-full max-w-4xl mx-auto h-screen flex flex-col p-4">
            {/* Header */}
            <div className="glass rounded-t-3xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-xl">
                        🤖
                    </div>
                    <div>
                        <h1 className="font-bold text-lg">SQL Query Generator</h1>
                        <p className="text-xs text-gray-400">Powered by AI</p>
                    </div>
                </div>
                <button
                    onClick={clearConversation}
                    className="text-xs glass-dark hover:bg-white/20 px-3 py-2 rounded-lg transition-all"
                >
                    Clear Chat
                </button>
            </div>

            {/* Messages */}
            <div className="glass flex-1 overflow-hidden flex flex-col">
                <MessageList messages={messages} />
                <MessageInput onSendMessage={sendMessage} isLoading={isLoading} />
            </div>
        </div>
    );
};

export default ChatContainer;
