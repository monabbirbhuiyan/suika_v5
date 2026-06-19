import { getServerSession } from "@/action/get-session";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

const VALID_RETENTION_POLICIES = [
  "forever",
  "365d",
  "180d",
  "90d",
  "30d",
] as const;

type RetentionPolicy = (typeof VALID_RETENTION_POLICIES)[number];

const upsertDefaults = (userId: string) =>
  prisma.privacyPreferences.upsert({
    where: { userId },
    create: { userId },
    update: {},
  });

export const GET = async () => {
  const session = await getServerSession();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const prefs = await upsertDefaults(userId);

  return NextResponse.json({ prefs });
};

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
    "profileSearchable",
    "allowUsageAnalytics",
    "allowAiTraining",
    "allowPersonalizedInsights",
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

  if ("dataRetentionPolicy" in body) {
    if (
      !VALID_RETENTION_POLICIES.includes(
        body.dataRetentionPolicy as RetentionPolicy,
      )
    ) {
      return NextResponse.json(
        {
          error:
            "dataRetentionPolicy must be forever | 365d | 180d | 90d | 30d",
        },
        { status: 400 },
      );
    }
    data.dataRetentionPolicy = body.dataRetentionPolicy as string;
  }

  const prefs = await prisma.privacyPreferences.upsert({
    where: { userId },
    create: { userId, ...data },
    update: data,
  });

  return NextResponse.json({ prefs });
};

// POST action "export": returns a snapshot of user-owned account data.
export const POST = async (request: Request) => {
  const session = await getServerSession();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;

  if (!body || body.action !== "export") {
    return NextResponse.json(
      { error: "Only { action: 'export' } is supported." },
      { status: 400 },
    );
  }

  const [user, prefs, notifications, problemSpaces] =
    await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          bio: true,
          image: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.privacyPreferences.findUnique({ where: { userId } }),
      prisma.notificationPreferences.findUnique({ where: { userId } }),
      prisma.problemSpace.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
      }),
    ]);

  const exportPayload = {
    exportedAt: new Date().toISOString(),
    user,
    preferences: {
      privacy: prefs,
      notifications,
    },
    problemSpaces,
  };

  return NextResponse.json({ data: exportPayload });
};

// DELETE action "delete-account": permanently deletes user and all cascaded data.
export const DELETE = async (request: Request) => {
  const session = await getServerSession();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;

  if (!body || body.confirmation !== "DELETE") {
    return NextResponse.json(
      { error: "confirmation must equal DELETE" },
      { status: 400 },
    );
  }

  await prisma.user.delete({ where: { id: userId } });

  return NextResponse.json({ success: true });
};
