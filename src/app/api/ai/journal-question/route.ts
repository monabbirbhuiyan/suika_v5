import { NextResponse } from "next/server";
import { getServerSession } from "@/action/get-session";
import { chatWithGroq } from "@/lib/ai";

export const runtime = "nodejs";

const fallbackQuestions = [
  "What is the one question that, if answered today, would unlock your next breakthrough?",
  "What did you solve today that your past self would be proud of?",
  "What tiny insight changed your direction today, and why does it matter?",
  "If tomorrow depended on one smart move tonight, what would you write down now?",
];

export async function GET() {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      const question = await chatWithGroq({
        messages: [
          {
            role: "system",
            content:
              "You are Suika Journal AI. Return one concise, catchy, motivating reflection question only. It must ask either what the user is currently questioning or what they solved today. Keep it under 22 words.",
          },
          {
            role: "user",
            content:
              "Give me a daily reflection question that feels energizing and personal. Output only one question sentence, no numbering, no markdown.",
          },
        ],
        maxTokens: 80,
        temperature: 0.8,
      });

      const cleaned = question.replace(/\s+/g, " ").trim();
      const safeQuestion =
        cleaned.length > 0
          ? cleaned.slice(0, 180)
          : fallbackQuestions[
              Math.floor(Math.random() * fallbackQuestions.length)
            ];

      return NextResponse.json({
        question: safeQuestion,
        source: "ai",
      });
    } catch {
      const question =
        fallbackQuestions[Math.floor(Math.random() * fallbackQuestions.length)];

      return NextResponse.json({
        question,
        source: "fallback",
      });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      {
        error: "Journal question generation failed",
        message,
      },
      { status: 500 },
    );
  }
}
