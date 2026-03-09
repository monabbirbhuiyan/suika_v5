import { NextResponse } from "next/server";
import { z } from "zod";
import { analyzeFragmentRelationships } from "@/lib/ai";

export const runtime = "nodejs";

const fragmentSchema = z.object({
  id: z.string().min(1),
  type: z.enum(["QUESTION", "IDEA", "OBSERVATION", "CONSTRAINS", "CONCLUSION"]),
  content: z.string().min(1),
});

const requestSchema = z.object({
  fragments: z.array(fragmentSchema).min(2),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const relationships = await analyzeFragmentRelationships(
      parsed.data.fragments,
    );

    return NextResponse.json({ relationships });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      {
        error: "Failed to analyze fragments",
        message,
      },
      { status: 500 },
    );
  }
}
