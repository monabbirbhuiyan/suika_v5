"use client";

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
const LANE_STEP = 12;
const CONNECTIONS_CACHE_TTL_MS = 4000;

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
  LEGAL_ELEMENT: 5,
  BINDING_AUTHORITY: 6,
  PERSUASIVE_AUTHORITY: 7,
  PROCEDURAL_FACT: 8,
  EVIDENTIARY_FACT: 9,
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
    label: "Constrains",
    color: "#ef4444",
  },
  CONCLUSION: {
    dot: "bg-[#52bf90]",
    label: "Conclusion",
    color: "#52bf90",
  },
  LEGAL_ELEMENT: {
    dot: "bg-[#6d28d9]",
    label: "Legal Element",
    color: "#6d28d9",
  },
  BINDING_AUTHORITY: {
    dot: "bg-[#7c3aed]",
    label: "Binding Authority",
    color: "#7c3aed",
  },
  PERSUASIVE_AUTHORITY: {
    dot: "bg-[#a855f7]",
    label: "Persuasive Authority",
    color: "#a855f7",
  },
  PROCEDURAL_FACT: {
    dot: "bg-[#0891b2]",
    label: "Procedural Fact",
    color: "#0891b2",
  },
  EVIDENTIARY_FACT: {
    dot: "bg-[#0d9488]",
    label: "Evidentiary Fact",
    color: "#0d9488",
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
    label: "Constrains",
  },
  CONCLUSION: {
    border: "border-l-[#52bf90]",
    dot: "bg-[#52bf90]",
    label: "Conclusion",
  },
  LEGAL_ELEMENT: {
    border: "border-l-[#6d28d9]",
    dot: "bg-[#6d28d9]",
    label: "Legal Element",
  },
  BINDING_AUTHORITY: {
    border: "border-l-[#7c3aed]",
    dot: "bg-[#7c3aed]",
    label: "Binding Authority",
  },
  PERSUASIVE_AUTHORITY: {
    border: "border-l-[#a855f7]",
    dot: "bg-[#a855f7]",
    label: "Persuasive Authority",
  },
  PROCEDURAL_FACT: {
    border: "border-l-[#0891b2]",
    dot: "bg-[#0891b2]",
    label: "Procedural Fact",
  },
  EVIDENTIARY_FACT: {
    border: "border-l-[#0d9488]",
    dot: "bg-[#0d9488]",
    label: "Evidentiary Fact",
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
  return (
    <div style={{ width: NODE_WIDTH }}>
      <Card
        className="p-3 transition-all cursor-pointer hover:border-primary/40 relative z-0 bg-card"
        onClick={() => data.onSelectNode(data.nodeId)}
      >
        <div className="h-10 min-w-0 flex flex-col justify-center">
          <p className="truncate text-sm font-medium text-foreground leading-tight">
            {data.title}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground leading-tight">
            {data.fragments.length} fragments
          </p>
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

const ClarityGraphCanvasInner = ({
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
        const dotY = 0;
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
        },
      };
    });
  }, [graphNodes, labelsByNode, nodePositions, orderedFragmentsByNode]);

  const flowEdges = React.useMemo(() => {
    const corridorCounts = new Map<string, number>();

    resolvedConnections.forEach((connection) => {
      const corridorKey = [
        `r${Math.min(connection.fromMeta.row, connection.toMeta.row)}-${Math.max(connection.fromMeta.row, connection.toMeta.row)}`,
        `c${Math.min(connection.fromMeta.col, connection.toMeta.col)}-${Math.max(connection.fromMeta.col, connection.toMeta.col)}`,
      ].join("::");

      corridorCounts.set(
        corridorKey,
        (corridorCounts.get(corridorKey) ?? 0) + 1,
      );
    });

    const corridorSeen = new Map<string, number>();

    return resolvedConnections.map(
      (connection, index): Edge<ClarityEdgeData> => {
        const corridorKey = [
          `r${Math.min(connection.fromMeta.row, connection.toMeta.row)}-${Math.max(connection.fromMeta.row, connection.toMeta.row)}`,
          `c${Math.min(connection.fromMeta.col, connection.toMeta.col)}-${Math.max(connection.fromMeta.col, connection.toMeta.col)}`,
        ].join("::");

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
          selectable: false,
          focusable: false,
        };
      },
    );
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
      <div className="rounded-xl border bg-card/30 p-4">
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

        <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
          <p>Canvas</p>
          <div className="flex items-center gap-3">
            <p>
              {graphNodes.length} nodes · {resolvedConnections.length} AI links{" "}
              {connectionsError ? " (analysis failed)" : ""}
            </p>
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
          {/* Injecting styles via Panel to avoid module declaration issues with direct CSS imports in some environments */}
          <Panel position="top-left" style={{ display: 'none' }}>
            <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@xyflow/react@12.3.0/dist/style.css" />
          </Panel>


          <div className="pointer-events-none absolute bottom-2 right-2 rounded border bg-background/90 px-2 py-1 text-[10px] text-muted-foreground">
            Canvas area: {Math.round(logicalWidth)} x{" "}
            {Math.round(logicalHeight)}
          </div>
        </div>
      </div>

      <NodeDetailsSheet
        open={Boolean(selectedNode)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedNodeId(null);
          }
        }}
        title={selectedNode?.node.title ?? "Node"}
        fragments={selectedNode?.nodeFragments ?? []}
        fragmentTypeLabels={selectedNode?.labels ?? []}
        dotClassByType={{
          QUESTION: typeStyles.QUESTION.dot,
          IDEA: typeStyles.IDEA.dot,
          OBSERVATION: typeStyles.OBSERVATION.dot,
          CONSTRAINS: typeStyles.CONSTRAINS.dot,
          CONCLUSION: typeStyles.CONCLUSION.dot,
          LEGAL_ELEMENT: typeStyles.LEGAL_ELEMENT.dot,
          BINDING_AUTHORITY: typeStyles.BINDING_AUTHORITY.dot,
          PERSUASIVE_AUTHORITY: typeStyles.PERSUASIVE_AUTHORITY.dot,
          PROCEDURAL_FACT: typeStyles.PROCEDURAL_FACT.dot,
          EVIDENTIARY_FACT: typeStyles.EVIDENTIARY_FACT.dot,
        }}
        fragmentTypeLabelByType={{
          QUESTION: typeStyles.QUESTION.label,
          IDEA: typeStyles.IDEA.label,
          OBSERVATION: typeStyles.OBSERVATION.label,
          CONSTRAINS: typeStyles.CONSTRAINS.label,
          CONCLUSION: typeStyles.CONCLUSION.label,
          LEGAL_ELEMENT: typeStyles.LEGAL_ELEMENT.label,
          BINDING_AUTHORITY: typeStyles.BINDING_AUTHORITY.label,
          PERSUASIVE_AUTHORITY: typeStyles.PERSUASIVE_AUTHORITY.label,
          PROCEDURAL_FACT: typeStyles.PROCEDURAL_FACT.label,
          EVIDENTIARY_FACT: typeStyles.EVIDENTIARY_FACT.label,
        }}
      />

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
            <SheetTitle>Fragment Connection</SheetTitle>
          </SheetHeader>

          <div className="space-y-3 p-4">
            {selectedConnection ? (
              <>
                <div
                  className={`rounded-md border border-l-[3px] bg-card p-3 ${fragmentCardAccent[selectedConnection.fromPoint.fragment.type].border}`}
                >
                  <p className="text-xs text-muted-foreground">From</p>
                  <p className="text-sm font-medium mt-1">
                    {selectedConnection.fromPoint.nodeTitle}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <div
                      className={`h-1.5 w-1.5 rounded-full ${fragmentCardAccent[selectedConnection.fromPoint.fragment.type].dot}`}
                    />
                    <span className="text-[10px] tracking-wider text-muted-foreground">
                      {
                        fragmentCardAccent[
                          selectedConnection.fromPoint.fragment.type
                        ].label
                      }
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {selectedConnection.fromPoint.fragment.content}
                  </p>
                </div>

                <div
                  className={`rounded-md border border-l-[3px] bg-card p-3 ${fragmentCardAccent[selectedConnection.toPoint.fragment.type].border}`}
                >
                  <p className="text-xs text-muted-foreground">To</p>
                  <p className="text-sm font-medium mt-1">
                    {selectedConnection.toPoint.nodeTitle}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <div
                      className={`h-1.5 w-1.5 rounded-full ${fragmentCardAccent[selectedConnection.toPoint.fragment.type].dot}`}
                    />
                    <span className="text-[10px] tracking-wider text-muted-foreground">
                      {
                        fragmentCardAccent[
                          selectedConnection.toPoint.fragment.type
                        ].label
                      }
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {selectedConnection.toPoint.fragment.content}
                  </p>
                </div>

                <div className="rounded-md border border-dashed border-primary/35 bg-primary/5 p-3">
                  <p className="text-[11px] font-semibold tracking-wider text-primary">
                    WHY CONNECTED
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                    {selectedConnection.reason}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-2">
                    Strength: {selectedConnection.strength}
                  </p>
                </div>
              </>
            ) : null}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default ClarityGraphCanvasInner;
