"use client";

// @ts-ignore
import "@xyflow/react/dist/style.css";
import React from "react";
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
  Panel,
  Position,
  ReactFlow,
  ReactFlowInstance,
  ReactFlowProvider,
} from "@xyflow/react";
import { Fragment, GraphNode } from "@/generated/prisma";
import { Card } from "../ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "../ui/sheet";
import GraphCanvasControls from "./graph-canvas-controls";
import LoadingSpinner from "../global/loading-spinner";
import NodeDetailsSheet from "./node-details-sheet";
import ClarityInsightsPanel from "./clarity-insights-panel";
import { Link2, TrendingUp, AlertCircle, Lightbulb, ArrowRight } from "lucide-react";

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
const CONNECTIONS_CACHE_TTL_MS = 30000;

const connectionsInFlight = new Map<string, Promise<ConnectionsApiPayload>>();
const connectionsCache = new Map<
  string,
  { expiresAt: number; payload: ConnectionsApiPayload }
>();

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
  OBSERVATION: {
    dot: "bg-[#dc8b30]",
    label: "Observation",
    color: "#dc8b30",
  },
  CONSTRAINS: {
    dot: "bg-destructive",
    label: "Constraint",
    color: "#ef4444",
  },
  CONCLUSION: {
    dot: "bg-[#52bf90]",
    label: "Conclusion",
    color: "#52bf90",
  },
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
  IDEA: {
    border: "border-l-[#005b96]",
    dot: "bg-[#005b96]",
    label: "Idea",
  },
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

    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
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

const fetchClarityConnections = async (
  problemSpaceId: string,
): Promise<ConnectionsApiPayload> => {
  const now = Date.now();
  const cached = connectionsCache.get(problemSpaceId);

  if (cached && cached.expiresAt > now) {
    return cached.payload;
  }

  const inFlight = connectionsInFlight.get(problemSpaceId);
  if (inFlight) {
    return inFlight;
  }

  const requestPromise = (async () => {
    const response = await fetch("/api/ai/clarity-connections", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ problemSpaceId }),
    });

    const payload = (await response
      .json()
      .catch(() => null)) as ConnectionsApiPayload | null;

    if (!response.ok) {
      const errorMessage =
        payload?.message ?? payload?.error ?? "Failed to analyze links.";
      throw new Error(errorMessage);
    }

    const normalized = payload ?? {};

    connectionsCache.set(problemSpaceId, {
      payload: normalized,
      expiresAt: Date.now() + CONNECTIONS_CACHE_TTL_MS,
    });

    return normalized;
  })();

  connectionsInFlight.set(problemSpaceId, requestPromise);

  try {
    return await requestPromise;
  } finally {
    connectionsInFlight.delete(problemSpaceId);
  }
};

const ClarityFlowNodeComponent = ({ data }: NodeProps<Node<ClarityNodeData>>) => {
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
        {/* Header with clarity badge */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-stone-800 leading-tight">
              {data.title}
            </p>
            <p className="mt-1 text-[11px] text-stone-400 leading-tight">
              {data.fragments.length} fragment{data.fragments.length !== 1 ? "s" : ""} · {data.connectionCount} link{data.connectionCount !== 1 ? "s" : ""}
            </p>
          </div>
          {data.fragments.length > 0 && (
            <div className={`shrink-0 flex items-center gap-1 rounded-full px-1.5 py-0.5 ${scoreColor.bg}`}>
              <div className="w-8 h-1 rounded-full bg-stone-200/60 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${data.clarityPercent}%`, backgroundColor: scoreColor.bar }}
                />
              </div>
              <span className={`text-[9px] font-bold ${scoreColor.text}`}>
                {data.clarityPercent}%
              </span>
            </div>
          )}
        </div>

        <div className="mt-3 flex flex-col gap-1">
          {data.fragments.map((fragment, index) => {
            return (
              <div
                key={fragment.id}
                className="relative flex h-7 items-center px-3 group"
                title={data.labels[index]}
              >
                {/* Invisible Target Handle */}
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

                {/* Invisible Source Handle */}
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
            );
          })}
        </div>
      </Card>
    </div>
  );
};

const ClarityFlowNode = React.memo(ClarityFlowNodeComponent);

