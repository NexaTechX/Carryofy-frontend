import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, ShoppingCart, User, Bot, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { aiChatApi, ChatMessage } from '../../lib/api/ai-chat';
import Image from 'next/image';

interface AIChatWindowProps {
    onClose: () => void;
}

export default function AIChatWindow({ onClose }: AIChatWindowProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isLoading]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: ChatMessage = {
            id: Date.now().toString(),
            sender: 'user',
            text: input,
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await aiChatApi.sendMessage(input);
            const aiMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                sender: 'ai',
                text: response.reply,
                timestamp: new Date(),
                products: response.products,
            };
            setMessages(prev => [...prev, aiMessage]);
        } catch (error) {
            console.error('Chat error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full glass-card border border-white/20 rounded-3xl shadow-2xl overflow-hidden bg-white/80 backdrop-blur-xl">
            {/* Header */}
            <div className="p-4 bg-primary text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                        <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                        <h3 className="font-heading font-bold text-sm">Carryofy Assistant</h3>
                        <span className="text-[10px] opacity-80">Online | Powered by AI</span>
                    </div>
                </div>
                <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
                    <Loader2 className="w-5 h-5 animate-spin hidden" />
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth" ref={scrollRef}>
                {messages.length === 0 && (
                    <div className="text-center py-10 opacity-60">
                        <Bot className="w-10 h-10 mx-auto mb-2" />
                        <p className="text-sm">Hello! I'm your Carryofy shopping assistant. How can I help you today?</p>
                    </div>
                )}

                {messages.map((m) => (
                    <div key={m.id} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] rounded-2xl p-3 text-sm ${m.sender === 'user'
                                ? 'bg-primary text-white rounded-tr-none'
                                : 'bg-white border border-gray-100 shadow-sm rounded-tl-none text-gray-800'
                            }`}>
                            {m.text}

                            {/* Product Cards */}
                            {m.products && m.products.length > 0 && (
                                <div className="mt-3 space-y-2">
                                    {m.products.map((p: any) => (
                                        <div key={p.id} className="flex gap-2 p-2 bg-gray-50 rounded-xl border border-gray-100 items-center">
                                            <div className="w-12 h-12 relative rounded-lg overflow-hidden shrink-0 border border-gray-200">
                                                {p.images && p.images[0] ? (
                                                    <Image src={p.images[0]} alt={p.title} fill className="object-cover" />
                                                ) : (
                                                    <div className="bg-gray-200 w-full h-full" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-[11px] truncate">{p.title}</p>
                                                <p className="text-primary font-bold text-[10px]">₦{(p.price / 100).toLocaleString()}</p>
                                            </div>
                                            <button className="p-1.5 bg-primary/10 text-primary rounded-lg hover:bg-primary hover:text-white transition-colors">
                                                <ShoppingCart className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-white border border-gray-100 shadow-sm rounded-2xl rounded-tl-none p-3 flex items-center gap-2">
                            <span className="dot animate-bounce">.</span>
                            <span className="dot animate-bounce delay-100">.</span>
                            <span className="dot animate-bounce delay-200">.</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-100 bg-white/50 backdrop-blur-md">
                <div className="relative flex items-center">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Search products or ask a question..."
                        className="w-full bg-gray-100 rounded-2xl py-3 pl-4 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || isLoading}
                        className="absolute right-2 p-2 bg-primary text-white rounded-xl hover:shadow-lg hover:shadow-primary/30 transition-all disabled:opacity-50"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
