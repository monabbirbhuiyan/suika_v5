import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "@/action/get-session";
import prisma from "@/lib/prisma";
import { chatWithGroq } from "@/lib/ai";

export const runtime = "nodejs";

const requestSchema = z.object({
  problemSpaceId: z.string().min(1),
  defendingSide: z.enum(["PLAINTIFF", "DEFENDANT"]).optional(),
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1),
      }),
    )
    .min(1),
});

function buildSystemPrompt(
  problemSpace: {
    title: string;
    description: string | null;
    graphNodes: Array<{
      id: string;
      title: string;
      fragments: Array<{
        id: string;
        type: string;
        content: string;
      }>;
    }>;
  },
  defendingSide: "PLAINTIFF" | "DEFENDANT",
): string {
  const fragmentsByNode = problemSpace.graphNodes
    .filter((node) => node.fragments.length > 0)
    .map((node) => {
      const fragmentList = node.fragments
        .map((f) => `    - [${f.type}] ${f.content}`)
        .join("\n");
      return `  Node: "${node.title}"\n${fragmentList}`;
    })
    .join("\n\n");

  return `You are a legal AI assistant helping analyze a case. You have access to the full problem space data for "${problemSpace.title}".

PROBLEM SPACE DESCRIPTION:
${problemSpace.description || "No description provided."}

FRAGMENTS BY NODE:
${fragmentsByNode || "No fragments available."}

DEFENDING SIDE: ${defendingSide === "PLAINTIFF" ? "Plaintiff (seeking remedy)" : "Defendant (responding to claims)"}

INSTRUCTIONS:
1. You are a knowledgeable legal assistant. Help the user understand the case analysis.
2. Explain legal concepts, reasoning, and strategy in clear language.
3. If you need more information to provide a better answer, ASK the user specific questions.
4. You can reference specific fragments by their content to support your explanations.
5. Be concise but thorough. Use bullet points when appropriate.
6. If the user asks about something not covered in the fragments, let them know and suggest what additional information might be helpful.
7. Always maintain a professional, helpful tone.
8. When discussing outcomes or arguments, reference the specific fragments that support your points.

Remember: You have access to all the fragments in this problem space. Use them to provide informed, context-aware responses.`;
}

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
          orderBy: { id: "asc" },
          include: {
            fragments: {
              orderBy: { id: "asc" },
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

    const side = parsed.data.defendingSide ?? "PLAINTIFF";
    const systemPrompt = buildSystemPrompt(problemSpace, side);

    const messages = [
      { role: "system" as const, content: systemPrompt },
      ...parsed.data.messages.map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      })),
    ];

    const reply = await chatWithGroq({
      messages,
      maxTokens: 1024,
      temperature: 0.7,
      responseMimeType: "text/plain",
    });

    // Save the latest user message and assistant reply to history
    const latestUserMessage = parsed.data.messages[parsed.data.messages.length - 1];
    if (latestUserMessage && latestUserMessage.role === "user") {
      await prisma.analysisChatMessage.createMany({
        data: [
          {
            problemSpaceId: parsed.data.problemSpaceId,
            userId: session.user.id,
            role: "user",
            content: latestUserMessage.content,
          },
          {
            problemSpaceId: parsed.data.problemSpaceId,
            userId: session.user.id,
            role: "assistant",
            content: reply,
          },
        ],
      });
    }

    return NextResponse.json({ reply });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      {
        error: "Analysis chat failed",
        message,
      },
      { status: 500 },
    );
  }
}
