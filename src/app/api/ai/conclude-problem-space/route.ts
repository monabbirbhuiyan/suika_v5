import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "@/action/get-session";
import prisma from "@/lib/prisma";
import { generateProblemSpaceConclusion } from "@/lib/ai";
import { stableInputSignature } from "@/lib/cache-signature";

export const runtime = "nodejs";

const requestSchema = z.object({
  problemSpaceId: z.string().min(1),
  defendingSide: z.enum(["PLAINTIFF", "DEFENDANT"]).optional(),
});

type ConclusionCache = {
  PLAINTIFF?: unknown;
  DEFENDANT?: unknown;
};

type ConclusionSignatureCache = {
  PLAINTIFF?: string;
  DEFENDANT?: string;
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

    const fragmentMap: Record<string, { content: string; type: string }> = {};
    for (const node of input) {
      for (const frag of node.fragments) {
        fragmentMap[frag.id] = { content: frag.content, type: frag.type };
      }
    }

    const side = parsed.data.defendingSide ?? "PLAINTIFF";
    const inputSignature = stableInputSignature(input);
    const sideSignature = `${inputSignature}::${side}`;

    const existingCache = (problemSpace.aiConclusionCache ?? null) as ConclusionCache | null;
    const existingSignatures = (problemSpace.aiConclusionSignature ?? null) as ConclusionSignatureCache | null;

    const cachedSideSignature = existingSignatures?.[side];

    if (cachedSideSignature === sideSignature && existingCache?.[side]) {
      return NextResponse.json({
        result: existingCache[side],
        fragmentMap,
        cached: true,
      });
    }

    const connectionsCache = (problemSpace.aiConnectionsCache ?? null) as Array<{
      fromNodeId: string;
      toNodeId: string;
      fromFragmentId: string;
      toFragmentId: string;
      reason: string;
      strength: string;
    }> | null;

    const result = await generateProblemSpaceConclusion(
      input,
      parsed.data.defendingSide,
      connectionsCache ?? undefined,
    );

    const newCache: ConclusionCache = {
      ...existingCache,
      [side]: result,
    };
    const newSignatures: ConclusionSignatureCache = {
      ...existingSignatures,
      [side]: sideSignature,
    };

    await prisma.problemSpace.update({
      where: { id: problemSpace.id },
      data: {
        aiConclusionSignature: JSON.parse(JSON.stringify(newSignatures)),
        aiConclusionCache: JSON.parse(JSON.stringify(newCache)),
      },
    });

    return NextResponse.json({ result, fragmentMap, cached: false });
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
