"use client";

// @ts-ignore
import "@xyflow/react/dist/style.css";
import React, { useState, useEffect, useMemo, memo } from "react";
import {
  Background,
  BackgroundVariant,
  BaseEdge,
  Edge,
  EdgeProps,
  Handle,
  MarkerType,
  Node,
  NodeProps,
  Position,
  ReactFlow,
  ReactFlowInstance,
} from "@xyflow/react";
import {
  Link2,
  TrendingUp,
  AlertCircle,
  Lightbulb,
  ArrowRight,
} from "lucide-react";

import { Fragment, GraphNode } from "@/types/canva";
import { Card } from "../ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "../ui/sheet";
import GraphCanvasControls from "./graph-canvas-controls";
import LoadingSpinner from "../global/loading-spinner";
import ClarityInsightsPanel from "./clarity-insights-panel";

type Props = {
  problemSpaceId: string;
  graphNodes: GraphNode[];
  fragments: Fragment[];
};

type NodePosition = {
  x: number;
  y: number;
};

type DotPoint = {
  fragmentId: string;
  nodeId: string;
  nodeTitle: string;
  y: number;
  fragment: Fragment;
};

type NodeMeta = {
  row: number;
  col: number;
};

type AiConnection = {
  fromNodeId: string;
  toNodeId: string;
  fromFragmentId: string;
  toFragmentId: string;
  reason: string;
  strength: "STRONG" | "MEDIUM" | "GENTLE";
  isConflict?: boolean;
};

type ConnectionsApiPayload = {
  suggestions?: AiConnection[];
  error?: string;
  message?: string;
};

type ResolvedConnection = AiConnection & {
  id: string;
  fromPoint: DotPoint;
  toPoint: DotPoint;
  fromMeta: NodeMeta;
  toMeta: NodeMeta;
};

type ClarityNodeData = {
  nodeId: string;
  title: string;
  fragments: Fragment[];
  labels: string[];
  onSelectNode: (nodeId: string) => void;
  clarityPercent: number;
  clarityStrength: "STRONG" | "MODERATE" | "WEAK" | "EMPTY";
  connectionCount: number;
};

type ClarityEdgeData = {
  strength: AiConnection["strength"];
  fromType: Fragment["type"];
  toType: Fragment["type"];
  laneOffset: number;
  safeAlleyY: number;
  corridorIndex: number;
  isConflict?: boolean;
};

const NODE_WIDTH = 360;
const NODE_GAP_X = 170;
const NODE_GAP_Y = 140;
const CANVAS_PADDING_X = 40;
const CANVAS_PADDING_Y = 30;
const MIN_ZOOM = 0.6;
const MAX_ZOOM = 1.8;
const MAX_DRAWABLE_CONNECTIONS = 14;
const MAX_OUTGOING_PER_FRAGMENT = 2;
const LANE_STEP = 18;

const fragmentTypePriority: Record<Fragment["type"], number> = {
  QUESTION: 0,
  IDEA: 1,
  OBSERVATION: 2,
  CONSTRAINS: 3,
  CONCLUSION: 4,
};

const typeStyles: Record<
  Fragment["type"],
  { dot: string; label: string; color: string }
> = {
  QUESTION: { dot: "bg-primary", label: "Question", color: "#0f172a" },
  IDEA: { dot: "bg-[#005b96]", label: "Idea", color: "#005b96" },
  OBSERVATION: { dot: "bg-[#dc8b30]", label: "Observation", color: "#dc8b30" },
  CONSTRAINS: { dot: "bg-destructive", label: "Constraint", color: "#ef4444" },
  CONCLUSION: { dot: "bg-[#52bf90]", label: "Conclusion", color: "#52bf90" },
};

const strengthStroke: Record<AiConnection["strength"], string> = {
  STRONG: "#16a34a",
  MEDIUM: "#2563eb",
  GENTLE: "#94a3b8",
};

