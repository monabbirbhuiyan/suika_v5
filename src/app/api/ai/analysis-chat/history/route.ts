import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "@/action/get-session";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";

const requestSchema = z.object({
  problemSpaceId: z.string().min(1),
});

const CLEANUP_THRESHOLD_DAYS = 7;

export async function GET(request: Request) {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const problemSpaceId = searchParams.get("problemSpaceId");

    if (!problemSpaceId) {
      return NextResponse.json(
        { error: "problemSpaceId is required" },
        { status: 400 },
      );
    }

    // Lazy cleanup: delete messages older than 7 days
    const cleanupThreshold = new Date();
    cleanupThreshold.setDate(cleanupThreshold.getDate() - CLEANUP_THRESHOLD_DAYS);

    await prisma.analysisChatMessage.deleteMany({
      where: {
        userId: session.user.id,
        createdAt: {
          lt: cleanupThreshold,
        },
      },
    });

    // Fetch messages for this problem space
    const messages = await prisma.analysisChatMessage.findMany({
      where: {
        problemSpaceId,
        userId: session.user.id,
      },
      orderBy: {
        createdAt: "asc",
      },
      select: {
        id: true,
        role: true,
        content: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ messages });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      {
        error: "Failed to fetch chat history",
        message,
      },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
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

    // Delete all messages for this problem space and user
    const deleted = await prisma.analysisChatMessage.deleteMany({
      where: {
        problemSpaceId: parsed.data.problemSpaceId,
        userId: session.user.id,
      },
    });

    return NextResponse.json({ deleted: deleted.count });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      {
        error: "Failed to delete chat history",
        message,
      },
      { status: 500 },
    );
  }
}
