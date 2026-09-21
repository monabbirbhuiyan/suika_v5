"use client";

import React from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Loader2,
  TrendingUp,
  Scale,
  Shield,
  Sword,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  ArrowLeft,
  MessageSquare,
} from "lucide-react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import AnalysisChat from "./analysis-chat";

type SupportingLaw = {
  title: string;
  citation: string;
  url: string | null;
  relevance: string;
  documentType: string;
};

type BestOutcome = {
  outcome: string;
  likelihood: "HIGH" | "MEDIUM" | "LOW";
  reasoning: string;
  requiredElements: string[];
  supportingLaws: SupportingLaw[];
  keyFactors: string[];
  risks: string[];
  nextSteps: string[];
};

type ArgumentEntry = {
  argument: string;
  strength: "STRONG" | "MEDIUM" | "WEAK";
  supportingAuthority?: string;
  keyEvidence?: string;
};

type OpponentArgumentEntry = {
  argument: string;
  strength: "STRONG" | "MEDIUM" | "WEAK";
  counterRebuttal: string;
  rebuttalAuthority?: string;
};

type OutcomeResult = {
  summary: string;
  defendingSide?: "PLAINTIFF" | "DEFENDANT";
  ourArguments?: ArgumentEntry[];
  opponentArguments?: OpponentArgumentEntry[];
  rebuttalStrategy?: string[];
  bestOutcomes?: BestOutcome[];
  confidence: "HIGH" | "MEDIUM" | "LOW";
  basedOnQuestionCount: number;
  totalQuestionCount: number;
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
};

type FragmentMap = Record<string, { content: string; type: string }>;

type Props = {
  problemSpaceId: string;
  userId: string;
  problemSpaceTitle: string;
};

