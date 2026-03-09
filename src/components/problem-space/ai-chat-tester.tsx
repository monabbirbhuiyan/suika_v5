"use client";

import React from "react";
import { Loader2, SendHorizonal } from "lucide-react";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const AiChatTester = () => {
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [input, setInput] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

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
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: nextMessages.map((message) => ({
            role: message.role,
            content: message.content,
          })),
          maxTokens: 300,
          temperature: 0.7,
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

      const reply = payload.reply;

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: reply,
        },
      ]);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unexpected error";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-border/70 bg-card/50 p-3 md:p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-medium">AI Chat Tester</h3>
        <p className="text-[11px] text-muted-foreground">
          Uses `POST /api/ai/chat`
        </p>
      </div>

      <div className="mb-3 h-56 overflow-y-auto rounded-md border border-border/60 bg-background p-3">
        {messages.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            Send a message like "Who are you?" to verify your Gemini setup.
          </p>
        ) : (
          <div className="space-y-2">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`rounded-md px-3 py-2 text-sm ${
                  message.role === "user"
                    ? "ml-8 bg-primary/10 text-foreground"
                    : "mr-8 bg-muted text-foreground"
                }`}
              >
                <p className="mb-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                  {message.role}
                </p>
                <p className="whitespace-pre-wrap">{message.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Ask AI something..."
          className="min-h-20"
          onKeyDown={(event) => {
            if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
              event.preventDefault();
              void sendMessage();
            }
          }}
        />

        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] text-muted-foreground">
            Press Ctrl/Cmd + Enter to send
          </p>
          <Button
            onClick={() => void sendMessage()}
            disabled={loading || !input.trim()}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending
              </>
            ) : (
              <>
                <SendHorizonal className="h-4 w-4" />
                Send
              </>
            )}
          </Button>
        </div>

        {error ? <p className="text-xs text-destructive">{error}</p> : null}
      </div>
    </div>
  );
};

export default AiChatTester;
