import { getServerSession } from "@/action/get-session";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

type Params = {
  params: Promise<{ entryId: string }>;
};

export const PATCH = async (request: Request, { params }: Params) => {
  const session = await getServerSession();
  const user = session?.user;

  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { entryId } = await params;
  const body = (await request.json().catch(() => null)) as {
    question?: unknown;
    answer?: unknown;
    type?: unknown;
  } | null;

  const data: {
    question?: string;
    answer?: string;
    type?: "QUESTION" | "SOLVED";
  } = {};

  if (typeof body?.question === "string") {
    data.question = body.question.trim();
  }

  if (typeof body?.answer === "string") {
    data.answer = body.answer.trim();
  }

  if (body?.type === "QUESTION" || body?.type === "SOLVED") {
    data.type = body.type;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json(
      { error: "No valid fields to update" },
      { status: 400 },
    );
  }

  const existing = await prisma.journalEntry.findFirst({
    where: {
      id: entryId,
      userId: user.id,
    },
    select: { id: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Entry not found" }, { status: 404 });
  }

  const updated = await prisma.journalEntry.update({
    where: { id: entryId },
    data,
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
      id: updated.id,
      question: updated.question,
      answer: updated.answer,
      type: updated.type,
      createdAt: updated.createdAt.toISOString(),
      entryDate: updated.entryDate.toISOString().slice(0, 10),
    },
  });
};

export const DELETE = async (_request: Request, { params }: Params) => {
  const session = await getServerSession();
  const user = session?.user;

  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { entryId } = await params;

  const existing = await prisma.journalEntry.findFirst({
    where: {
      id: entryId,
      userId: user.id,
    },
    select: { id: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Entry not found" }, { status: 404 });
  }

  await prisma.journalEntry.delete({ where: { id: entryId } });

  return NextResponse.json({ ok: true });
};
