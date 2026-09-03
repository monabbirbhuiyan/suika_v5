import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "@/action/get-session";
import prisma from "@/lib/prisma";
import { chatWithGemini } from "@/lib/ai";

export const runtime = "nodejs";

const requestSchema = z.object({
  problemSpaceId: z.string().min(1),
  caseStudyText: z.string().min(50, "Case study must be at least 50 characters"),
});

type ParsedNode = {
  title: string;
  fragments: Array<{
    type: string;
    content: string;
  }>;
};

const ORACLE_SYSTEM_PROMPT = `You are an expert Legal Systems Architect and Knowledge Graph Engine for Suika, an AI-powered legal sensemaking platform. Your role is to ingest unstructured legal case briefs, interview notes, or fact summaries and decompose them into structured, interconnected nodes using Suika's proprietary 5-Fragment Schema.

### CORE KNOWLEDGE SCHEMA

Every parsed dispute must belong to an "Oracle Resolution Pathway" (or "Oracle Domain") and contain 2 to 4 distinct thematic **Nodes**.

Each Node MUST adhere to the following 5-Fragment Schema:

1. **Question (Exactly 1 per Node):**
   - The central legal or factual issue that this specific node resolves.
   - Must be precise, legally grounded, and framed as an evaluative question.

2. **Observations (Multiple, Minimum 3):**
   - Concrete, verifiable facts derived strictly from the case brief.
   - Avoid legal conclusions here; capture physical actions, documented records, statements, and timeline data.

3. **Constraints (Multiple, Minimum 2):**
   - External legal, statutory, or evidential boundaries that control the issue.
   - Includes specific statutory sections, common-law tests, standards of proof, or evidentiary hurdles.

4. **Ideas (Multiple, Exactly 2 opposing perspectives):**
   - **Prosecution / Plaintiff / Crown Perspective:** The strategic interpretation arguing for liability, breach, or maximum culpability.
   - **Defense / Respondent / Accused Perspective:** The strategic counter-theory, mitigating explanation, or threshold defense.

5. **Conclusions (Multiple, Minimum 2):**
   - Actionable legal deductions or tactical imperatives for this specific node.
   - Addresses both immediate litigation posture and secondary downstream impacts.

### INGESTION & DECOMPOSITION RULES

1. **Node Independence:** Ensure each node tackles a distinct dimension of the case.
2. **Strict JSON Output:** Produce outputs using clean, valid JSON without generic meta-announcements or introductory fluff.

### OUTPUT FORMAT

Return ONLY a valid JSON array. No markdown, no explanation, no code blocks.

Each element in the array represents a Node:

[
  {
    "title": "Node Title (e.g., Primary Legal Doctrine)",
    "fragments": [
      { "type": "QUESTION", "content": "The central legal question" },
      { "type": "OBSERVATION", "content": "Objective fact 1" },
      { "type": "OBSERVATION", "content": "Objective fact 2" },
      { "type": "OBSERVATION", "content": "Objective fact 3" },
      { "type": "CONSTRAINS", "content": "Legal rule or threshold requirement" },
      { "type": "CONSTRAINS", "content": "Burden of proof or statutory test" },
      { "type": "IDEA", "content": "Plaintiff/Crown strategic argument" },
      { "type": "IDEA", "content": "Defense/Accused strategic counter-theory" },
      { "type": "CONCLUSION", "content": "Primary legal finding" },
      { "type": "CONCLUSION", "content": "Procedural or tactical imperative" }
    ]
  }
]

IMPORTANT RULES:
- Return 2 to 4 nodes.
- Each node MUST have exactly 1 QUESTION, at least 3 OBSERVATIONS, at least 2 CONSTRAINTS, exactly 2 IDEAs, and at least 2 CONCLUSIONS.
- Total fragments per node: minimum 10.
- Fragment types must be EXACTLY: "QUESTION", "OBSERVATION", "CONSTRAINS", "IDEA", "CONCLUSION".
- Return ONLY the JSON array, nothing else.`;

function parseGeminiResponse(text: string): ParsedNode[] | null {
  const trimmed = text.trim();

  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    // Try to recover from markdown code blocks
  }

  const codeBlockMatch = trimmed.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
  if (codeBlockMatch) {
    try {
      const parsed = JSON.parse(codeBlockMatch[1].trim());
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // Continue to fallback
    }
  }

  const start = trimmed.indexOf("[");
  const end = trimmed.lastIndexOf("]");

  if (start < 0 || end < 0 || end <= start) {
    return null;
  }

  try {
    const parsed = JSON.parse(trimmed.slice(start, end + 1));
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function validateAndCleanNodes(raw: unknown[]): ParsedNode[] {
  const validTypes = new Set(["QUESTION", "OBSERVATION", "CONSTRAINS", "IDEA", "CONCLUSION"]);

  return raw
    .filter((node): node is Record<string, unknown> => typeof node === "object" && node !== null)
    .filter((node) => typeof node.title === "string" && Array.isArray(node.fragments))
    .map((node) => ({
      title: (node.title as string).trim(),
      fragments: (node.fragments as unknown[])
        .filter(
          (f): f is Record<string, unknown> =>
            typeof f === "object" && f !== null && "type" in f && "content" in f,
        )
        .filter(
          (f) =>
            typeof f.content === "string" &&
            typeof f.type === "string" &&
            validTypes.has(f.type) &&
            (f.content as string).trim().length > 0,
        )
        .map((f) => ({
          type: f.type as string,
          content: (f.content as string).trim(),
        })),
    }))
    .filter((node) => node.title.length > 0 && node.fragments.length >= 5);
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
      select: { id: true },
    });

    if (!problemSpace) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const reply = await chatWithGemini({
      messages: [
        { role: "system", content: ORACLE_SYSTEM_PROMPT },
        {
          role: "user",
          content: `Analyze and decompose the following case study into structured nodes and fragments:\n\n${parsed.data.caseStudyText}`,
        },
      ],
      maxTokens: 8192,
      temperature: 0.2,
    });

    const rawNodes = parseGeminiResponse(reply);

    if (!rawNodes || rawNodes.length === 0) {
      return NextResponse.json(
        { error: "Failed to parse AI response into structured nodes" },
        { status: 422 },
      );
    }

    const nodes = validateAndCleanNodes(rawNodes);

    if (nodes.length === 0) {
      return NextResponse.json(
        { error: "AI response did not contain valid nodes" },
        { status: 422 },
      );
    }

    return NextResponse.json({ nodes });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      {
        error: "Case study parsing failed",
        message,
      },
      { status: 500 },
    );
  }
}
