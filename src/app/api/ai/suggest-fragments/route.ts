import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "@/action/get-session";
import prisma from "@/lib/prisma";
import { generateFragmentSuggestions } from "@/lib/ai";
import { stableInputSignature } from "@/lib/cache-signature";

export const runtime = "nodejs";

const requestSchema = z.object({
  problemSpaceId: z.string().min(1),
});

const suggestionsCache = new Map<
  string,
  { expiresAt: number; suggestions: Awaited<ReturnType<typeof generateFragmentSuggestions>> }
>();

const CACHE_TTL_MS = 60_000;

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
    const cached = suggestionsCache.get(signature);

    if (cached && cached.expiresAt > Date.now()) {
      return NextResponse.json({ suggestions: cached.suggestions, cached: true });
    }

    const suggestions = await generateFragmentSuggestions(input);

    suggestionsCache.set(signature, {
      suggestions,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });

    return NextResponse.json({ suggestions, cached: false });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      {
        error: "Fragment suggestion failed",
        message,
      },
      { status: 500 },
    );
  }
}
