"use client";

import React from "react";
import { Loader2, SendHorizonal, Bot, User, Trash2 } from "lucide-react";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import RichMessage from "./rich-message";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type Props = {
  problemSpaceId: string;
  defendingSide: "PLAINTIFF" | "DEFENDANT";
};

const AnalysisChat = ({ problemSpaceId, defendingSide }: Props) => {
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [input, setInput] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [historyLoading, setHistoryLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  // Load chat history on mount
  React.useEffect(() => {
    const loadHistory = async () => {
      try {
        const response = await fetch(
          `/api/ai/analysis-chat/history?problemSpaceId=${problemSpaceId}`,
        );
        const payload = (await response.json().catch(() => null)) as {
          messages?: Array<{ role: string; content: string }>;
        } | null;

        if (response.ok && payload?.messages) {
          const history: ChatMessage[] = payload.messages.map((msg) => ({
            role: msg.role as "user" | "assistant",
            content: msg.content,
          }));
          setMessages(history);
        }
      } catch {
        // Silently fail - start with empty chat
      } finally {
        setHistoryLoading(false);
      }
    };

    void loadHistory();
  }, [problemSpaceId]);

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, historyLoading]);

  const clearHistory = async () => {
    try {
      await fetch("/api/ai/analysis-chat/history", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ problemSpaceId }),
      });
      setMessages([]);
    } catch {
      // Silently fail
    }
  };

  const sendMessage = async () => {
    const text = input.trim();

    if (!text || loading) {
      return;
    }

    setError(null);

    const nextMessages: ChatMessage[] = [
      ...messages,
      { role: "user", content: text },
    ];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/ai/analysis-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          problemSpaceId,
          defendingSide,
          messages: nextMessages,
        }),
      });

      const payload = (await response.json().catch(() => null)) as {
        reply?: string;
        error?: string;
        message?: string;
      } | null;

      if (!response.ok || !payload?.reply) {
        const errorMessage =
          payload?.message || payload?.error || "Request failed";
        throw new Error(errorMessage);
      }

      setMessages((current) => [
        ...current,
        { role: "assistant", content: payload.reply! },
      ]);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unexpected error";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full rounded-xl border border-stone-200/70 border-l-[3px] border-l-[#12753e] shadow-[0_1px_3px_rgba(0,0,0,0.04)] bg-white overflow-hidden">
      <div className="px-4 py-3 border-b border-stone-200/70 bg-white rounded-t-xl shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="h-4 w-4 text-[#12753e]" />
            <h3 className="text-sm font-semibold text-foreground">
              AI Legal Assistant
            </h3>
          </div>
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => void clearHistory()}
              className="h-7 px-2 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground mt-1">
          Ask questions about the analysis or request clarification
        </p>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {historyLoading ? (
          <div className="flex flex-col items-center justify-center h-full">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mb-2" />
            <p className="text-xs text-muted-foreground">Loading history...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <Bot className="h-10 w-10 text-muted-foreground/50 mb-3" />
            <p className="text-sm font-medium text-foreground">
              Start a conversation
            </p>
            <p className="text-xs text-muted-foreground mt-1 max-w-[250px]">
              Ask me about the case analysis, legal concepts, or request
              additional insights
            </p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={`flex gap-3 ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {message.role === "assistant" && (
            <div className="h-7 w-7 rounded-full bg-[#dff3e7] flex items-center justify-center shrink-0">
              <Bot className="h-4 w-4 text-[#12753e]" />
            </div>
              )}
              <div
                className={`max-w-[85%] rounded-xl px-4 py-3 ${
                  message.role === "user"
                    ? "bg-[#12753e] text-white"
                    : "bg-stone-50 border border-stone-200/60"
                }`}
              >
                {message.role === "assistant" ? (
                  <RichMessage content={message.content} />
                ) : (
                  <p className="text-[13px] whitespace-pre-wrap leading-relaxed">
                    {message.content}
                  </p>
                )}
              </div>
              {message.role === "user" && (
                <div className="h-7 w-7 rounded-full bg-stone-100 flex items-center justify-center shrink-0">
                  <User className="h-4 w-4 text-stone-500" />
                </div>
              )}
            </div>
          ))
        )}
        {loading && (
          <div className="flex gap-3 justify-start">
                <div className="h-7 w-7 rounded-full bg-[#dff3e7] flex items-center justify-center shrink-0">
                  <Bot className="h-4 w-4 text-[#12753e]" />
                </div>
            <div className="bg-muted rounded-xl px-4 py-3">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-stone-200/70 bg-white rounded-b-xl shrink-0">
        <div className="space-y-3">
          <Textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask about the analysis..."
            className="min-h-[80px] resize-none"
            onKeyDown={(event) => {
              if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
                event.preventDefault();
                void sendMessage();
              }
            }}
          />

          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] text-muted-foreground">
              Ctrl/Cmd + Enter to send
            </p>
            <Button
              onClick={() => void sendMessage()}
              disabled={loading || !input.trim()}
              size="sm"
              className="gap-2 bg-[#12753e] hover:bg-[#0d582f] text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Thinking...
                </>
              ) : (
                <>
                  <SendHorizonal className="h-3.5 w-3.5" />
                  Send
                </>
              )}
            </Button>
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
      </div>
    </div>
  );
};

export default AnalysisChat;
