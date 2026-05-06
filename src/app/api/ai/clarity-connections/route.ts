import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { z } from "zod";
import { getServerSession } from "@/action/get-session";
import prisma from "@/lib/prisma";
import { generateClarityGraphConnections } from "@/lib/ai";

export const runtime = "nodejs";

const CONNECTIONS_CACHE_TTL_MS = 6 * 60 * 60 * 1000;

type CachedConnections = {
  expiresAt: number;
  suggestions: Awaited<ReturnType<typeof generateClarityGraphConnections>>;
};

const connectionsCache = (() => {
  const globalRef = globalThis as typeof globalThis & {
    __suikaConnectionsCache?: Map<string, CachedConnections>;
  };

  if (!globalRef.__suikaConnectionsCache) {
    globalRef.__suikaConnectionsCache = new Map<string, CachedConnections>();
  }

  return globalRef.__suikaConnectionsCache;
})();

const shouldLogConnections = () => {
  return (
    process.env.LOG_AI_CONNECTIONS === "true" ||
    process.env.NODE_ENV !== "production"
  );
};

const requestSchema = z.object({
  problemSpaceId: z.string().min(1),
});

const stableInputSignature = (
  input: Array<{
    nodeId: string;
    nodeTitle: string;
    fragments: Array<{ id: string; type: string; content: string }>;
  }>,
) => {
  const normalized = [...input]
    .map((node) => ({
      nodeId: node.nodeId,
      nodeTitle: node.nodeTitle,
      fragments: [...node.fragments]
        .map((fragment) => ({
          id: fragment.id,
          type: fragment.type,
          content: fragment.content.trim(),
        }))
        .sort((a, b) => a.id.localeCompare(b.id)),
    }))
    .sort((a, b) => a.nodeId.localeCompare(b.nodeId));

  return createHash("sha256").update(JSON.stringify(normalized)).digest("hex");
};

export async function POST(request: Request) {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const problemSpace = await prisma.problemSpace.findFirst({
      where: {
        id: parsed.data.problemSpaceId,
        userId: session.user.id,
      },
      include: {
        graphNodes: {
          orderBy: {
            id: "asc",
          },
          include: {
            fragments: {
              orderBy: {
                id: "asc",
              },
              select: {
                id: true,
                type: true,
                content: true,
              },
            },
          },
        },
      },
    });

    if (!problemSpace) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const input = problemSpace.graphNodes
      .map((node) => ({
        nodeId: node.id,
        nodeTitle: node.title,
        fragments: node.fragments,
      }))
      .filter((node) => node.fragments.length > 0);

    const signature = stableInputSignature(input);
    const cached = connectionsCache.get(signature);

    if (cached && cached.expiresAt > Date.now()) {
      const cachedCoveredNodeIds = new Set(
        cached.suggestions.flatMap((edge) => [edge.fromNodeId, edge.toNodeId]),
      );

      return NextResponse.json({
        suggestions: cached.suggestions,
        meta: {
          nodeCount: input.length,
          fragmentCount: input.reduce(
            (total, node) => total + node.fragments.length,
            0,
          ),
          suggestionCount: cached.suggestions.length,
          coveredNodeCount: cachedCoveredNodeIds.size,
          uncoveredNodeCount: Math.max(
            0,
            input.length - cachedCoveredNodeIds.size,
          ),
          cached: true,
        },
      });
    }

    const suggestions = await generateClarityGraphConnections(input);

    connectionsCache.set(signature, {
      suggestions,
      expiresAt: Date.now() + CONNECTIONS_CACHE_TTL_MS,
    });

    const coveredNodeIds = new Set<string>();
    suggestions.forEach((edge) => {
      coveredNodeIds.add(edge.fromNodeId);
      coveredNodeIds.add(edge.toNodeId);
    });

    const meta = {
      nodeCount: input.length,
      fragmentCount: input.reduce(
        (total, node) => total + node.fragments.length,
        0,
      ),
      suggestionCount: suggestions.length,
      coveredNodeCount: coveredNodeIds.size,
      uncoveredNodeCount: Math.max(0, input.length - coveredNodeIds.size),
      cached: false,
    };

    if (shouldLogConnections()) {
      // Structured JSON log for easy copy/paste and debugging.
      console.log(
        "[AI_CONNECTIONS_JSON]",
        JSON.stringify(
          {
            problemSpaceId: parsed.data.problemSpaceId,
            suggestions,
            meta,
          },
          null,
          2,
        ),
      );
    }

    return NextResponse.json({
      suggestions,
      meta,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      {
        error: "Clarity connection analysis failed",
        message,
      },
      { status: 500 },
    );
  }
}
