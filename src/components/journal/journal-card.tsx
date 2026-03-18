"use client";

import Link from "next/link";
import React from "react";
import { toast } from "sonner";
import { BookOpen, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  appendJournalEntry,
  isPromptExpired,
  readJournalEntries,
  readPromptState,
  writePromptState,
} from "@/lib/journal";
import { useRouter } from "next/navigation";

type Props = {
  userId: string;
  compact?: boolean;
};

type PromptResponse = {
  question?: string;
};

const JournalCard = ({ userId, compact = false }: Props) => {
  const [prompt, setPrompt] = React.useState<string>("");
  const [answer, setAnswer] = React.useState("");
  const [type, setType] = React.useState<"QUESTION" | "SOLVED">("QUESTION");
  const [loadingPrompt, setLoadingPrompt] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [todayCount, setTodayCount] = React.useState(0);
  const router = useRouter();

  React.useEffect(() => {
    let isMounted = true;

    const loadPrompt = async () => {
      setLoadingPrompt(true);

      const cached = readPromptState(userId);
      if (cached && !isPromptExpired(cached.askedAt)) {
        if (isMounted) {
          setPrompt(cached.question);
          setLoadingPrompt(false);
        }
      } else {
        try {
          const response = await fetch("/api/ai/journal-question", {
            method: "GET",
          });

          const payload = (await response
            .json()
            .catch(() => null)) as PromptResponse | null;

          const question =
            payload?.question?.trim() ||
            "Your next breakthrough starts here. What are you wrestling with, or what did you just solve?";

          writePromptState(userId, {
            question,
            askedAt: new Date().toISOString(),
          });

          if (isMounted) {
            setPrompt(question);
          }
        } catch {
          const fallback =
            "Your next breakthrough starts here. What are you wrestling with, or what did you just solve?";
          writePromptState(userId, {
            question: fallback,
            askedAt: new Date().toISOString(),
          });
          if (isMounted) {
            setPrompt(fallback);
          }
        } finally {
          if (isMounted) {
            setLoadingPrompt(false);
          }
        }
      }

      const entries = readJournalEntries(userId);
      const today = new Date().toLocaleDateString();
      const countToday = entries.filter(
        (entry) => new Date(entry.createdAt).toLocaleDateString() === today,
      ).length;

      if (isMounted) {
        setTodayCount(countToday);
      }
    };

    void loadPrompt();

    return () => {
      isMounted = false;
    };
  }, [userId]);

  const saveEntry = () => {
    const trimmed = answer.trim();
    if (!trimmed) {
      toast.error("Write a short journal entry first.");
      return;
    }

    setSaving(true);
    try {
      const next = appendJournalEntry(userId, {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        question: prompt,
        answer: trimmed,
        type,
      });

      const today = new Date().toLocaleDateString();
      const countToday = next.filter(
        (entry) => new Date(entry.createdAt).toLocaleDateString() === today,
      ).length;

      setTodayCount(countToday);
      setAnswer("");
      toast.success("Journal entry saved.");
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <BookOpen className="h-4 w-4" />
          Daily Momentum Journal
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {loadingPrompt ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Preparing your daily question...
          </p>
        ) : (
          <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-primary/80">
              Prompt of the Day
            </p>
            <p className="mt-1 text-sm text-foreground">{prompt}</p>
          </div>
        )}

        <div className="inline-flex rounded-full border border-border/70 p-1">
          <button
            type="button"
            onClick={() => setType("QUESTION")}
            className={`rounded-full px-3 py-1 text-xs ${
              type === "QUESTION"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground"
            }`}
          >
            I have a question
          </button>
          <button
            type="button"
            onClick={() => setType("SOLVED")}
            className={`rounded-full px-3 py-1 text-xs ${
              type === "SOLVED"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground"
            }`}
          >
            I solved something
          </button>
        </div>

        <textarea
          value={answer}
          onChange={(event) => setAnswer(event.target.value)}
          rows={compact ? 3 : 5}
          className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/50"
          placeholder={
            type === "QUESTION"
              ? "Write the key question you are carrying today..."
              : "Write what you solved today and why it matters..."
          }
        />

        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            {todayCount} entr{todayCount === 1 ? "y" : "ies"} today
          </p>
          <div className="flex items-center gap-2">
            {!compact ? null : (
              <Button
                asChild
                size="sm"
                variant="outline"
                className="rounded-full"
              >
                <Link href={`/${userId}/journal`}>Open Journal</Link>
              </Button>
            )}
            <Button
              type="button"
              size="sm"
              onClick={saveEntry}
              disabled={saving || loadingPrompt}
              className="rounded-full"
            >
              {saving ? "Saving..." : "Save Entry"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default JournalCard;
