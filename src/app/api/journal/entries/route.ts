import { getServerSession } from "@/action/get-session";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

const toEntryDate = (value: Date) => {
  return new Date(
    Date.UTC(value.getFullYear(), value.getMonth(), value.getDate()),
  );
};

export const GET = async () => {
  const session = await getServerSession();
  const user = session?.user;

  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const entries = await prisma.journalEntry.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      question: true,
      answer: true,
      type: true,
      createdAt: true,
      entryDate: true,
    },
  });

  return NextResponse.json({
    entries: entries.map((entry) => ({
      id: entry.id,
      question: entry.question,
      answer: entry.answer,
      type: entry.type,
      createdAt: entry.createdAt.toISOString(),
      entryDate: entry.entryDate.toISOString().slice(0, 10),
    })),
  });
};

export const POST = async (request: Request) => {
  const session = await getServerSession();
  const user = session?.user;

  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    question?: unknown;
    answer?: unknown;
    type?: unknown;
    createdAt?: unknown;
  } | null;

  const question =
    typeof body?.question === "string" ? body.question.trim() : "";
  const answer = typeof body?.answer === "string" ? body.answer.trim() : "";
  const type = body?.type === "SOLVED" ? "SOLVED" : "QUESTION";

  if (!question || !answer) {
    return NextResponse.json(
      { error: "question and answer are required" },
      { status: 400 },
    );
  }

  const createdAt =
    typeof body?.createdAt === "string" &&
    !Number.isNaN(new Date(body.createdAt).getTime())
      ? new Date(body.createdAt)
      : new Date();

  const created = await prisma.journalEntry.create({
    data: {
      userId: user.id,
      question,
      answer,
      type,
      createdAt,
      entryDate: toEntryDate(createdAt),
    },
    select: {
      id: true,
      question: true,
      answer: true,
      type: true,
      createdAt: true,
      entryDate: true,
    },
  });

  return NextResponse.json({
    entry: {
      id: created.id,
      question: created.question,
      answer: created.answer,
      type: created.type,
      createdAt: created.createdAt.toISOString(),
      entryDate: created.entryDate.toISOString().slice(0, 10),
    },
  });
};