const fragmentTypeStyles: Record<string, { dot: string; label: string; badge: string }> = {
  QUESTION:             { dot: "bg-slate-900",   label: "Question",            badge: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" },
  IDEA:                 { dot: "bg-[#005b96]",   label: "Idea",                badge: "bg-[#005b96]/10 text-[#005b96] dark:bg-[#005b96]/20" },
  OBSERVATION:          { dot: "bg-[#dc8b30]",   label: "Observation",         badge: "bg-[#dc8b30]/10 text-[#dc8b30] dark:bg-[#dc8b30]/20" },
  CONSTRAINS:           { dot: "bg-red-500",     label: "Constraint",          badge: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  CONCLUSION:           { dot: "bg-[#52bf90]",   label: "Conclusion",          badge: "bg-[#52bf90]/10 text-[#52bf90] dark:bg-[#52bf90]/20" },
};

const CUID_RE = /\b(c[a-z0-9]{24,})\b/g;

function FragmentRefBadge({ id, fragmentMap }: { id: string; fragmentMap: FragmentMap }) {
  const frag = fragmentMap[id];
  if (!frag) return <span className="font-mono text-[10px] text-muted-foreground">{id.slice(0, 12)}...</span>;
  const style = fragmentTypeStyles[frag.type] ?? fragmentTypeStyles.QUESTION;
  const snippet = frag.content.length > 60 ? frag.content.slice(0, 57) + "..." : frag.content;
  return (
    <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium ${style.badge}`}>
      <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${style.dot}`} />
      {snippet}
    </span>
  );
}

function RenderWithFragments({ text, fragmentMap }: { text: string; fragmentMap: FragmentMap }) {
  const parts = text.split(CUID_RE);
  return (
    <>
      {parts.map((part, i) => {
        if (i % 2 === 1 && fragmentMap[part]) {
          return <FragmentRefBadge key={i} id={part} fragmentMap={fragmentMap} />;
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

const strengthBadgeClass = (strength: string) => {
  if (strength === "STRONG") return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300";
  if (strength === "WEAK") return "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300";
  return "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300";
};

const likelihoodConfig = {
  HIGH: {
    label: "High Likelihood",
    dotClass: "bg-emerald-500",
    badgeClass: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    borderClass: "border-emerald-200 dark:border-emerald-900/40",
    bgClass: "bg-emerald-50/50 dark:bg-emerald-950/20",
  },
  MEDIUM: {
    label: "Medium Likelihood",
    dotClass: "bg-blue-500",
    badgeClass: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    borderClass: "border-blue-200 dark:border-blue-900/40",
    bgClass: "bg-blue-50/50 dark:bg-blue-950/20",
  },
  LOW: {
    label: "Low Likelihood",
    dotClass: "bg-amber-500",
    badgeClass: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    borderClass: "border-amber-200 dark:border-amber-900/40",
    bgClass: "bg-amber-50/50 dark:bg-amber-950/20",
  },
};

const OutcomeCard = ({ outcome, rank }: { outcome: BestOutcome; rank: number }) => {
  const [expanded, setExpanded] = React.useState(rank === 0);
  const config = likelihoodConfig[outcome.likelihood];

  return (
    <div className={`rounded-md border ${config.borderClass} ${config.bgClass} p-3`}>
      <button type="button" onClick={() => setExpanded(!expanded)} className="w-full text-left">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 min-w-0 flex-1">
            <span className="mt-0.5 inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-foreground/10 px-1.5 text-[10px] font-bold text-foreground">
              {rank + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground leading-snug">{outcome.outcome}</p>
              <div className="mt-1 flex items-center gap-2">
                <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-bold ${config.badgeClass}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${config.dotClass}`} />
                  {config.label}
                </span>
                {outcome.supportingLaws.length > 0 && (
                  <span className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                    <Scale className="h-2.5 w-2.5" />
                    {outcome.supportingLaws.length} law{outcome.supportingLaws.length !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </div>
          </div>
          {expanded ? <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />}
        </div>
      </button>

      {expanded && (
        <div className="mt-3 space-y-3 text-xs">
          <div>
            <p className="font-semibold text-foreground">Legal Reasoning</p>
            <p className="mt-1 text-muted-foreground leading-relaxed">{outcome.reasoning}</p>
          </div>

          {outcome.supportingLaws.length > 0 && (
            <div className="rounded border border-border/50 bg-background/60 p-2.5">
              <div className="flex items-center gap-1.5">
                <Scale className="h-3 w-3 text-emerald-600" />
                <p className="font-semibold text-foreground">Supporting Laws</p>
              </div>
              <ul className="mt-1.5 space-y-2">
                {outcome.supportingLaws.map((law, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="mt-0.5 inline-flex h-4 min-w-4 shrink-0 items-center justify-center rounded bg-emerald-100 px-1 text-[10px] font-bold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-baseline gap-x-2">
                        {law.url ? (
                          <a href={law.url} target="_blank" rel="noopener noreferrer" className="font-medium text-foreground underline decoration-border/50 underline-offset-2 hover:text-emerald-600">
                            {law.title}
                          </a>
                        ) : (
                          <span className="font-medium text-foreground">{law.title}</span>
                        )}
                        {law.citation && <span className="text-muted-foreground">{law.citation}</span>}
                      </div>
                      <p className="mt-0.5 text-muted-foreground">{law.relevance}</p>
                      <span className="mt-0.5 inline-block rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                        {law.documentType.replace("_", " ")}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {outcome.keyFactors.length > 0 && (
            <div>
              <p className="font-semibold text-foreground">Key Factors in Your Favor</p>
              <ul className="mt-1 space-y-1">
                {outcome.keyFactors.map((factor) => (
                  <li key={factor} className="flex items-start gap-1.5">
                    <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-emerald-600" />
                    <span className="text-muted-foreground">{factor}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {outcome.risks.length > 0 && (
            <div>
              <p className="font-semibold text-foreground">Risks & Obstacles</p>
              <ul className="mt-1 space-y-1">
                {outcome.risks.map((risk) => (
                  <li key={risk} className="flex items-start gap-1.5">
                    <AlertCircle className="mt-0.5 h-3 w-3 shrink-0 text-amber-600" />
                    <span className="text-muted-foreground">{risk}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {outcome.nextSteps.length > 0 && (
            <div>
              <p className="font-semibold text-foreground">Next Steps</p>
              <ul className="mt-1 space-y-1">
                {outcome.nextSteps.map((step) => (
                  <li key={step} className="flex items-start gap-1.5">
                    <ArrowRight className="mt-0.5 h-3 w-3 shrink-0 text-blue-600" />
                    <span className="text-muted-foreground">{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const AnalysisPageClient = ({ problemSpaceId, userId, problemSpaceTitle }: Props) => {
  const router = useRouter();
  const searchParams = React.useMemo(() => {
    if (typeof window !== "undefined") {
      return new URLSearchParams(window.location.search);
    }
    return new URLSearchParams();
  }, []);
  const initialSide = (searchParams.get("side") === "DEFENDANT" ? "DEFENDANT" : "PLAINTIFF") as "PLAINTIFF" | "DEFENDANT";

  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<OutcomeResult | null>(null);
  const [fragmentMap, setFragmentMap] = React.useState<FragmentMap>({});
  const [defendingSide, setDefendingSide] = React.useState<"PLAINTIFF" | "DEFENDANT">(initialSide);
  const [chatOpen, setChatOpen] = React.useState(true);

  const runAnalysis = React.useCallback(
    async (side: "PLAINTIFF" | "DEFENDANT") => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/ai/conclude-problem-space", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ problemSpaceId, defendingSide: side }),
        });

        const payload = (await response.json().catch(() => null)) as {
          result?: OutcomeResult;
          fragmentMap?: FragmentMap;
          error?: string;
          message?: string;
        } | null;

        if (!response.ok || !payload?.result) {
          throw new Error(payload?.message ?? payload?.error ?? "Failed to analyze outcomes.");
        }

        setResult(payload.result);
        if (payload.fragmentMap) setFragmentMap(payload.fragmentMap);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to analyze outcomes.");
      } finally {
        setIsLoading(false);
      }
    },
    [problemSpaceId],
  );

  React.useEffect(() => {
    void runAnalysis(defendingSide);
  }, [defendingSide, runAnalysis]);

  const handleSideChange = (side: "PLAINTIFF" | "DEFENDANT") => {
    setDefendingSide(side);
    const url = new URL(window.location.href);
    url.searchParams.set("side", side);
    window.history.replaceState({}, "", url.toString());
  };

  const confidenceClass =
    result?.confidence === "HIGH" ? "text-emerald-700"
      : result?.confidence === "LOW" ? "text-amber-700"
        : "text-blue-700";

  return (
    <motion.div
      className="flex flex-col h-[calc(100vh-8rem)]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="px-5 py-3 border-b border-border/40 bg-background shrink-0">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div className="h-6 w-px bg-border/40" />
            <div>
              <h2 className="font-serif text-lg text-foreground">
                Case Analysis
              </h2>
              <p className="text-[11px] text-muted-foreground">
                {problemSpaceTitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center rounded-full border border-border/60 bg-muted/30 p-0.5">
              <button
                type="button"
                onClick={() => handleSideChange("PLAINTIFF")}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium transition-all ${
                  defendingSide === "PLAINTIFF"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Sword className="h-3 w-3" />
                Plaintiff
              </button>
              <button
                type="button"
                onClick={() => handleSideChange("DEFENDANT")}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium transition-all ${
                  defendingSide === "DEFENDANT"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Shield className="h-3 w-3" />
                Defendant
              </button>
            </div>

            <Button
              type="button"
              variant={chatOpen ? "default" : "outline"}
              size="sm"
              onClick={() => setChatOpen(!chatOpen)}
              className="gap-2"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              AI Chat
            </Button>
          </div>
        </div>

        {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
      </div>

      {/* Content */}
      <div className="flex-1 flex min-h-0">
        {/* Analysis Panel */}
        <div
          className={`flex-1 overflow-y-auto p-5 transition-all duration-300 ${
            chatOpen ? "w-[60%]" : "w-full"
          }`}
        >
          {isLoading && !result ? (
            <div className="flex flex-col items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">Analyzing case...</p>
            </div>
          ) : result ? (
            <div className="relative">
              {isLoading && (
                <div className="absolute inset-0 bg-background/60 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
                  <div className="flex flex-col items-center">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mb-2" />
                    <p className="text-xs text-muted-foreground">Updating analysis...</p>
                  </div>
                </div>
              )}
              <Card className="p-5">
                {/* Summary */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Case Summary</p>
                    {result.defendingSide && (
                      <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold ${
                        result.defendingSide === "DEFENDANT"
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                          : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                      }`}>
                        {result.defendingSide === "DEFENDANT" ? <Shield className="h-2.5 w-2.5" /> : <Sword className="h-2.5 w-2.5" />}
                        {result.defendingSide === "DEFENDANT" ? "Defense" : "Plaintiff"}
                      </span>
                    )}
                  </div>
                  <p className={`text-xs font-semibold ${confidenceClass}`}>{result.confidence} confidence</p>
                </div>
                <p className="mt-3 text-sm text-foreground leading-relaxed">{result.summary}</p>

                {/* Our Arguments */}
                {result.ourArguments && result.ourArguments.length > 0 && (
                  <div className="mt-5 rounded-md border border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/20">
                    <div className="flex items-center gap-1.5">
                      {result.defendingSide === "DEFENDANT" ? <Shield className="h-3.5 w-3.5 text-blue-600" /> : <Sword className="h-3.5 w-3.5 text-emerald-600" />}
                      <p className="text-xs font-semibold text-foreground">
                        Our Arguments ({result.defendingSide === "DEFENDANT" ? "Defense" : "Plaintiff"})
                      </p>
                    </div>
                    <ul className="mt-3 space-y-3">
                      {result.ourArguments.map((arg, idx) => (
                        <li key={idx} className="text-xs">
                          <div className="flex items-start gap-2">
                            <span className="mt-0.5 inline-flex h-4 min-w-4 shrink-0 items-center justify-center rounded bg-emerald-100 px-1 text-[10px] font-bold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                              {idx + 1}
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-foreground">{arg.argument}</p>
                                <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold ${strengthBadgeClass(arg.strength)}`}>
                                  {arg.strength}
                                </span>
                              </div>
                              {arg.keyEvidence && (
                                <p className="mt-1 text-muted-foreground">
                                  <span className="font-medium">Evidence:</span> <RenderWithFragments text={arg.keyEvidence} fragmentMap={fragmentMap} />
                                </p>
                              )}
                              {arg.supportingAuthority && (
                                <p className="mt-0.5 text-muted-foreground">
                                  <span className="font-medium">Authority:</span> <RenderWithFragments text={arg.supportingAuthority} fragmentMap={fragmentMap} />
                                </p>
                              )}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Opponent Arguments */}
                {result.opponentArguments && result.opponentArguments.length > 0 && (
                  <div className="mt-4 rounded-md border border-red-200 bg-red-50/50 p-4 dark:border-red-900/40 dark:bg-red-950/20">
                    <div className="flex items-center gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
                      <p className="text-xs font-semibold text-foreground">Opponent&apos;s Likely Arguments</p>
                    </div>
                    <ul className="mt-3 space-y-3">
                      {result.opponentArguments.map((arg, idx) => (
                        <li key={idx} className="text-xs">
                          <div className="flex items-start gap-2">
                            <span className="mt-0.5 inline-flex h-4 min-w-4 shrink-0 items-center justify-center rounded bg-red-100 px-1 text-[10px] font-bold text-red-700 dark:bg-red-900/40 dark:text-red-300">
                              {idx + 1}
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-foreground">{arg.argument}</p>
                                <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold ${strengthBadgeClass(arg.strength)}`}>
                                  {arg.strength}
                                </span>
                              </div>
                              <div className="mt-1.5 rounded bg-background/80 p-2 border border-border/40">
                                <div className="flex items-center gap-1">
                                  <CheckCircle2 className="h-3 w-3 text-emerald-600 shrink-0" />
                                  <p className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400">Rebuttal</p>
                                </div>
                                <p className="mt-0.5 text-muted-foreground">{arg.counterRebuttal}</p>
                                {arg.rebuttalAuthority && (
                                  <p className="mt-0.5 text-muted-foreground">
                                    <span className="font-medium">Authority:</span> <RenderWithFragments text={arg.rebuttalAuthority} fragmentMap={fragmentMap} />
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Rebuttal Strategy */}
                {result.rebuttalStrategy && result.rebuttalStrategy.length > 0 && (
                  <div className="mt-4 rounded-md border border-border/50 bg-muted/30 p-4">
                    <p className="text-xs font-semibold text-foreground">Rebuttal Strategy</p>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-muted-foreground">
                      {result.rebuttalStrategy.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Best Outcomes */}
                {result.bestOutcomes && result.bestOutcomes.length > 0 && (
                  <div className="mt-5">
                    <p className="text-xs font-semibold text-foreground">Ranked Outcomes</p>
                    <div className="mt-3 space-y-2">
                      {result.bestOutcomes.map((outcome, idx) => (
                        <OutcomeCard key={idx} outcome={outcome} rank={idx} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Element Analysis */}
                {result.elementAnalysis && result.elementAnalysis.length > 0 && (
                  <div className="mt-5 rounded-md border border-border/50 bg-muted/30 p-4">
                    <p className="text-xs font-semibold text-foreground">Element Analysis</p>
                    <ul className="mt-2 space-y-1.5 text-xs text-muted-foreground">
                      {result.elementAnalysis.map((ea, idx) => (
                        <li key={idx}>
                          <span className="font-medium text-foreground">{ea.element}</span> —{" "}
                          <span className={ea.satisfied ? "text-emerald-600 font-medium" : "text-amber-600 font-medium"}>
                            {ea.satisfied ? "Satisfied" : "Gap"}
                          </span>
                          {ea.gaps.length > 0 && (
                            <span className="ml-1 text-amber-600">({ea.gaps.join("; ")})</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Procedural Posture & Standard of Review */}
                {(result.proceduralPosture || result.standardOfReview) && (
                  <div className="mt-4 flex flex-wrap gap-4">
                    {result.proceduralPosture && (
                      <div>
                        <p className="text-xs font-semibold text-foreground">Procedural Posture</p>
                        <p className="mt-1 text-xs text-muted-foreground">{result.proceduralPosture}</p>
                      </div>
                    )}
                    {result.standardOfReview && (
                      <div>
                        <p className="text-xs font-semibold text-foreground">Standard of Review</p>
                        <p className="mt-1 text-xs text-muted-foreground">{result.standardOfReview}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Controlling Authority */}
                {result.controllingAuthority && result.controllingAuthority.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs font-semibold text-foreground">Controlling Authority</p>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-muted-foreground">
                      {result.controllingAuthority.map((ca, idx) => (
                        <li key={idx}>
                          {ca.citation} — {ca.jurisdiction}{" "}
                          <span className="font-medium text-foreground/70">({ca.weight})</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <p className="mt-4 text-[11px] text-muted-foreground">
                  Coverage: {result.basedOnQuestionCount}/{result.totalQuestionCount} question fragments
                </p>
              </Card>
            </div>
          ) : null}
        </div>

        {/* Chat Panel */}
        {chatOpen && (
          <div className="w-[40%] border-l border-border/40 bg-background flex flex-col min-h-0">
            <AnalysisChat
              problemSpaceId={problemSpaceId}
              defendingSide={defendingSide}
            />
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default AnalysisPageClient;
