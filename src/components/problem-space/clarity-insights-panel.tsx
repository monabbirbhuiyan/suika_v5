"use client";

import React from "react";
import {
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Lightbulb,
  TrendingUp,
  Link2,
  X,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Plus,
} from "lucide-react";
import { Button } from "../ui/button";
import { Fragment, GraphNode } from "@/generated/prisma";
import CreateFragmentForm from "../forms/create-fragment-form";
import FragmentSuggestions from "./fragment-suggestions";

type AiConnection = {
  fromNodeId: string;
  toNodeId: string;
  fromFragmentId: string;
  toFragmentId: string;
  reason: string;
  strength: "STRONG" | "MEDIUM" | "GENTLE";
};

type ClarityScore = {
  total: number;
  connected: number;
  gaps: number;
  strength: "STRONG" | "MODERATE" | "WEAK" | "EMPTY";
  percent: number;
};

type NodeInsight = {
  strengths: string[];
  gaps: string[];
  suggestions: string[];
  connectedNodes: Array<{
    nodeTitle: string;
    connectionCount: number;
    strongestStrength: string;
  }>;
};

type Props = {
  problemSpaceId: string;
  node: GraphNode;
  fragments: Fragment[];
  connections: AiConnection[];
  allNodes: GraphNode[];
  onClose: () => void;
};

const strengthConfig: Record<
  ClarityScore["strength"],
  { bg: string; text: string; border: string; label: string }
> = {
  STRONG: {
    bg: "bg-[#dff3e7]",
    text: "text-[#12753e]",
    border: "border-[#12753e]/20",
    label: "Strong",
  },
  MODERATE: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    label: "Moderate",
  },
  WEAK: {
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
    label: "Weak",
  },
  EMPTY: {
    bg: "bg-stone-50",
    text: "text-stone-500",
    border: "border-stone-200",
    label: "No Data",
  },
};

const fragmentTypeLabels: Record<Fragment["type"], string> = {
  QUESTION: "Question",
  IDEA: "Idea",
  OBSERVATION: "Observation",
  CONSTRAINS: "Constraint",
  CONCLUSION: "Conclusion",
};

const essentialTypes: Fragment["type"][] = [
  "QUESTION",
  "CONCLUSION",
];

function computeClarityScore(
  fragments: Fragment[],
  connections: AiConnection[],
  nodeId: string,
): ClarityScore {
  if (fragments.length === 0) {
    return { total: 0, connected: 0, gaps: 0, strength: "EMPTY", percent: 0 };
  }

  const connectedFragmentIds = new Set<string>();
  connections.forEach((conn) => {
    if (conn.fromNodeId === nodeId) connectedFragmentIds.add(conn.fromFragmentId);
    if (conn.toNodeId === nodeId) connectedFragmentIds.add(conn.toFragmentId);
  });

  const connected = connectedFragmentIds.size;
  const total = fragments.length;
  const percent = Math.round((connected / total) * 100);
  const gaps = total - connected;

  let strength: ClarityScore["strength"];
  if (percent >= 75) strength = "STRONG";
  else if (percent >= 40) strength = "MODERATE";
  else if (total > 0) strength = "WEAK";
  else strength = "EMPTY";

  return { total, connected, gaps, strength, percent };
}

