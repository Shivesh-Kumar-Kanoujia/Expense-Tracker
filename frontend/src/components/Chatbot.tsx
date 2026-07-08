import { useState, useRef, useEffect, useCallback } from "react";
import { MessageCircle, X, Send, Bot, User, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { sendMessage } from "@/api/chat";

interface Message {
  id: string;
  role: "user" | "bot";
  content: string;
}

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

function ChatMessage({ message }: { message: Message }) {
  const isUser = message.role === "user";
  return (
    <div className={cn("flex gap-3", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div className="flex-shrink-0 mt-1">
          <Bot className="h-6 w-6 text-accent" />
        </div>
      )}
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
          isUser
            ? "bg-primary text-white rounded-br-md"
            : "bg-bg-card-hover text-text border border-border rounded-bl-md"
        )}
      >
        {message.content}
      </div>
      {isUser && (
        <div className="flex-shrink-0 mt-1">
          <User className="h-6 w-6 text-primary" />
        </div>
      )}
    </div>
  );
}

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "bot",
      content: "Hi! I'm your expense assistant. I can help you add expenses, check your spending, manage categories, and more. Try asking me something!",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (open) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open, messages, scrollToBottom]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    const userMsg: Message = { id: generateId(), role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const reply = await sendMessage(text);
      const botMsg: Message = { id: generateId(), role: "bot", content: reply };
      setMessages((prev) => [...prev, botMsg]);
    } catch {
      const errorMsg: Message = {
        id: generateId(),
        role: "bot",
        content: "Sorry, I couldn't reach the server. Please try again.",
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  }, [input, loading]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/40 z-40 md:bg-transparent md:pointer-events-none" onClick={() => setOpen(false)} />
      )}

      <div className={cn("fixed z-50", open ? "bottom-20 right-4 md:bottom-24 md:right-6" : "bottom-6 right-4 md:bottom-6 md:right-6")}>
        {open && (
          <div
            className={cn(
              "w-[calc(100vw-2rem)] sm:w-96 h-[500px] max-h-[70vh]",
              "bg-bg-card border border-border rounded-2xl shadow-2xl",
              "flex flex-col overflow-hidden",
              "animate-in fade-in slide-in-from-bottom-4 duration-200"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-bg-card-hover/50">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-accent/20 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-accent" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-text">Expense Assistant</p>
                  <p className="text-xs text-text-secondary">Mixtral • Groq</p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="h-8 w-8 rounded-lg flex items-center justify-center text-text-secondary hover:text-text hover:bg-bg-card-hover transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scroll-smooth">
              {messages.map((msg) => (
                <ChatMessage key={msg.id} message={msg} />
              ))}
              {loading && (
                <div className="flex gap-3 justify-start">
                  <div className="flex-shrink-0 mt-1">
                    <Bot className="h-6 w-6 text-accent" />
                  </div>
                  <div className="bg-bg-card-hover text-text-secondary border border-border rounded-2xl rounded-bl-md px-4 py-2.5 text-sm flex items-center gap-1.5">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Thinking...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="border-t border-border p-4 bg-bg-card">
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask me anything..."
                  disabled={loading}
                  className={cn(
                    "flex-1 bg-black/10 border border-border rounded-xl px-4 py-2.5 text-sm text-text",
                    "placeholder:text-text-muted outline-none",
                    "focus:ring-2 focus:ring-primary focus:border-transparent",
                    "disabled:opacity-50 transition-all"
                  )}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || loading}
                  className={cn(
                    "h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all",
                    input.trim() && !loading
                      ? "bg-primary text-white hover:bg-primary/90"
                      : "bg-bg-card-hover text-text-muted cursor-not-allowed"
                  )}
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={() => setOpen((p) => !p)}
          className={cn(
            "h-14 w-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-200",
            "hover:scale-105 active:scale-95",
            open
              ? "bg-error text-white rotate-90"
              : "bg-primary text-white"
          )}
        >
          {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
        </button>
      </div>
    </>
  );
}