// -------------------------------------------------------------
// REFINED ORTHOGONAL CIRCUIT ROUTING
// -------------------------------------------------------------
const buildCircuitPath = (
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number,
  laneOffset: number,
  safeAlleyY: number,
  corridorIndex: number,
) => {
  // Route with orthogonal segments so links stay readable in dense layouts:
  // - forward links take a centered "elbow" path
  // - backward/same-column links detour through a shared alley under nodes
  // corridorIndex/laneOffset fans overlapping links apart.
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

  const edgePath = buildCircuitPath(
    sourceX,
    sourceY,
    targetX,
    targetY,
    laneOffset,
    safeAlleyY,
    corridorIndex,
  );

  const fallbackColor = strengthStroke[data?.strength ?? "MEDIUM"];
  const fromColor = data?.fromType
    ? typeStyles[data.fromType].color
    : fallbackColor;
  const toColor = data?.toType ? typeStyles[data.toType].color : fallbackColor;
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
          cursor: "pointer",
          pointerEvents: "none",
        }}
      />
      {/* FIX 1: Changed `pointerEvents` to "all" so it perfectly intercepts the mouse.
        Thickened the `strokeWidth` slightly so the user doesn't have to be pixel-perfect when hovering.
      */}
      <BaseEdge
        id={`${id}-hit`}
        path={edgePath}
        className="clarity-edge-hit"
        // Transparent interaction path:
        // keeps visual stroke clean while providing a larger hover/click target
        // so edge selection and pointer cursor remain reliable.
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

const ClarityFlowEdge = React.memo(ClarityFlowEdgeComponent);

const nodeTypes = {
  clarityNode: ClarityFlowNode,
};

const edgeTypes = {
  clarityEdge: ClarityFlowEdge,
};