function computeInsights(
  node: GraphNode,
  fragments: Fragment[],
  connections: AiConnection[],
  allNodes: GraphNode[],
): NodeInsight {
  const strengths: string[] = [];
  const gaps: string[] = [];
  const suggestions: string[] = [];

  const nodeFragments = fragments.filter((f) => f.nodeId === node.id);
  const typeCounts = new Map<Fragment["type"], number>();
  nodeFragments.forEach((f) => typeCounts.set(f.type, (typeCounts.get(f.type) ?? 0) + 1));

  // Strengths
  const strongConns = connections.filter(
    (c) => (c.fromNodeId === node.id || c.toNodeId === node.id) && c.strength === "STRONG",
  );
  if (strongConns.length > 0) {
    strengths.push(`${strongConns.length} strong connection${strongConns.length > 1 ? "s" : ""} to other nodes`);
  }

  if ((typeCounts.get("CONCLUSION") ?? 0) > 0) {
    strengths.push("Has conclusion fragment(s) — argument is formed");
  }

  if (nodeFragments.length >= 3) {
    strengths.push(`${nodeFragments.length} fragments — well-documented`);
  }

  // Gaps
  essentialTypes.forEach((type) => {
    if ((typeCounts.get(type) ?? 0) === 0) {
      gaps.push(`Missing ${fragmentTypeLabels[type].toLowerCase()} fragment`);
    }
  });

  const outGoing = connections.filter((c) => c.fromNodeId === node.id);
  const inComing = connections.filter((c) => c.toNodeId === node.id);
  if (outGoing.length === 0 && inComing.length === 0 && nodeFragments.length > 0) {
    gaps.push("Not connected to any other node");
  }

  if (typeCounts.get("CONSTRAINS") && !typeCounts.get("CONCLUSION")) {
    gaps.push("Has constraints but no conclusion drawn");
  }

  // Suggestions
  if ((typeCounts.get("QUESTION") ?? 0) === 0) {
    suggestions.push("Add a QUESTION fragment to clarify what this node explores");
  }
  if ((typeCounts.get("IDEA") ?? 0) === 0 && (typeCounts.get("OBSERVATION") ?? 0) === 0) {
    suggestions.push("Add IDEA or OBSERVATION fragments to build your argument");
  }
  if (outGoing.length === 0 && inComing.length === 0) {
    suggestions.push("Connect this node to others to build a coherent case");
  }
  if (nodeFragments.length < 3) {
    suggestions.push("Add more fragments to build a stronger foundation");
  }

  // Connected nodes
  const connectedNodeMap = new Map<
    string,
    { nodeTitle: string; connectionCount: number; strongestStrength: string }
  >();

  connections.forEach((conn) => {
    if (conn.fromNodeId === node.id) {
      const existing = connectedNodeMap.get(conn.toNodeId);
      const otherNode = allNodes.find((n) => n.id === conn.toNodeId);
      if (otherNode) {
        connectedNodeMap.set(conn.toNodeId, {
          nodeTitle: otherNode.title,
          connectionCount: (existing?.connectionCount ?? 0) + 1,
          strongestStrength:
            conn.strength === "STRONG"
              ? "STRONG"
              : existing?.strongestStrength === "STRONG"
                ? "STRONG"
                : conn.strength === "MEDIUM"
                  ? "MEDIUM"
                  : existing?.strongestStrength ?? "GENTLE",
        });
      }
    }
    if (conn.toNodeId === node.id) {
      const existing = connectedNodeMap.get(conn.fromNodeId);
      const otherNode = allNodes.find((n) => n.id === conn.fromNodeId);
      if (otherNode) {
        connectedNodeMap.set(conn.fromNodeId, {
          nodeTitle: otherNode.title,
          connectionCount: (existing?.connectionCount ?? 0) + 1,
          strongestStrength:
            conn.strength === "STRONG"
              ? "STRONG"
              : existing?.strongestStrength === "STRONG"
                ? "STRONG"
                : conn.strength === "MEDIUM"
                  ? "MEDIUM"
                  : existing?.strongestStrength ?? "GENTLE",
        });
      }
    }
  });

  return {
    strengths,
    gaps,
    suggestions,
    connectedNodes: Array.from(connectedNodeMap.values()),
  };
}

function ScoreBar({ score }: { score: ClarityScore }) {
  const config = strengthConfig[score.strength];
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-stone-600">
          Node Clarity
        </span>
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${config.bg} ${config.text} border ${config.border}`}
        >
          {score.percent}%
          <span className="font-medium opacity-70">· {config.label}</span>
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-stone-100 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${score.percent}%`,
            backgroundColor:
              score.strength === "STRONG"
                ? "#12753e"
                : score.strength === "MODERATE"
                  ? "#d97706"
                  : score.strength === "WEAK"
                    ? "#dc2626"
                    : "#a8a29e",
          }}
        />
      </div>
      <div className="flex items-center gap-3 text-[10px] text-stone-500">
        <span>
          {score.connected}/{score.total} fragments connected
        </span>
        {score.gaps > 0 && (
          <span className="text-amber-600 font-medium">
            {score.gaps} gap{score.gaps > 1 ? "s" : ""}
          </span>
        )}
      </div>
    </div>
  );
}

