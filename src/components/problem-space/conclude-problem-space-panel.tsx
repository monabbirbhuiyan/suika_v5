"use client";

import React from "react";
import { Loader2, Target } from "lucide-react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";

type ConclusionResult = {
  conclusion: string;
  why: string;
  description: string;
  suggestions: string[];
  advice: string[];
  confidence: "HIGH" | "MEDIUM" | "LOW";
  basedOnQuestionCount: number;
  totalQuestionCount: number;
};

type Props = {
  problemSpaceId: string;
};

const ConcludeProblemSpacePanel = ({ problemSpaceId }: Props) => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<ConclusionResult | null>(null);

  const runConclusion = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/conclude-problem-space", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ problemSpaceId }),
      });

      const payload = (await response.json().catch(() => null)) as {
        result?: ConclusionResult;
        error?: string;
        message?: string;
      } | null;

      if (!response.ok || !payload?.result) {
        throw new Error(
          payload?.message ??
            payload?.error ??
            "Failed to conclude problem space.",
        );
      }

      setResult(payload.result);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Failed to conclude problem space.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const confidenceClass =
    result?.confidence === "HIGH"
      ? "text-emerald-700"
      : result?.confidence === "LOW"
        ? "text-amber-700"
        : "text-blue-700";

  return (
    <div className="border-b border-border/40 bg-background px-5 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-foreground">
            Conclude Problem Space
          </p>
          <p className="text-[11px] text-muted-foreground">
            Generate one AI conclusion that best matches the most questions
            across nodes.
          </p>
        </div>
        <Button
          type="button"
          onClick={runConclusion}
          disabled={isLoading}
          className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs"
        >
          {isLoading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Target className="h-3.5 w-3.5" />
          )}
          {isLoading ? "Concluding..." : "Conclude Problem Space"}
        </Button>
      </div>

      {error ? <p className="mt-2 text-xs text-destructive">{error}</p> : null}

      {result ? (
        <Card className="mt-3 p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              AI Conclusion
            </p>
            <p className={`text-xs font-semibold ${confidenceClass}`}>
              {result.confidence} confidence
            </p>
          </div>

          <p className="mt-2 text-sm font-medium text-foreground">
            {result.conclusion}
          </p>

          <p className="mt-3 text-xs font-semibold text-foreground">
            Why this conclusion
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{result.why}</p>

          <p className="mt-3 text-xs font-semibold text-foreground">
            Description
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {result.description}
          </p>

          {result.suggestions.length > 0 ? (
            <div className="mt-3">
              <p className="text-xs font-semibold text-foreground">
                Suggestions
              </p>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-xs text-muted-foreground">
                {result.suggestions.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {result.advice.length > 0 ? (
            <div className="mt-3">
              <p className="text-xs font-semibold text-foreground">Advice</p>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-xs text-muted-foreground">
                {result.advice.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <p className="mt-3 text-[11px] text-muted-foreground">
            Coverage: {result.basedOnQuestionCount}/{result.totalQuestionCount}{" "}
            question fragments
          </p>
        </Card>
      ) : null}
    </div>
  );
};

export default ConcludeProblemSpacePanel;
