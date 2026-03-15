"use client";

import { useState, useRef, useEffect } from "react";
import { X, Send, Bot, Loader2 } from "lucide-react";
import { useUIStore } from "@/store/ui-store";
import { useAI, type Message } from "@/hooks/useAI";
import { AIProductSuggestion } from "@/components/ai/AIProductSuggestion";

const suggestedPrompts = [
  "I'm new to archery, where do I start?",
  "I need a hunting bow for deer",
  "What's the best setup for 3D archery?",
  "Help me find arrows for my bow",
];

function parseProductRecommendations(content: string) {
  const regex = /<PRODUCT_RECOMMENDATIONS>([\s\S]*?)<\/PRODUCT_RECOMMENDATIONS>/g;
  const match = regex.exec(content);
  if (!match) return { text: content, products: [] };

  try {
    const products = JSON.parse(match[1]);
    const text = content.replace(regex, "").trim();
    return { text, products };
  } catch {
    return { text: content, products: [] };
  }
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  const { text, products } = isUser
    ? { text: message.content, products: [] }
    : parseProductRecommendations(message.content);

  return (
    <div className={`group flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
      <div className={`max-w-[85%] ${isUser ? "order-2" : ""}`}>
        <div
          className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
            isUser
              ? "bg-primary text-primary-foreground rounded-br-sm"
              : "bg-white/5 text-white/80 rounded-bl-sm"
          }`}
        >
          {text}
        </div>
        {products.map((product: any, i: number) => (
          <AIProductSuggestion key={i} product={product} />
        ))}
        <span className="text-[10px] text-white/20 mt-1 block px-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>
    </div>
  );
}

export function AIAssistantDrawer() {
  const isOpen = useUIStore((s) => s.isAIDrawerOpen);
  const setOpen = useUIStore((s) => s.setAIDrawerOpen);
  const { messages, isStreaming, sendMessage } = useAI();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const handleSend = () => {
    if (!input.trim() || isStreaming) return;
    sendMessage(input.trim());
    setInput("");
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 z-[80]" onClick={() => setOpen(false)} />
      )}
      <div
        className={`fixed top-0 right-0 bottom-0 w-full sm:w-[400px] bg-background z-[90] transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Bot className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-display text-lg tracking-wider uppercase text-white">Archery Advisor</h2>
              <span className="text-[10px] text-white/30">Powered by AI</span>
            </div>
          </div>
          <button onClick={() => setOpen(false)} className="p-2 text-white/50 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-5">
          {messages.length === 0 ? (
            <div className="space-y-4">
              <div className="bg-white/5 rounded-2xl p-4 text-sm text-white/60">
                Hi! I&apos;m your archery advisor. I can help you find the right gear, answer questions about equipment, and make personalized recommendations.
              </div>
              <div className="space-y-2">
                {suggestedPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => sendMessage(prompt)}
                    className="w-full text-left px-4 py-3 rounded-xl border border-white/10 text-sm text-white/60 hover:border-primary hover:text-primary transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg, i) => (
                <MessageBubble key={i} message={msg} />
              ))}
              {isStreaming && (
                <div className="flex items-center gap-2 text-white/30 text-sm px-4 py-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Thinking...
                </div>
              )}
            </>
          )}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Ask about archery gear..."
              className="flex-1 bg-white/5 border border-white/10 text-white px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-primary placeholder:text-white/30 min-h-[44px]"
              disabled={isStreaming}
            />
            <button
              onClick={handleSend}
              disabled={isStreaming || !input.trim()}
              className="p-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl transition-colors disabled:opacity-50 min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