function InsightSection({
  title,
  icon,
  items,
  variant,
}: {
  title: string;
  icon: React.ReactNode;
  items: string[];
  variant: "green" | "red" | "blue" | "amber";
}) {
  const [expanded, setExpanded] = React.useState(true);

  if (items.length === 0) return null;

  const variantStyles = {
    green: {
      bg: "bg-[#dff3e7]/40",
      border: "border-[#12753e]/15",
      icon: "text-[#12753e]",
      badge: "bg-[#dff3e7] text-[#12753e]",
    },
    red: {
      bg: "bg-red-50/40",
      border: "border-red-200/50",
      icon: "text-red-500",
      badge: "bg-red-100 text-red-600",
    },
    blue: {
      bg: "bg-blue-50/40",
      border: "border-blue-200/50",
      icon: "text-blue-500",
      badge: "bg-blue-100 text-blue-600",
    },
    amber: {
      bg: "bg-amber-50/40",
      border: "border-amber-200/50",
      icon: "text-amber-600",
      badge: "bg-amber-100 text-amber-600",
    },
  };

  const vs = variantStyles[variant];

  return (
    <div className={`rounded-lg border ${vs.border} ${vs.bg} overflow-hidden`}>
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className={vs.icon}>{icon}</span>
          <span className="text-[11px] font-semibold text-stone-700">
            {title}
          </span>
          <span
            className={`inline-flex items-center justify-center h-4 min-w-[16px] px-1 rounded text-[9px] font-bold ${vs.badge}`}
          >
            {items.length}
          </span>
        </div>
        {expanded ? (
          <ChevronUp className="h-3 w-3 shrink-0 text-stone-400" />
        ) : (
          <ChevronDown className="h-3 w-3 shrink-0 text-stone-400" />
        )}
      </button>
      {expanded && (
        <div className="px-3 pb-2.5">
          <ul className="space-y-1.5">
            {items.map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-0.5 inline-flex h-4 min-w-[16px] shrink-0 items-center justify-center rounded bg-white/70 px-1 text-[9px] font-bold text-stone-400">
                  {i + 1}
                </span>
                <span className="text-[11.5px] text-stone-600 leading-relaxed">
                  {item}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function ConnectedNodesList({
  connectedNodes,
}: {
  connectedNodes: NodeInsight["connectedNodes"];
}) {
  if (connectedNodes.length === 0) return null;

  return (
    <div className="space-y-1.5">
      <p className="text-[11px] font-medium text-stone-600">
        Connected Nodes
      </p>
      {connectedNodes.map((cn, i) => (
        <div
          key={i}
          className="flex items-center justify-between rounded-md bg-white border border-stone-100 px-2.5 py-1.5"
        >
          <span className="text-[11px] font-medium text-stone-700 truncate">
            {cn.nodeTitle}
          </span>
          <div className="flex items-center gap-1.5 shrink-0 ml-2">
            <span className="text-[10px] text-stone-400">
              {cn.connectionCount} link{cn.connectionCount > 1 ? "s" : ""}
            </span>
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                cn.strongestStrength === "STRONG"
                  ? "bg-[#12753e]"
                  : cn.strongestStrength === "MEDIUM"
                    ? "bg-blue-500"
                    : "bg-stone-300"
              }`}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ClarityInsightsPanel({
  problemSpaceId,
  node,
  fragments,
  connections,
  allNodes,
  onClose,
}: Props) {
  const [createOpen, setCreateOpen] = React.useState(false);
  const nodeFragments = React.useMemo(
    () => fragments.filter((f) => f.nodeId === node.id),
    [fragments, node.id],
  );

  const score = React.useMemo(
    () => computeClarityScore(nodeFragments, connections, node.id),
    [nodeFragments, connections, node.id],
  );

  const insights = React.useMemo(
    () => computeInsights(node, fragments, connections, allNodes),
    [node, fragments, connections, allNodes],
  );

  return (
    <div className="w-80 shrink-0 border-l border-stone-200/70 bg-white flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-stone-200/70 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <Sparkles className="h-4 w-4 text-[#12753e] shrink-0" />
            <h3 className="text-[13px] font-semibold text-stone-800 truncate">
              Clarity Insights
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md hover:bg-stone-100 text-stone-400 hover:text-stone-600 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        <p className="text-[11px] text-stone-400 mt-1 truncate">{node.title}</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Clarity Score */}
        <ScoreBar score={score} />

        {/* Divider */}
        <div className="h-px bg-stone-100" />

        {/* Strengths */}
        <InsightSection
          title="Strengths"
          icon={<CheckCircle2 className="h-3.5 w-3.5" />}
          items={insights.strengths}
          variant="green"
        />

        {/* Gaps */}
        <InsightSection
          title="Gaps to Address"
          icon={<AlertCircle className="h-3.5 w-3.5" />}
          items={insights.gaps}
          variant="red"
        />

        {/* Suggestions */}
        <InsightSection
          title="Suggested Actions"
          icon={<Lightbulb className="h-3.5 w-3.5" />}
          items={insights.suggestions}
          variant="amber"
        />

        {/* AI Fragment Suggestions */}
        <FragmentSuggestions
          problemSpaceId={problemSpaceId}
          node={node}
          fragments={fragments}
        />

        {/* Connected Nodes */}
        <ConnectedNodesList connectedNodes={insights.connectedNodes} />
      </div>

      {/* Create Fragment Form */}
      <CreateFragmentForm
        open={createOpen}
        onOpenChange={setCreateOpen}
        problemSpaceId={problemSpaceId}
        nodes={allNodes}
        fragments={fragments}
        initialNodeId={node.id}
        lockNodeSelection
      />

      {/* Footer */}
      <div className="px-4 py-3 border-t border-stone-200/70 shrink-0">
        <Button
          type="button"
          size="sm"
          className="w-full h-8 text-[11px] bg-[#12753e] hover:bg-[#0d582f] text-white"
          onClick={() => setCreateOpen(true)}
        >
          <Plus className="h-3 w-3 mr-1.5" />
          Add Fragment
        </Button>
      </div>
    </div>
  );
}
