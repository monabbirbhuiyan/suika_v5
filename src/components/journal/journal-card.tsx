"use client";

import Link from "next/link";
import React from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  appendJournalEntry,
  isPromptExpired,
  readPromptState,
  writePromptState,
} from "@/lib/journal";
import { useRouter } from "next/navigation";
import { useJournalEntries } from "./journal-context";

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
  const { entries, refreshEntries } = useJournalEntries();

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
  }, [userId, entries]);

  const saveEntry = async () => {
    const trimmed = answer.trim();
    if (!trimmed) {
      toast.error("Write a short journal entry first.");
      return;
    }

    setSaving(true);
    try {
      const created = await appendJournalEntry({
        question: prompt,
        answer: trimmed,
        type,
      });

      if (!created) {
        toast.error("Failed to save journal entry.");
        return;
      }

      await refreshEntries();

      const today = new Date().toLocaleDateString();
      const countToday = [...entries, created].filter(
        (entry) => new Date(entry.createdAt).toLocaleDateString() === today,
      ).length;

      setTodayCount(countToday);
      setAnswer("");
      toast.success("Journal entry saved.");
    } finally {
      setSaving(false);
      router.refresh();
    }
  };

  return (
    <div className="relative mx-auto w-full max-w-lg">
      {/* Pin */}
      <div className="absolute -top-3 left-1/2 z-10 -translate-x-1/2">
        <div className="h-6 w-3 rounded-full bg-[#bc000e] shadow-md" />
      </div>

      {/* Note */}
      <div className="relative rounded-sm bg-[#e8f5ee] shadow-[4px_6px_24px_rgba(0,0,0,0.18)] rotate-[-0.5deg]">
        {/* Fold corner */}
        <div className="absolute bottom-0 right-0 h-8 w-8 bg-linear-to-tl from-[#90c8a8] to-transparent" />

        <div className="p-6 space-y-4">
          {/* Date + count */}
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[#12753e]">
              {new Date().toLocaleDateString(undefined, {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </p>
            <span className="text-[11px] text-[#2d6e47]">
              {todayCount} today
            </span>
          </div>

          {/* Prompt */}
          {loadingPrompt ? (
            <div className="flex items-center gap-2 text-xs text-[#2d6e47]">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Loading prompt…
            </div>
          ) : (
            <p className="text-sm leading-relaxed text-[#0d4f2a] italic border-b border-dashed border-[#7ab894] pb-3">
              &ldquo;{prompt}&rdquo;
            </p>
          )}

          {/* Type toggle */}
          <div className="flex gap-2">
            {(["QUESTION", "SOLVED"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-all border ${
                  type === t
                    ? "bg-[#12753e] text-white border-[#12753e]"
                    : "bg-transparent text-[#2d6e47] border-[#7ab894] hover:bg-[#c8e8d4]"
                }`}
              >
                {t === "QUESTION" ? "Question" : "Solved ✓"}
              </button>
            ))}
          </div>

          {/* Textarea — lined paper style */}
          <div className="relative">
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              rows={compact ? 4 : 6}
              className="w-full resize-none bg-transparent px-0 py-1 text-sm text-[#0d4f2a] outline-none placeholder:text-[#2d6e47]/50 leading-7"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(transparent, transparent 27px, #7ab89455 27px, #7ab89455 28px)",
              }}
              placeholder={
                type === "QUESTION"
                  ? "What question are you carrying today?"
                  : "What did you solve, and why does it matter?"
              }
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-1">
            {compact && (
              <Link
                href={`/journal/${userId}`}
                className="text-xs text-[#2d6e47] underline underline-offset-2 hover:text-[#0d4f2a]"
              >
                Open Journal
              </Link>
            )}
            <Button
              type="button"
              size="sm"
              onClick={saveEntry}
              disabled={saving || loadingPrompt}
              className="ml-auto rounded-full bg-[#12753e] text-white hover:bg-[#0d4f2a] text-xs px-5"
            >
              {saving ? "Pinning…" : "Pin it"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JournalCard;
