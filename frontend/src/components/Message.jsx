import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

const Message = ({ message }) => {
    const isUser = message.role === 'user';
    const isSQL = message.role === 'assistant' && message.content.trim().toUpperCase().startsWith('SELECT');

    return (
        <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4 animate-fade-in`}>
            <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${isUser
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                    : message.isError
                        ? 'glass border-red-500/50 text-red-200'
                        : 'glass'
                    }`}
            >
                {isUser ? (
                    <p className="text-sm leading-relaxed">{message.content}</p>
                ) : isSQL ? (
                    <div className="space-y-2">
                        <div className="text-xs text-gray-300 font-semibold uppercase tracking-wide">
                            Generated SQL Query
                        </div>
                        <SyntaxHighlighter
                            language="sql"
                            style={vscDarkPlus}
                            customStyle={{
                                margin: 0,
                                borderRadius: '0.5rem',
                                fontSize: '0.875rem',
                                background: 'rgba(0, 0, 0, 0.3)',
                            }}
                        >
                            {message.content}
                        </SyntaxHighlighter>
                    </div>
                ) : (
                    <div className="text-sm leading-relaxed min-h-[1.25rem]">
                        {message.isLoading ? (
                            <div className="flex gap-2 p-1">
                                <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '0s' }}></div>
                                <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                            </div>
                        ) : message.content || <span className="text-gray-400 italic">No response received.</span>}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Message;
