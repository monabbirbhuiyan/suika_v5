import { getServerSession } from "@/action/get-session";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

const VALID_FREQUENCIES = ["daily", "weekly", "never"] as const;
type Frequency = (typeof VALID_FREQUENCIES)[number];

// ─── GET ─────────────────────────────────────────────────────────────────────
export const GET = async () => {
  const session = await getServerSession();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const prefs = await prisma.notificationPreferences.upsert({
    where: { userId },
    create: { userId },
    update: {},
  });

  return NextResponse.json({ prefs });
};

// ─── PATCH ────────────────────────────────────────────────────────────────────
export const PATCH = async (request: Request) => {
  const session = await getServerSession();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const boolFields = [
    "emailWeeklySummary",
    "emailProblemSpaceActivity",
    "emailProductUpdates",
    "emailSecurityAlerts",
    "inAppProblemProgress",
    "inAppMilestones",
  ] as const;

  const data: Record<string, boolean | string> = {};

  for (const field of boolFields) {
    if (field in body) {
      if (typeof body[field] !== "boolean") {
        return NextResponse.json(
          { error: `Field ${field} must be a boolean` },
          { status: 400 },
        );
      }
      data[field] = body[field] as boolean;
    }
  }

  if ("digestFrequency" in body) {
    if (!VALID_FREQUENCIES.includes(body.digestFrequency as Frequency)) {
      return NextResponse.json(
        { error: "digestFrequency must be daily | weekly | never" },
        { status: 400 },
      );
    }
    data.digestFrequency = body.digestFrequency as string;
  }

  const prefs = await prisma.notificationPreferences.upsert({
    where: { userId },
    create: { userId, ...data },
    update: data,
  });

  return NextResponse.json({ prefs });
};
