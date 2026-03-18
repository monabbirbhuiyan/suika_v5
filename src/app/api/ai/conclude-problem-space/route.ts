import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "@/action/get-session";
import prisma from "@/lib/prisma";
import { generateProblemSpaceConclusion } from "@/lib/ai";

export const runtime = "nodejs";

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

    const result = await generateProblemSpaceConclusion(input);

    return NextResponse.json({ result });
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