const strengthRank: Record<AiConnection["strength"], number> = {
  STRONG: 3,
  MEDIUM: 2,
  GENTLE: 1,
};

const fragmentCardAccent: Record<
  Fragment["type"],
  { border: string; dot: string; label: string }
> = {
  QUESTION: {
    border: "border-l-primary",
    dot: "bg-primary",
    label: "Question",
  },
  IDEA: { border: "border-l-[#005b96]", dot: "bg-[#005b96]", label: "Idea" },
  OBSERVATION: {
    border: "border-l-[#dc8b30]",
    dot: "bg-[#dc8b30]",
    label: "Observation",
  },
  CONSTRAINS: {
    border: "border-l-destructive",
    dot: "bg-destructive",
    label: "Constraint",
  },
  CONCLUSION: {
    border: "border-l-[#52bf90]",
    dot: "bg-[#52bf90]",
    label: "Conclusion",
  },
};

const sortFragments = (nodeFragments: Fragment[]) => {
  return [...nodeFragments].sort((a, b) => {
    const byType = fragmentTypePriority[a.type] - fragmentTypePriority[b.type];
    if (byType !== 0) return byType;
    const bySortOrder = (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
    if (bySortOrder !== 0) return bySortOrder;
    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return timeA - timeB;
  });
};

const getFragmentTypeLabels = (nodeFragments: Fragment[]) => {
  const totalByType = new Map<Fragment["type"], number>();
  nodeFragments.forEach((fragment) => {
    totalByType.set(fragment.type, (totalByType.get(fragment.type) ?? 0) + 1);
  });

  const seenByType = new Map<Fragment["type"], number>();
  return nodeFragments.map((fragment) => {
    const seen = (seenByType.get(fragment.type) ?? 0) + 1;
    seenByType.set(fragment.type, seen);
    const baseLabel = typeStyles[fragment.type].label;
    const total = totalByType.get(fragment.type) ?? 0;
    return total > 1 ? `${baseLabel} ${seen}` : baseLabel;
  });
};

// FastAPI network call
const fetchClarityConnections = async (
  problemSpaceId: string,
): Promise<ConnectionsApiPayload> => {
  const response = await fetch(
    "http://127.0.0.1:8000/api/ai/clarity-connections",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ problem_space_id: problemSpaceId }),
    },
  );

  if (!response.ok) {
    throw new Error(`Server returned ${response.status}`);
  }

  return await response.json();
};

