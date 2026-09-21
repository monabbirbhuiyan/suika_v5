"use client";

import React from "react";
import {
  Sparkles,
  CheckCircle2,
  X,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "../ui/button";
import { Fragment, GraphNode } from "@/generated/prisma";
import { createFragment } from "@/action/fragments";

type FragmentSuggestion = {
  nodeId: string;
  nodeTitle: string;
  type: string;
  content: string;
  reason: string;
};

type Props = {
  problemSpaceId: string;
  node: GraphNode;
  fragments: Fragment[];
  onFragmentCreated?: () => void;
};

const typeStyles: Record<string, { bg: string; text: string; dot: string }> = {
  QUESTION: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
  IDEA: { bg: "bg-sky-50", text: "text-sky-700", dot: "bg-sky-500" },
  OBSERVATION: { bg: "bg-orange-50", text: "text-orange-700", dot: "bg-orange-500" },
  CONSTRAINS: { bg: "bg-rose-50", text: "text-rose-700", dot: "bg-rose-500" },
  CONCLUSION: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
};

export default function FragmentSuggestions({
  problemSpaceId,
  node,
  fragments,
  onFragmentCreated,
}: Props) {
  const [suggestions, setSuggestions] = React.useState<FragmentSuggestion[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [expanded, setExpanded] = React.useState(true);
  const [acceptedIds, setAcceptedIds] = React.useState<Set<number>>(new Set());
  const [creatingId, setCreatingId] = React.useState<number | null>(null);

  const fetchSuggestions = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/suggest-fragments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ problemSpaceId }),
      });

      const payload = (await response.json().catch(() => null)) as {
        suggestions?: FragmentSuggestion[];
        error?: string;
        message?: string;
      } | null;

      if (!response.ok || !payload?.suggestions) {
        throw new Error(payload?.message || payload?.error || "Failed to get suggestions");
      }

      setSuggestions(payload.suggestions);
      setExpanded(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get suggestions");
    } finally {
      setLoading(false);
    }
  };

  const acceptSuggestion = async (index: number, suggestion: FragmentSuggestion) => {
    setCreatingId(index);

    try {
      await createFragment(problemSpaceId, {
        content: suggestion.content,
        nodeId: suggestion.nodeId,
        type: suggestion.type as Fragment["type"],
      });

      setAcceptedIds((prev) => new Set(prev).add(index));
      onFragmentCreated?.();
    } catch {
      // Silently fail
    } finally {
      setCreatingId(null);
    }
  };

  const dismissSuggestion = (index: number) => {
    setAcceptedIds((prev) => new Set(prev).add(index));
  };

  const visibleSuggestions = suggestions.filter((_, i) => !acceptedIds.has(i));

  React.useEffect(() => {
    setSuggestions([]);
    setAcceptedIds(new Set());
    setError(null);
    void fetchSuggestions();
  }, [node.id]);

  if (suggestions.length === 0 && !loading && !error) {
    return (
      <div className="rounded-lg border border-dashed border-stone-200 bg-stone-50/50 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-[#12753e]" />
            <span className="text-[11px] font-medium text-stone-600">
              AI Suggestions
            </span>
          </div>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-6 px-2 text-[10px] text-[#12753e] hover:bg-[#dff3e7]"
            onClick={fetchSuggestions}
            disabled={loading}
          >
            <Sparkles className="h-3 w-3 mr-1" />
            Get Suggestions
          </Button>
        </div>
        <p className="text-[10px] text-stone-400 mt-1.5">
          Let AI analyze your case and suggest fragments to strengthen it
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-[#12753e]/15 bg-[#dff3e7]/20 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 text-left"
        >
          <Sparkles className="h-3.5 w-3.5 text-[#12753e]" />
          <span className="text-[11px] font-semibold text-stone-700">
            AI Suggestions
          </span>
          {visibleSuggestions.length > 0 && (
            <span className="inline-flex items-center justify-center h-4 min-w-[16px] px-1 rounded bg-[#12753e] text-white text-[9px] font-bold">
              {visibleSuggestions.length}
            </span>
          )}
        </button>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-6 px-2 text-[10px] text-stone-500 hover:text-stone-700"
            onClick={fetchSuggestions}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              "Refresh"
            )}
          </Button>
          {expanded ? (
            <ChevronUp className="h-3 w-3 text-stone-400" />
          ) : (
            <ChevronDown className="h-3 w-3 text-stone-400" />
          )}
        </div>
      </div>

      {/* Content */}
      {expanded && (
        <div className="px-3 pb-3 space-y-2">
          {loading && suggestions.length === 0 ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin text-[#12753e] mr-2" />
              <span className="text-[11px] text-stone-500">Analyzing case...</span>
            </div>
          ) : error ? (
            <div className="text-center py-3">
              <p className="text-[11px] text-red-500">{error}</p>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="mt-1 h-6 text-[10px] text-[#12753e]"
                onClick={fetchSuggestions}
              >
                Try again
              </Button>
            </div>
          ) : visibleSuggestions.length === 0 ? (
            <div className="text-center py-3">
              <CheckCircle2 className="h-5 w-5 text-[#12753e] mx-auto mb-1" />
              <p className="text-[11px] text-stone-600 font-medium">All done!</p>
              <p className="text-[10px] text-stone-400">All suggestions reviewed</p>
            </div>
          ) : (
            visibleSuggestions.map((suggestion, i) => {
              const style = typeStyles[suggestion.type] ?? typeStyles.IDEA;
              const originalIndex = suggestions.indexOf(suggestion);

              return (
                <div
                  key={`${suggestion.nodeId}-${i}`}
                  className="rounded-lg bg-white border border-stone-100 p-2.5 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
                      <span className={`text-[9px] font-bold uppercase tracking-wider ${style.text}`}>
                        {suggestion.type}
                      </span>
                    </div>
                    <span className="text-[9px] text-stone-400 truncate">
                      {suggestion.nodeTitle}
                    </span>
                  </div>

                  <p className="text-[11.5px] text-stone-700 leading-relaxed">
                    {suggestion.content}
                  </p>

                  <p className="text-[10px] text-stone-400 italic">
                    {suggestion.reason}
                  </p>

                  <div className="flex items-center gap-1.5 pt-0.5">
                    <Button
                      type="button"
                      size="sm"
                      className="h-6 px-2.5 text-[10px] bg-[#12753e] hover:bg-[#0d582f] text-white"
                      onClick={() => acceptSuggestion(originalIndex, suggestion)}
                      disabled={creatingId === originalIndex}
                    >
                      {creatingId === originalIndex ? (
                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                      ) : (
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                      )}
                      Add
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-6 px-2 text-[10px] text-stone-400 hover:text-stone-600"
                      onClick={() => dismissSuggestion(originalIndex)}
                    >
                      <X className="h-3 w-3 mr-0.5" />
                      Skip
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
