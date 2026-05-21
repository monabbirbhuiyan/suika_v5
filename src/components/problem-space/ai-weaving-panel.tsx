"use client";

import React from "react";
import { AiSuggestion } from "@/generated/prisma";
import {
  acceptAiSuggestion,
  dismissAiSuggestion,
  generateAiWeavingSuggestions,
} from "@/action/ai-weaving";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "../ui/button";
import { parseAiSuggestionReason } from "@/lib/ai-suggestion";

type Props = {
  problemSpaceId: string;
  suggestions: AiSuggestion[];
};

const strengthStyle: Record<AiSuggestion["strength"], string> = {
  STRONG: "bg-primary/15 text-primary",
  MEDIUM: "bg-[#005b96]/15 text-[#005b96]",
  GENTLE: "bg-muted text-muted-foreground",
};

const kindLabel: Record<string, string> = {
  MISSING_QUESTION: "Missing Question",
  EVIDENCE_GAP: "Evidence Gap",
};

type SuggestionFilter = "ALL" | "MISSING_QUESTION" | "EVIDENCE_GAP";

const AiWeavingPanel = ({ problemSpaceId, suggestions }: Props) => {
  const router = useRouter();
  const [loadingAction, setLoadingAction] = React.useState<string | null>(null);
  const [filter, setFilter] = React.useState<SuggestionFilter>("ALL");

  const activeSuggestions = suggestions.filter(
    (item) => !item.accepted && !item.dismissedAt,
  );

  const enrichedActiveSuggestions = activeSuggestions.map((item) => {
    const detail = parseAiSuggestionReason(item.reason);
    const kind =
      detail?.kind ??
      (item.toTitle === "MISSING_QUESTION" || item.toTitle === "EVIDENCE_GAP"
        ? item.toTitle
        : "MISSING_QUESTION");

    return {
      item,
      detail,
      kind,
    };
  });

  const missingQuestionCount = enrichedActiveSuggestions.filter(
    (entry) => entry.kind === "MISSING_QUESTION",
  ).length;

  const evidenceGapCount = enrichedActiveSuggestions.filter(
    (entry) => entry.kind === "EVIDENCE_GAP",
  ).length;

  const visibleSuggestions =
    filter === "ALL"
      ? enrichedActiveSuggestions
      : enrichedActiveSuggestions.filter((entry) => entry.kind === filter);

  const acceptedCount = suggestions.filter((item) => item.accepted).length;

  const handleGenerate = async () => {
    setLoadingAction("generate");

    try {
      const response = await generateAiWeavingSuggestions(problemSpaceId);

      if (!response) {
        toast.error("Unable to generate suggestions.");
        return;
      }

      if (response.created === 0) {
        toast.message("No new suggestions right now.");
      } else {
        toast.success(`Generated ${response.created} suggestion(s).`);
      }

      router.refresh();
    } catch {
      toast.error("Failed to generate AI weaving suggestions.");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleAccept = async (suggestionId: string) => {
    setLoadingAction(`accept-${suggestionId}`);

    try {
      const response = await acceptAiSuggestion(problemSpaceId, suggestionId);

      if (!response) {
        toast.error("Unable to accept suggestion.");
        return;
      }

      toast.success("Suggestion accepted.");
      router.refresh();
    } catch {
      toast.error("Failed to accept suggestion.");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleDismiss = async (suggestionId: string) => {
    setLoadingAction(`dismiss-${suggestionId}`);

    try {
      const response = await dismissAiSuggestion(problemSpaceId, suggestionId);

      if (!response) {
        toast.error("Unable to dismiss suggestion.");
        return;
      }

      toast.success("Suggestion dismissed.");
      router.refresh();
    } catch {
      toast.error("Failed to dismiss suggestion.");
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="rounded-xl border border-border/70 bg-card/50 p-3 md:p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-medium">AI Weaving Suggestions</h3>
          <p className="text-[11px] text-muted-foreground">
            Diagnose missing questions and evidence gaps without editing your
            original fragments.
          </p>
        </div>

        <Button
          onClick={() => void handleGenerate()}
          disabled={loadingAction === "generate"}
        >
          {loadingAction === "generate" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Generate Suggestions
            </>
          )}
        </Button>
      </div>

      <div className="mb-3 flex items-center gap-3 text-[11px] text-muted-foreground">
        <span>{activeSuggestions.length} active</span>
        <span>{acceptedCount} accepted</span>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant={filter === "ALL" ? "default" : "secondary"}
          onClick={() => setFilter("ALL")}
        >
          All ({activeSuggestions.length})
        </Button>
        <Button
          size="sm"
          variant={filter === "MISSING_QUESTION" ? "default" : "secondary"}
          onClick={() => setFilter("MISSING_QUESTION")}
        >
          Missing Questions ({missingQuestionCount})
        </Button>
        <Button
          size="sm"
          variant={filter === "EVIDENCE_GAP" ? "default" : "secondary"}
          onClick={() => setFilter("EVIDENCE_GAP")}
        >
          Evidence Gaps ({evidenceGapCount})
        </Button>
      </div>

      {visibleSuggestions.length === 0 ? (
        <p className="rounded-md border border-dashed p-3 text-xs text-muted-foreground">
          No suggestions in this filter right now. Try another filter or click
          "Generate Suggestions".
        </p>
      ) : (
        <div className="space-y-2">
          {visibleSuggestions.map(({ item, detail }) =>
            (() => {
              return (
                <div
                  key={item.id}
                  className="rounded-md border border-border/70 bg-background p-3"
                >
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <p className="text-sm font-medium">
                      {item.fromTitle}{" "}
                      <span className="text-muted-foreground">-&gt;</span>{" "}
                      {kindLabel[item.toTitle] ?? item.toTitle}
                    </p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] ${strengthStyle[item.strength]}`}
                    >
                      {item.strength}
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    {detail?.summary ?? item.reason}
                  </p>

                  {detail ? (
                    <div className="mt-3 space-y-2">
                      <div className="rounded-md border border-border/70 bg-card/40 p-2">
                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                          Focus Fragment
                        </p>
                        <p className="text-xs font-medium text-foreground mt-1">
                          {detail.focus.nodeTitle} ({detail.focus.fragmentType})
                        </p>
                        <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">
                          {detail.focus.fragmentContent}
                        </p>
                      </div>

                      <div className="rounded-md border border-border/70 bg-card/40 p-2">
                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                          Recommendation
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Why: {detail.rationale}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-2 uppercase tracking-wide">
                          {detail.kind === "MISSING_QUESTION"
                            ? "Question to ask"
                            : "Evidence to gather"}
                        </p>
                        <p className="text-xs text-foreground whitespace-pre-wrap">
                          {detail.recommendation}
                        </p>
                      </div>
                    </div>
                  ) : null}

                  <div className="mt-3 flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => void handleDismiss(item.id)}
                      disabled={
                        loadingAction === `dismiss-${item.id}` ||
                        loadingAction === `accept-${item.id}`
                      }
                    >
                      {loadingAction === `dismiss-${item.id}`
                        ? "Dismissing..."
                        : "Dismiss"}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => void handleAccept(item.id)}
                      disabled={
                        loadingAction === `dismiss-${item.id}` ||
                        loadingAction === `accept-${item.id}`
                      }
                    >
                      {loadingAction === `accept-${item.id}`
                        ? "Accepting..."
                        : "Accept"}
                    </Button>
                  </div>
                </div>
              );
            })(),
          )}
        </div>
      )}
    </div>
  );
};

export default AiWeavingPanel;