const ClarityFlowNodeComponent = ({
  data,
}: NodeProps<Node<ClarityNodeData>>) => {
  const scoreColor =
    data.clarityStrength === "STRONG"
      ? { bg: "bg-[#dff3e7]", text: "text-[#12753e]", bar: "#12753e" }
      : data.clarityStrength === "MODERATE"
        ? { bg: "bg-amber-50", text: "text-amber-700", bar: "#d97706" }
        : data.clarityStrength === "WEAK"
          ? { bg: "bg-red-50", text: "text-red-600", bar: "#dc2626" }
          : { bg: "bg-stone-50", text: "text-stone-400", bar: "#d6d3d1" };

  return (
    <div style={{ width: NODE_WIDTH }}>
      <Card
        className="p-3 transition-all cursor-pointer hover:border-[#12753e]/40 relative z-0 bg-card"
        onClick={() => data.onSelectNode(data.nodeId)}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-stone-800 leading-tight">
              {data.title}
            </p>
            <p className="mt-1 text-[11px] text-stone-400 leading-tight">
              {data.fragments.length} fragment
              {data.fragments.length !== 1 ? "s" : ""} · {data.connectionCount}{" "}
              link{data.connectionCount !== 1 ? "s" : ""}
            </p>
          </div>
          {data.fragments.length > 0 && (
            <div
              className={`shrink-0 flex items-center gap-1 rounded-full px-1.5 py-0.5 ${scoreColor.bg}`}
            >
              <div className="w-8 h-1 rounded-full bg-stone-200/60 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${data.clarityPercent}%`,
                    backgroundColor: scoreColor.bar,
                  }}
                />
              </div>
              <span className={`text-[9px] font-bold ${scoreColor.text}`}>
                {data.clarityPercent}%
              </span>
            </div>
          )}
        </div>

        <div className="mt-3 flex flex-col gap-1">
          {data.fragments.map((fragment, index) => (
            <div
              key={fragment.id}
              className="relative flex h-7 items-center px-3 group"
              title={data.labels[index]}
            >
              <Handle
                id={`in-${fragment.id}`}
                type="target"
                position={Position.Left}
                isConnectable={false}
                style={{
                  opacity: 0,
                  left: -4,
                  width: 8,
                  height: 10,
                  border: "none",
                }}
              />

              <div
                className="w-2.5 h-2.5 rounded-full shrink-0 mr-2"
                style={{ background: typeStyles[fragment.type].color }}
              />

              <span className="truncate text-[11px] leading-none text-muted-foreground">
                {data.labels[index]}
              </span>

              <div className="ml-auto" />

              <div
                className="w-2.5 h-2.5 rounded-full shrink-0 ml-2"
                style={{ background: typeStyles[fragment.type].color }}
              />

              <Handle
                id={`out-${fragment.id}`}
                type="source"
                position={Position.Right}
                isConnectable={false}
                style={{
                  opacity: 0,
                  right: -4,
                  width: 8,
                  height: 10,
                  border: "none",
                }}
              />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

const ClarityFlowNode = memo(ClarityFlowNodeComponent);

const buildCircuitPath = (
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number,
  laneOffset: number,
  safeAlleyY: number,
  corridorIndex: number,
) => {
  if (targetX > sourceX + 40) {
    const midX = sourceX + (targetX - sourceX) / 2 + laneOffset;
    return [
      `M ${sourceX} ${sourceY}`,
      `L ${midX} ${sourceY}`,
      `L ${midX} ${targetY}`,
      `L ${targetX} ${targetY}`,
    ].join(" ");
  } else {
    const spreadOutX = sourceX + 24 + corridorIndex * 10;
    const spreadInX = targetX - 24 - corridorIndex * 10;
    const midY = safeAlleyY + laneOffset;

    return [
      `M ${sourceX} ${sourceY}`,
      `L ${spreadOutX} ${sourceY}`,
      `L ${spreadOutX} ${midY}`,
      `L ${spreadInX} ${midY}`,
      `L ${spreadInX} ${targetY}`,
      `L ${targetX} ${targetY}`,
    ].join(" ");
  }
};

const ClarityFlowEdgeComponent = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  style,
  markerEnd,
  selected,
  data,
}: EdgeProps<Edge<ClarityEdgeData>>) => {
  const laneOffset = data?.laneOffset ?? 0;
  const safeAlleyY = data?.safeAlleyY ?? 0;
  const corridorIndex = data?.corridorIndex ?? 0;
  const isConflict = Boolean(data?.isConflict);

  const edgePath = buildCircuitPath(
    sourceX,
    sourceY,
    targetX,
    targetY,
    laneOffset,
    safeAlleyY,
    corridorIndex,
  );

  const fallbackColor = isConflict
    ? "#ef4444"
    : strengthStroke[data?.strength ?? "MEDIUM"];
  const fromColor = isConflict
    ? "#ef4444"
    : data?.fromType
      ? typeStyles[data.fromType].color
      : fallbackColor;
  const toColor = isConflict
    ? "#ef4444"
    : data?.toType
      ? typeStyles[data.toType].color
      : fallbackColor;
  const gradientId = `edge-grad-${id.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
  const strokeColor = fromColor === toColor ? fromColor : `url(#${gradientId})`;

  return (
    <>
      <defs>
        <linearGradient
          id={gradientId}
          gradientUnits="userSpaceOnUse"
          x1={sourceX}
          y1={sourceY}
          x2={targetX}
          y2={targetY}
        >
          <stop offset="0%" stopColor={fromColor} />
          <stop offset="100%" stopColor={toColor} />
        </linearGradient>
      </defs>

      <BaseEdge
        id={`${id}-glow`}
        path={edgePath}
        style={{
          ...(style ?? {}),
          stroke: strokeColor,
          strokeWidth: selected ? 7 : 6,
          opacity: 0.14,
          strokeLinecap: "round",
          strokeLinejoin: "round",
          pointerEvents: "none",
        }}
      />
      <BaseEdge
        id={id}
        path={edgePath}
        className="clarity-edge-visible"
        markerEnd={markerEnd}
        style={{
          ...(style ?? {}),
          stroke: strokeColor,
          strokeWidth: selected ? 4.2 : 3.6,
          opacity: 0.9,
          strokeLinecap: "round",
          strokeLinejoin: "round",
          pointerEvents: "none",
        }}
      />
      <BaseEdge
        id={`${id}-hit`}
        path={edgePath}
        className="clarity-edge-hit"
        style={{
          stroke: "transparent",
          strokeWidth: 20,
          pointerEvents: "all",
          cursor: "pointer",
        }}
      />
    </>
  );
};

const ClarityFlowEdge = memo(ClarityFlowEdgeComponent);

const nodeTypes = {
  clarityNode: ClarityFlowNode,
};

const edgeTypes = {
  clarityEdge: ClarityFlowEdge,
};

export default function ClarityGraphCanvas({
  problemSpaceId,
  graphNodes,
  fragments,
}: Props) {
  const [zoom, setZoom] = useState(1);
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance<
    Node<ClarityNodeData>,
    Edge<ClarityEdgeData>
  > | null>(null);
  const [aiConnections, setAiConnections] = useState<AiConnection[]>([]);
  const [loadingConnections, setLoadingConnections] = useState(false);
  const [connectionsError, setConnectionsError] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedConnectionId, setSelectedConnectionId] = useState<
    string | null
  >(null);

  const fragmentsByNode = useMemo(() => {
    const grouped = new Map<string, Fragment[]>();
    fragments.forEach((fragment) => {
      const current = grouped.get(fragment.nodeId) ?? [];
      current.push(fragment);
      grouped.set(fragment.nodeId, current);
    });
    return grouped;
  }, [fragments]);

  const orderedFragmentsByNode = useMemo(() => {
    const grouped = new Map<string, Fragment[]>();
    graphNodes.forEach((node) => {
      const nodeFragments = fragmentsByNode.get(node.id) ?? [];
      grouped.set(node.id, sortFragments(nodeFragments));
    });
    return grouped;
  }, [fragmentsByNode, graphNodes]);

  useEffect(() => {
    let isMounted = true;

    async function loadLinks() {
      setLoadingConnections(true);
      setConnectionsError(null);

      try {
        const payload = await fetchClarityConnections(problemSpaceId);
        if (isMounted && Array.isArray(payload?.suggestions)) {
          setAiConnections(payload.suggestions);
        } else if (isMounted) {
          setAiConnections([]);
        }
      } catch (err) {
        if (isMounted) {
          const msg =
            err instanceof Error
              ? err.message
              : "Failed to load links from FastAPI.";
          setConnectionsError(msg);
          setAiConnections([]);
        }
      } finally {
        if (isMounted) {
          setLoadingConnections(false);
        }
      }
    }

    if (problemSpaceId) {
      loadLinks();
    }

    return () => {
      isMounted = false;
    };
  }, [problemSpaceId]);

  const columns = Math.max(1, Math.ceil(Math.sqrt(graphNodes.length || 1)));

  const nodeHeightById = useMemo(() => {
    const map = new Map<string, number>();
    graphNodes.forEach((node) => {
      const count = orderedFragmentsByNode.get(node.id)?.length ?? 0;
      const exactHeight = 76 + count * 28 + Math.max(0, count - 1) * 4;
      map.set(node.id, Math.max(120, exactHeight));
    });
    return map;
  }, [graphNodes, orderedFragmentsByNode]);

  const nodePositions = useMemo(() => {
    const positions = new Map<string, NodePosition>();
    let currentY = CANVAS_PADDING_Y;

    for (let row = 0; row * columns < graphNodes.length; row += 1) {
      const rowNodes = graphNodes.slice(row * columns, (row + 1) * columns);
      const rowHeights = rowNodes.map((n) => nodeHeightById.get(n.id) ?? 140);
      const rowMaxHeight = Math.max(...rowHeights, 140);

      rowNodes.forEach((node, colIndex) => {
        positions.set(node.id, {
          x: CANVAS_PADDING_X + colIndex * (NODE_WIDTH + NODE_GAP_X),
          y: currentY,
        });
      });

      currentY += rowMaxHeight + NODE_GAP_Y;
    }

    return positions;
  }, [columns, graphNodes, nodeHeightById]);

  const rowBottoms = useMemo(() => {
    const bottoms: number[] = [];
    const numRows = Math.ceil(graphNodes.length / columns);

    for (let row = 0; row < numRows; row += 1) {
      const rowNodes = graphNodes.slice(row * columns, (row + 1) * columns);
      if (rowNodes.length === 0) continue;

      const rowHeights = rowNodes.map((n) => nodeHeightById.get(n.id) ?? 140);
      const maxH = Math.max(...rowHeights, 140);
      const y = nodePositions.get(rowNodes[0].id)?.y ?? CANVAS_PADDING_Y;

      bottoms[row] = y + maxH;
    }
    return bottoms;
  }, [columns, graphNodes, nodeHeightById, nodePositions]);

  const nodeMetaById = useMemo(() => {
    const map = new Map<string, NodeMeta>();
    graphNodes.forEach((node, index) => {
      map.set(node.id, {
        row: Math.floor(index / columns),
        col: index % columns,
      });
    });
    return map;
  }, [columns, graphNodes]);

  const labelsByNode = useMemo(() => {
    const map = new Map<string, string[]>();
    graphNodes.forEach((node) => {
      const nodeFragments = orderedFragmentsByNode.get(node.id) ?? [];
      map.set(node.id, getFragmentTypeLabels(nodeFragments));
    });
    return map;
  }, [graphNodes, orderedFragmentsByNode]);

  const dotPointsByFragmentId = useMemo(() => {
    const map = new Map<string, DotPoint>();
    graphNodes.forEach((node) => {
      const nodeFragments = orderedFragmentsByNode.get(node.id) ?? [];
      nodeFragments.forEach((fragment, index) => {
        const dotY = 76 + index * 28 + (index > 0 ? (index - 1) * 4 : 0);
        map.set(fragment.id, {
          fragmentId: fragment.id,
          nodeId: node.id,
          nodeTitle: node.title,
          y: dotY,
          fragment,
        });
      });
    });
    return map;
  }, [graphNodes, orderedFragmentsByNode]);

  const resolvedConnections = useMemo(() => {
    const normalized = aiConnections
      .map((connection) => {
        const fromPoint = dotPointsByFragmentId.get(connection.fromFragmentId);
        const toPoint = dotPointsByFragmentId.get(connection.toFragmentId);
        const fromMeta = nodeMetaById.get(connection.fromNodeId);
        const toMeta = nodeMetaById.get(connection.toNodeId);

        if (!fromPoint || !toPoint || !fromMeta || !toMeta) return null;

        return {
          ...connection,
          id: `${connection.fromFragmentId}::${connection.toFragmentId}`,
          fromPoint,
          toPoint,
          fromMeta,
          toMeta,
        } satisfies ResolvedConnection;
      })
      .filter((item): item is ResolvedConnection => Boolean(item));

    const byPair = new Map<string, ResolvedConnection>();
    normalized.forEach((connection) => {
      const pairKey = [connection.fromFragmentId, connection.toFragmentId]
        .sort()
        .join("::");

      const existing = byPair.get(pairKey);
      if (
        !existing ||
        strengthRank[connection.strength] > strengthRank[existing.strength]
      ) {
        byPair.set(pairKey, connection);
      }
    });

    const sortedCandidates = Array.from(byPair.values()).sort((a, b) => {
      const byStrength = strengthRank[b.strength] - strengthRank[a.strength];
      if (byStrength !== 0) return byStrength;
      return a.id.localeCompare(b.id);
    });

    const pruned: ResolvedConnection[] = [];
    const selectedIds = new Set<string>();
    const outgoingCount = new Map<string, number>();

    for (const connection of sortedCandidates) {
      if (pruned.length >= MAX_DRAWABLE_CONNECTIONS) break;
      if (selectedIds.has(connection.id)) continue;

      const currentOutgoing = outgoingCount.get(connection.fromFragmentId) ?? 0;
      if (currentOutgoing >= MAX_OUTGOING_PER_FRAGMENT) continue;

      pruned.push(connection);
      selectedIds.add(connection.id);
      outgoingCount.set(connection.fromFragmentId, currentOutgoing + 1);
    }

    return pruned;
  }, [aiConnections, dotPointsByFragmentId, nodeMetaById]);

  const selectedNode = useMemo(() => {
    if (!selectedNodeId) return null;
    const node = graphNodes.find((item) => item.id === selectedNodeId);
    if (!node) return null;
    const nodeFragments = orderedFragmentsByNode.get(node.id) ?? [];
    return {
      node,
      nodeFragments,
      labels: labelsByNode.get(node.id) ?? [],
    };
  }, [graphNodes, labelsByNode, orderedFragmentsByNode, selectedNodeId]);

  const selectedConnection = useMemo(() => {
    if (!selectedConnectionId) return null;
    return (
      resolvedConnections.find((c) => c.id === selectedConnectionId) ?? null
    );
  }, [resolvedConnections, selectedConnectionId]);

  const flowNodes = useMemo(() => {
    return graphNodes.map((node): Node<ClarityNodeData> => {
      const position = nodePositions.get(node.id) ?? { x: 0, y: 0 };
      const nodeFragments = orderedFragmentsByNode.get(node.id) ?? [];

      const connectedFragmentIds = new Set<string>();
      aiConnections.forEach((conn) => {
        if (conn.fromNodeId === node.id)
          connectedFragmentIds.add(conn.fromFragmentId);
        if (conn.toNodeId === node.id)
          connectedFragmentIds.add(conn.toFragmentId);
      });
      const connectedCount = connectedFragmentIds.size;
      const totalFrags = nodeFragments.length;
      const clarityPercent =
        totalFrags > 0 ? Math.round((connectedCount / totalFrags) * 100) : 0;
      let clarityStrength: "STRONG" | "MODERATE" | "WEAK" | "EMPTY" = "EMPTY";
      if (totalFrags > 0) {
        if (clarityPercent >= 75) clarityStrength = "STRONG";
        else if (clarityPercent >= 40) clarityStrength = "MODERATE";
        else clarityStrength = "WEAK";
      }

      const nodeConnCount = aiConnections.filter(
        (c) => c.fromNodeId === node.id || c.toNodeId === node.id,
      ).length;

      return {
        id: node.id,
        type: "clarityNode",
        position,
        draggable: false,
        selectable: false,
        connectable: false,
        data: {
          nodeId: node.id,
          title: node.title,
          fragments: nodeFragments,
          labels: labelsByNode.get(node.id) ?? [],
          onSelectNode: setSelectedNodeId,
          clarityPercent,
          clarityStrength,
          connectionCount: nodeConnCount,
        },
      };
    });
  }, [
    graphNodes,
    labelsByNode,
    nodePositions,
    orderedFragmentsByNode,
    aiConnections,
  ]);

  const flowEdges = useMemo(() => {
    const corridorCounts = new Map<string, number>();
    resolvedConnections.forEach((conn) => {
      const key = [conn.fromNodeId, conn.toNodeId].sort().join("::");
      corridorCounts.set(key, (corridorCounts.get(key) ?? 0) + 1);
    });

    const corridorSeen = new Map<string, number>();

    return resolvedConnections.map((conn): Edge<ClarityEdgeData> => {
      const key = [conn.fromNodeId, conn.toNodeId].sort().join("::");
      const index = corridorSeen.get(key) ?? 0;
      corridorSeen.set(key, index + 1);

      const total = corridorCounts.get(key) ?? 1;
      const laneOffset = (index - (total - 1) / 2) * LANE_STEP;

      const sourceRow = conn.fromMeta.row;
      const targetRow = conn.toMeta.row;
      const upperRow = Math.min(sourceRow, targetRow);
      const safeAlleyY = (rowBottoms[upperRow] ?? 0) + NODE_GAP_Y / 2;

      return {
        id: conn.id,
        type: "clarityEdge",
        source: conn.fromNodeId,
        target: conn.toNodeId,
        sourceHandle: `out-${conn.fromFragmentId}`,
        targetHandle: `in-${conn.toFragmentId}`,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 16,
          height: 16,
          color: conn.isConflict ? "#ef4444" : strengthStroke[conn.strength],
        },
        data: {
          strength: conn.strength,
          fromType: conn.fromPoint.fragment.type,
          toType: conn.toPoint.fragment.type,
          laneOffset,
          safeAlleyY,
          corridorIndex: index,
          isConflict: conn.isConflict,
        },
        selectable: true,
      };
    });
  }, [resolvedConnections, rowBottoms]);

  if (graphNodes.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
        Create at least one node to see your clarity graph.
      </div>
    );
  }

  return (
    <>
      <div className="flex gap-0 rounded-xl border bg-card/30 overflow-hidden">
        <style>{`
          .react-flow__edge {
            pointer-events: visibleStroke !important;
            cursor: pointer !important;
          }
          .clarity-edge-visible,
          .clarity-edge-hit {
            cursor: pointer !important;
          }
          .react-flow__edge:hover .clarity-edge-visible {
            filter: brightness(1.2);
            stroke-width: 4.5px !important;
          }
        `}</style>

        <div className="flex-1 p-4 min-w-0">
          <div className="mb-3 flex items-center justify-between text-xs text-stone-500">
            <div className="flex items-center gap-3">
              <p className="font-medium text-stone-700">
                Visual Reasoning Canvas
              </p>
              <div className="h-3.5 w-px bg-stone-200" />
              <p>
                {graphNodes.length} nodes · {resolvedConnections.length} links
              </p>
            </div>
            <GraphCanvasControls
              zoom={zoom}
              onZoomOut={() => rfInstance?.zoomOut({ duration: 120 })}
              onZoomIn={() => rfInstance?.zoomIn({ duration: 120 })}
              onResetZoom={() =>
                rfInstance?.setViewport({ x: 0, y: 0, zoom: 1 })
              }
            />
          </div>

          {connectionsError && (
            <p className="mb-2 text-xs text-destructive">{connectionsError}</p>
          )}

          <div className="relative h-176 overflow-hidden rounded-lg border bg-background">
            {loadingConnections && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50 backdrop-blur-sm">
                <LoadingSpinner label="FastAPI is verifying connections..." />
              </div>
            )}
            <ReactFlow
              nodes={flowNodes}
              edges={flowEdges}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              fitView
              fitViewOptions={{
                padding: 0.15,
                minZoom: MIN_ZOOM,
                maxZoom: MAX_ZOOM,
              }}
              minZoom={MIN_ZOOM}
              maxZoom={MAX_ZOOM}
              defaultViewport={{ x: 0, y: 0, zoom: 1 }}
              proOptions={{ hideAttribution: true }}
              nodesDraggable={false}
              nodesConnectable={false}
              elementsSelectable={false}
              panOnDrag
              zoomOnPinch
              zoomOnScroll
              onInit={(instance) => {
                setRfInstance(instance);
                setZoom(instance.getZoom());
              }}
              onMove={(_, viewport) => setZoom(viewport.zoom)}
              onNodeClick={(_, node) => {
                setSelectedConnectionId(null);
                setSelectedNodeId(node.id);
              }}
              onEdgeClick={(_, edge) => {
                setSelectedNodeId(null);
                setSelectedConnectionId(edge.id);
              }}
              onPaneClick={() => {
                setSelectedNodeId(null);
                setSelectedConnectionId(null);
              }}
            >
              <Background
                variant={BackgroundVariant.Dots}
                size={1.8}
                gap={16}
                color="rgba(100,116,139,0.52)"
              />
            </ReactFlow>
          </div>
        </div>

        {selectedNode && (
          <ClarityInsightsPanel
            problemSpaceId={problemSpaceId}
            node={selectedNode.node}
            fragments={fragments}
            connections={aiConnections}
            allNodes={graphNodes}
            onClose={() => setSelectedNodeId(null)}
          />
        )}
      </div>

      <Sheet
        open={Boolean(selectedConnection)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedConnectionId(null);
          }
        }}
      >
        <SheetContent side="right" className="sm:max-w-md p-0">
          <SheetHeader className="border-b p-4">
            <SheetTitle className="flex items-center gap-2">
              <Link2 className="h-4 w-4 text-[#12753e]" />
              Fragment Connection
            </SheetTitle>
          </SheetHeader>

          <div className="space-y-3 p-4">
            {selectedConnection && (
              <>
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      selectedConnection.isConflict
                        ? "bg-red-100 text-red-700"
                        : selectedConnection.strength === "STRONG"
                          ? "bg-[#dff3e7] text-[#12753e]"
                          : "bg-blue-50 text-blue-600"
                    }`}
                  >
                    {selectedConnection.isConflict
                      ? "UNSAT Contradiction Core"
                      : `${selectedConnection.strength} Connection`}
                  </span>
                </div>

                <div
                  className={`rounded-lg border border-l-[3px] bg-card p-3 ${fragmentCardAccent[selectedConnection.fromPoint.fragment.type].border}`}
                >
                  <p className="text-[10px] font-medium text-muted-foreground uppercase">
                    From: {selectedConnection.fromPoint.nodeTitle}
                  </p>
                  <p className="text-xs text-foreground mt-1">
                    {selectedConnection.fromPoint.fragment.content}
                  </p>
                </div>

                <div className="flex justify-center">
                  <ArrowRight className="h-4 w-4 text-muted-foreground rotate-90" />
                </div>

                <div
                  className={`rounded-lg border border-l-[3px] bg-card p-3 ${fragmentCardAccent[selectedConnection.toPoint.fragment.type].border}`}
                >
                  <p className="text-[10px] font-medium text-muted-foreground uppercase">
                    To: {selectedConnection.toPoint.nodeTitle}
                  </p>
                  <p className="text-xs text-foreground mt-1">
                    {selectedConnection.toPoint.fragment.content}
                  </p>
                </div>

                <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                  <div className="flex items-center gap-1.5">
                    <Lightbulb className="h-3 w-3 text-primary" />
                    <p className="text-[10px] font-semibold text-primary uppercase">
                      Logical Verification Reason
                    </p>
                  </div>
                  <p className="mt-1.5 text-[12px] leading-relaxed text-muted-foreground">
                    {selectedConnection.reason}
                  </p>
                </div>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
