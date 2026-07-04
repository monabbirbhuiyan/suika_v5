import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { z } from "zod";
import { getServerSession } from "@/action/get-session";
import prisma from "@/lib/prisma";
import { generateProblemSpaceConclusion } from "@/lib/ai";

export const runtime = "nodejs";

const requestSchema = z.object({
  problemSpaceId: z.string().min(1),
  defendingSide: z.enum(["PLAINTIFF", "DEFENDANT"]).optional(),
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

    const signature = stableInputSignature(input) + (parsed.data.defendingSide ? `::${parsed.data.defendingSide}` : "");

    if (
      problemSpace.aiConclusionSignature === signature &&
      problemSpace.aiConclusionCache
    ) {
      return NextResponse.json({
        result: problemSpace.aiConclusionCache,
        cached: true,
      });
    }

    const result = await generateProblemSpaceConclusion(input, parsed.data.defendingSide);

    await prisma.problemSpace.update({
      where: { id: problemSpace.id },
      data: {
        aiConclusionSignature: signature,
        aiConclusionCache: result,
      },
    });

    return NextResponse.json({ result, cached: false });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      {
        error: "Problem space conclusion failed",
        message,
      },
      { status: 500 },
    );
  }
}
