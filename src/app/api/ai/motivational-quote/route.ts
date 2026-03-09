import { NextResponse } from "next/server";
import { getServerSession } from "@/action/get-session";
import { generateSuikaMotivationalQuote } from "@/lib/ai";

export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await generateSuikaMotivationalQuote();

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "private, max-age=60, stale-while-revalidate=120",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      {
        error: "Quote request failed",
        message,
      },
      { status: 500 },
    );
  }
}