const ClarityGraphCanvasInner = React.memo(({
  problemSpaceId,
  graphNodes,
  fragments,
}: Props) => {
  const [zoom, setZoom] = React.useState(1);
  const [rfInstance, setRfInstance] = React.useState<ReactFlowInstance<
    Node<ClarityNodeData>,
    Edge<ClarityEdgeData>
  > | null>(null);
  const [aiConnections, setAiConnections] = React.useState<AiConnection[]>([]);
  const [loadingConnections, setLoadingConnections] = React.useState(false);
  const [connectionsError, setConnectionsError] = React.useState<string | null>(
    null,
  );
  const [selectedNodeId, setSelectedNodeId] = React.useState<string | null>(
    null,
  );
  const [selectedConnectionId, setSelectedConnectionId] = React.useState<
    string | null
  >(null);

  const fragmentsByNode = React.useMemo(() => {
    const grouped = new Map<string, Fragment[]>();
    fragments.forEach((fragment) => {
      const current = grouped.get(fragment.nodeId) ?? [];
      current.push(fragment);
      grouped.set(fragment.nodeId, current);
    });
    return grouped;
  }, [fragments]);

  const orderedFragmentsByNode = React.useMemo(() => {
    const grouped = new Map<string, Fragment[]>();
    graphNodes.forEach((node) => {
      const nodeFragments = fragmentsByNode.get(node.id) ?? [];
      grouped.set(node.id, sortFragments(nodeFragments));
    });
    return grouped;
  }, [fragmentsByNode, graphNodes]);

  React.useEffect(() => {
    let isMounted = true;

    const fetchConnections = async () => {
      setLoadingConnections(true);
      setConnectionsError(null);

      try {
        const payload = await fetchClarityConnections(problemSpaceId);
        if (isMounted && Array.isArray(payload?.suggestions)) {
          setAiConnections(payload.suggestions);
        } else if (isMounted) {
          setAiConnections([]);
        }
      } catch (error) {
        if (isMounted) {
          const message =
            error instanceof Error ? error.message : "Failed to analyze links.";
          setConnectionsError(message);
          setAiConnections([]);
        }
      } finally {
        if (isMounted) {
          setLoadingConnections(false);
        }
      }
    };

    void fetchConnections();

    return () => {
      isMounted = false;
    };
  }, [problemSpaceId]);

  const columns = Math.max(1, Math.ceil(Math.sqrt(graphNodes.length || 1)));

  const nodeHeightById = React.useMemo(() => {
    const map = new Map<string, number>();

    graphNodes.forEach((node) => {
      const count = orderedFragmentsByNode.get(node.id)?.length ?? 0;
      const exactHeight = 76 + count * 28 + Math.max(0, count - 1) * 4;
      map.set(node.id, Math.max(120, exactHeight));
    });

    return map;
  }, [graphNodes, orderedFragmentsByNode]);

  const nodePositions = React.useMemo(() => {
    const positions = new Map<string, NodePosition>();
    let currentY = CANVAS_PADDING_Y;

    for (let row = 0; row * columns < graphNodes.length; row += 1) {
      const rowNodes = graphNodes.slice(row * columns, (row + 1) * columns);
      const rowHeights = rowNodes.map(
        (node) => nodeHeightById.get(node.id) ?? 140,
      );
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

  const rowBottoms = React.useMemo(() => {
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

  const nodeMetaById = React.useMemo(() => {
    const map = new Map<string, NodeMeta>();
    graphNodes.forEach((node, index) => {
      map.set(node.id, {
        row: Math.floor(index / columns),
        col: index % columns,
      });
    });
    return map;
  }, [columns, graphNodes]);

  const labelsByNode = React.useMemo(() => {
    const map = new Map<string, string[]>();
    graphNodes.forEach((node) => {
      const nodeFragments = orderedFragmentsByNode.get(node.id) ?? [];
      map.set(node.id, getFragmentTypeLabels(nodeFragments));
    });
    return map;
  }, [graphNodes, orderedFragmentsByNode]);

  const dotPointsByFragmentId = React.useMemo(() => {
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

  const resolvedConnections = React.useMemo(() => {
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
    const coveredNodeIds = new Set<string>();
    const allNodeIds = new Set(graphNodes.map((node) => node.id));

    const trySelectConnection = (connection: ResolvedConnection) => {
      if (pruned.length >= MAX_DRAWABLE_CONNECTIONS) return false;
      if (selectedIds.has(connection.id)) return false;

      const currentOutgoing = outgoingCount.get(connection.fromFragmentId) ?? 0;
      if (currentOutgoing >= MAX_OUTGOING_PER_FRAGMENT) return false;

      pruned.push(connection);
      selectedIds.add(connection.id);
      outgoingCount.set(connection.fromFragmentId, currentOutgoing + 1);
      coveredNodeIds.add(connection.fromNodeId);
      coveredNodeIds.add(connection.toNodeId);
      return true;
    };

    for (const connection of sortedCandidates) {
      const touchesUncovered =
        !coveredNodeIds.has(connection.fromNodeId) ||
        !coveredNodeIds.has(connection.toNodeId);

      if (!touchesUncovered) continue;
      trySelectConnection(connection);
      if (coveredNodeIds.size >= allNodeIds.size) break;
    }

    for (const connection of sortedCandidates) {
      if (pruned.length >= MAX_DRAWABLE_CONNECTIONS) break;
      trySelectConnection(connection);
    }

    return pruned;
  }, [aiConnections, dotPointsByFragmentId, graphNodes, nodeMetaById]);

  const selectedNode = React.useMemo(() => {
    if (!selectedNodeId) return null;
    const node = graphNodes.find((item) => item.id === selectedNodeId);
    if (!node) return null;
    const nodeFragments = orderedFragmentsByNode.get(node.id) ?? [];
    const labels = labelsByNode.get(node.id) ?? [];

    return {
      node,
      nodeFragments,
      labels,
    };
  }, [graphNodes, labelsByNode, orderedFragmentsByNode, selectedNodeId]);

  const selectedConnection = React.useMemo(() => {
    if (!selectedConnectionId) return null;
    return (
      resolvedConnections.find(
        (connection) => connection.id === selectedConnectionId,
      ) ?? null
    );
  }, [resolvedConnections, selectedConnectionId]);

  const logicalWidth = React.useMemo(() => {
    if (graphNodes.length === 0) return 900;
    const maxX = Math.max(
      ...Array.from(nodePositions.values()).map((p) => p.x),
    );
    return Math.max(900, maxX + NODE_WIDTH + CANVAS_PADDING_X);
  }, [graphNodes.length, nodePositions]);

  const logicalHeight = React.useMemo(() => {
    if (graphNodes.length === 0) return 560;
    const maxY = Math.max(
      ...graphNodes.map((node) => {
        const pos = nodePositions.get(node.id);
        if (!pos) return 0;
        return pos.y + (nodeHeightById.get(node.id) ?? 140);
      }),
    );
    return Math.max(560, maxY + CANVAS_PADDING_Y);
  }, [graphNodes, nodeHeightById, nodePositions]);

  const flowNodes = React.useMemo(() => {
    return graphNodes.map((node): Node<ClarityNodeData> => {
      const position = nodePositions.get(node.id) ?? { x: 0, y: 0 };
      const nodeFragments = orderedFragmentsByNode.get(node.id) ?? [];

      // Compute clarity score for this node
      const connectedFragmentIds = new Set<string>();
      aiConnections.forEach((conn) => {
        if (conn.fromNodeId === node.id) connectedFragmentIds.add(conn.fromFragmentId);
        if (conn.toNodeId === node.id) connectedFragmentIds.add(conn.toFragmentId);
      });
      const connectedCount = connectedFragmentIds.size;
      const totalFrags = nodeFragments.length;
      const clarityPercent = totalFrags > 0 ? Math.round((connectedCount / totalFrags) * 100) : 0;
      let clarityStrength: "STRONG" | "MODERATE" | "WEAK" | "EMPTY" = "EMPTY";
      if (totalFrags > 0) {
        if (clarityPercent >= 75) clarityStrength = "STRONG";
        else if (clarityPercent >= 40) clarityStrength = "MODERATE";
        else clarityStrength = "WEAK";
      }

      // Count connections for this node
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
  }, [graphNodes, labelsByNode, nodePositions, orderedFragmentsByNode, aiConnections]);

  const flowEdges = React.useMemo(() => {
    const corridorCounts = new Map<string, number>();

    resolvedConnections.forEach((connection) => {
      const corridorKey = [connection.fromNodeId, connection.toNodeId].sort().join("::");

      corridorCounts.set(
        corridorKey,
        (corridorCounts.get(corridorKey) ?? 0) + 1,
      );
    });

    const corridorSeen = new Map<string, number>();

    return resolvedConnections.map(
      (connection, index): Edge<ClarityEdgeData> => {
        const corridorKey = [connection.fromNodeId, connection.toNodeId].sort().join("::");

        const corridorIndex = corridorSeen.get(corridorKey) ?? 0;
        corridorSeen.set(corridorKey, corridorIndex + 1);

        const corridorTotal = corridorCounts.get(corridorKey) ?? 1;
        const laneOffset =
          (corridorIndex - (corridorTotal - 1) / 2) * LANE_STEP;

        const sourceRow = connection.fromMeta.row;
        const targetRow = connection.toMeta.row;
        let safeAlleyY: number;

        if (sourceRow === targetRow) {
          safeAlleyY = rowBottoms[sourceRow] + NODE_GAP_Y / 2;
        } else {
          const upperRow = Math.min(sourceRow, targetRow);
          safeAlleyY = rowBottoms[upperRow] + NODE_GAP_Y / 2;
        }

        return {
          id: connection.id,
          type: "clarityEdge",
          source: connection.fromNodeId,
          target: connection.toNodeId,
          sourceHandle: `out-${connection.fromFragmentId}`,
          targetHandle: `in-${connection.toFragmentId}`,
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 16,
            height: 16,
            color: strengthStroke[connection.strength],
          },
          data: {
            strength: connection.strength,
            fromType: connection.fromPoint.fragment.type,
            toType: connection.toPoint.fragment.type,
            laneOffset,
            safeAlleyY,
            corridorIndex,
          },
          selectable: true,
          focusable: false,
        };
      },
    );
  }, [resolvedConnections, rowBottoms]);

  // Global clarity stats
  const globalStats = React.useMemo(() => {
    const totalFragments = fragments.length;
    const connectedFragments = new Set<string>();
    aiConnections.forEach((conn) => {
      connectedFragments.add(conn.fromFragmentId);
      connectedFragments.add(conn.toFragmentId);
    });
    const connected = connectedFragments.size;
    const percent = totalFragments > 0 ? Math.round((connected / totalFragments) * 100) : 0;

    const strongNodes = graphNodes.filter((node) => {
      const nodeFrags = orderedFragmentsByNode.get(node.id) ?? [];
      if (nodeFrags.length === 0) return false;
      const nodeConnIds = new Set<string>();
      aiConnections.forEach((c) => {
        if (c.fromNodeId === node.id) nodeConnIds.add(c.fromFragmentId);
        if (c.toNodeId === node.id) nodeConnIds.add(c.toFragmentId);
      });
      return (nodeConnIds.size / nodeFrags.length) >= 0.75;
    }).length;

    return { totalFragments, connected, percent, strongNodes, totalNodes: graphNodes.length };
  }, [fragments, aiConnections, graphNodes, orderedFragmentsByNode]);

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
        {/*
          Edge interaction overrides:
          React Flow pan mode can prioritize drag cursors over edge cursors.
          These rules ensure pointer feedback is shown when hovering edges,
          even with `elementsSelectable={false}`, without changing canvas pan behavior.
        */}
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

        {/* Canvas area */}
        <div className="flex-1 p-4 min-w-0">
          <div className="mb-3 flex items-center justify-between text-xs text-stone-500">
            <div className="flex items-center gap-3">
              <p className="font-medium text-stone-700">Canvas</p>
              <div className="h-3.5 w-px bg-stone-200" />
              <p>
                {graphNodes.length} nodes · {resolvedConnections.length} AI links
                {connectionsError ? " (analysis failed)" : ""}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Global clarity indicator */}
              {globalStats.totalFragments > 0 && (
                <div className="flex items-center gap-2 rounded-full bg-stone-50 border border-stone-200/60 px-2.5 py-1">
                  <span className="text-[10px] text-stone-500">Clarity</span>
                  <div className="w-12 h-1.5 rounded-full bg-stone-200/60 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${globalStats.percent}%`,
                        backgroundColor:
                          globalStats.percent >= 60
                            ? "#12753e"
                            : globalStats.percent >= 30
                              ? "#d97706"
                              : "#dc2626",
                      }}
                    />
                  </div>
                  <span className="text-[10px] font-bold text-stone-600">
                    {globalStats.percent}%
                  </span>
                  <span className="text-[10px] text-stone-400">
                    {globalStats.strongNodes}/{globalStats.totalNodes} strong
                  </span>
                </div>
              )}
              <GraphCanvasControls
                zoom={zoom}
                onZoomOut={() => rfInstance?.zoomOut({ duration: 120 })}
                onZoomIn={() => rfInstance?.zoomIn({ duration: 120 })}
                onResetZoom={() =>
                  rfInstance?.setViewport({ x: 0, y: 0, zoom: 1 })
                }
              />
            </div>
          </div>

          {connectionsError ? (
            <p className="mb-2 text-xs text-destructive">{connectionsError}</p>
          ) : null}

          <div className="relative h-176 overflow-hidden rounded-lg border bg-background">
            {loadingConnections ? (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50 backdrop-blur-sm">
                <LoadingSpinner label="AI is analyzing nodes..." />
              </div>
            ) : null}
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

            <div className="pointer-events-none absolute bottom-2 right-2 rounded border bg-background/90 px-2 py-1 text-[10px] text-muted-foreground">
              Canvas area: {Math.round(logicalWidth)} x{" "}
              {Math.round(logicalHeight)}
            </div>
          </div>
        </div>

        {/* Insights panel - shows inline when a node is selected */}
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
          <SheetHeader className="border-b">
            <SheetTitle className="flex items-center gap-2">
              <Link2 className="h-4 w-4 text-[#12753e]" />
              Fragment Connection
            </SheetTitle>
          </SheetHeader>

          <div className="space-y-3 p-4">
            {selectedConnection ? (
              <>
                {/* Strength badge */}
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      selectedConnection.strength === "STRONG"
                        ? "bg-[#dff3e7] text-[#12753e]"
                        : selectedConnection.strength === "MEDIUM"
                          ? "bg-blue-50 text-blue-600"
                          : "bg-stone-100 text-stone-500"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        selectedConnection.strength === "STRONG"
                          ? "bg-[#12753e]"
                          : selectedConnection.strength === "MEDIUM"
                            ? "bg-blue-500"
                            : "bg-stone-400"
                      }`}
                    />
                    {selectedConnection.strength} connection
                  </span>
                </div>

                {/* From fragment */}
                <div
                  className={`rounded-lg border border-l-[3px] bg-card p-3 ${fragmentCardAccent[selectedConnection.fromPoint.fragment.type].border}`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-medium text-stone-400 uppercase tracking-wider">
                      From
                    </p>
                    <div className="flex items-center gap-1.5">
                      <div
                        className={`h-1.5 w-1.5 rounded-full ${fragmentCardAccent[selectedConnection.fromPoint.fragment.type].dot}`}
                      />
                      <span className="text-[10px] text-stone-400">
                        {fragmentCardAccent[selectedConnection.fromPoint.fragment.type].label}
                      </span>
                    </div>
                  </div>
                  <p className="text-[11px] font-medium text-stone-500 mt-1">
                    {selectedConnection.fromPoint.nodeTitle}
                  </p>
                  <p className="text-xs text-stone-700 mt-1.5 leading-relaxed">
                    {selectedConnection.fromPoint.fragment.content}
                  </p>
                </div>

                {/* Arrow */}
                <div className="flex justify-center">
                  <div className="h-6 w-px bg-stone-200 relative">
                    <ArrowRight className="absolute -bottom-1.5 -left-1.5 h-3.5 w-3.5 text-stone-300 rotate-90" />
                  </div>
                </div>

                {/* To fragment */}
                <div
                  className={`rounded-lg border border-l-[3px] bg-card p-3 ${fragmentCardAccent[selectedConnection.toPoint.fragment.type].border}`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-medium text-stone-400 uppercase tracking-wider">
                      To
                    </p>
                    <div className="flex items-center gap-1.5">
                      <div
                        className={`h-1.5 w-1.5 rounded-full ${fragmentCardAccent[selectedConnection.toPoint.fragment.type].dot}`}
                      />
                      <span className="text-[10px] text-stone-400">
                        {fragmentCardAccent[selectedConnection.toPoint.fragment.type].label}
                      </span>
                    </div>
                  </div>
                  <p className="text-[11px] font-medium text-stone-500 mt-1">
                    {selectedConnection.toPoint.nodeTitle}
                  </p>
                  <p className="text-xs text-stone-700 mt-1.5 leading-relaxed">
                    {selectedConnection.toPoint.fragment.content}
                  </p>
                </div>

                {/* Reason */}
                <div className="rounded-lg border border-[#12753e]/15 bg-[#dff3e7]/30 p-3">
                  <div className="flex items-center gap-1.5">
                    <Lightbulb className="h-3 w-3 text-[#12753e]" />
                    <p className="text-[10px] font-semibold text-[#12753e] uppercase tracking-wider">
                      Why Connected
                    </p>
                  </div>
                  <p className="mt-1.5 whitespace-pre-wrap text-[12px] leading-relaxed text-stone-600">
                    {selectedConnection.reason}
                  </p>
                </div>

                {/* Actions */}
                <div className="space-y-2 pt-2">
                  <p className="text-[10px] font-medium text-stone-400 uppercase tracking-wider">
                    Actions
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      className="flex items-center justify-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-2 text-[11px] font-medium text-stone-600 hover:bg-stone-50 hover:border-stone-300 transition-colors"
                      onClick={() => {
                        setSelectedConnectionId(null);
                        if (selectedConnection) {
                          setSelectedNodeId(selectedConnection.fromNodeId);
                        }
                      }}
                    >
                      <TrendingUp className="h-3 w-3 text-[#12753e]" />
                      Build Argument
                    </button>
                    <button
                      type="button"
                      className="flex items-center justify-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-2 text-[11px] font-medium text-stone-600 hover:bg-stone-50 hover:border-stone-300 transition-colors"
                      onClick={() => {
                        setSelectedConnectionId(null);
                        if (selectedConnection) {
                          setSelectedNodeId(selectedConnection.fromNodeId);
                        }
                      }}
                    >
                      <AlertCircle className="h-3 w-3 text-amber-500" />
                      Challenge Link
                    </button>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
});

export default ClarityGraphCanvasInner;
