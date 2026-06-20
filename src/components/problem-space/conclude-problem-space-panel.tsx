"use client";

import React from "react";
import { Loader2, Target, Scale } from "lucide-react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";

type ApplicableLaw = {
  title: string;
  citation: string;
  url: string | null;
  relevance: string;
  documentType: string;
};

type ConclusionResult = {
  conclusion: string;
  why: string;
  description: string;
  suggestions: string[];
  advice: string[];
  confidence: "HIGH" | "MEDIUM" | "LOW";
  basedOnQuestionCount: number;
  totalQuestionCount: number;
  applicableLaws?: ApplicableLaw[];
  controllingAuthority?: Array<{
    citation: string;
    jurisdiction: string;
    weight: string;
  }>;
  elementAnalysis?: Array<{
    element: string;
    satisfied: boolean;
    supportingFragments: string[];
    gaps: string[];
  }>;
  proceduralPosture?: string;
  standardOfReview?: string;
  missingJurisdictionalFacts?: string[];
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

          {result.applicableLaws && result.applicableLaws.length > 0 ? (
            <div className="mt-4 rounded-md border border-border/50 bg-muted/30 p-3">
              <div className="flex items-center gap-1.5">
                <Scale className="h-3.5 w-3.5 text-emerald-600" />
                <p className="text-xs font-semibold text-foreground">
                  Applicable Laws from CanLII
                </p>
              </div>
              <ul className="mt-2 space-y-2">
                {result.applicableLaws.map((law, idx) => (
                  <li key={idx} className="text-xs">
                    <div className="flex items-start gap-2">
                      <span className="mt-0.5 inline-flex h-4 min-w-4 shrink-0 items-center justify-center rounded bg-emerald-100 px-1 text-[10px] font-bold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-baseline gap-x-2">
                          {law.url ? (
                            <a
                              href={law.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium text-foreground underline decoration-border/50 underline-offset-2 hover:text-emerald-600"
                            >
                              {law.title}
                            </a>
                          ) : (
                            <span className="font-medium text-foreground">
                              {law.title}
                            </span>
                          )}
                          <span className="text-muted-foreground">
                            {law.citation}
                          </span>
                        </div>
                        <p className="mt-0.5 text-muted-foreground">
                          {law.relevance}
                        </p>
                        <span className="mt-0.5 inline-block rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                          {law.documentType.replace("_", " ")}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {result.controllingAuthority && result.controllingAuthority.length > 0 ? (
            <div className="mt-3">
              <p className="text-xs font-semibold text-foreground">
                Controlling Authority
              </p>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-xs text-muted-foreground">
                {result.controllingAuthority.map((ca, idx) => (
                  <li key={idx}>
                    {ca.citation} — {ca.jurisdiction}{" "}
                    <span className="font-medium text-foreground/70">
                      ({ca.weight})
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {result.elementAnalysis && result.elementAnalysis.length > 0 ? (
            <div className="mt-3">
              <p className="text-xs font-semibold text-foreground">
                Element Analysis
              </p>
              <ul className="mt-1 space-y-1.5 text-xs text-muted-foreground">
                {result.elementAnalysis.map((ea, idx) => (
                  <li key={idx}>
                    <span className="font-medium text-foreground">
                      {ea.element}
                    </span>{" "}
                    —{" "}
                    <span
                      className={
                        ea.satisfied
                          ? "text-emerald-600 font-medium"
                          : "text-amber-600 font-medium"
                      }
                    >
                      {ea.satisfied ? "Satisfied" : "Gap"}
                    </span>
                    {ea.gaps.length > 0 && (
                      <span className="ml-1 text-amber-600">
                        ({ea.gaps.join("; ")})
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

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
