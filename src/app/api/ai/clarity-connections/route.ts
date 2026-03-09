import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "@/action/get-session";
import prisma from "@/lib/prisma";
import { generateClarityGraphConnections } from "@/lib/ai";

export const runtime = "nodejs";

const shouldLogConnections = () => {
  return (
    process.env.LOG_AI_CONNECTIONS === "true" ||
    process.env.NODE_ENV !== "production"
  );
};

const requestSchema = z.object({
  problemSpaceId: z.string().min(1),
});

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
          include: {
            fragments: {
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

    const suggestions = await generateClarityGraphConnections(input);

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
