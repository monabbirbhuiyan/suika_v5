import { getServerSession } from "@/action/get-session";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

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

  const data: Record<string, string | null> = {};

  if ("name" in body && typeof body.name === "string") {
    if (body.name.trim().length < 2) {
      return NextResponse.json(
        { error: "Name must be at least 2 characters" },
        { status: 400 },
      );
    }
    data.name = body.name.trim();
  }

  if ("bio" in body) {
    if (body.bio === null || body.bio === undefined) {
      data.bio = null;
    } else if (typeof body.bio === "string") {
      if (body.bio.length > 160) {
        return NextResponse.json(
          { error: "Bio must be less than 160 characters" },
          { status: 400 },
        );
      }
      data.bio = body.bio.trim() || null;
    }
  }

  if ("image" in body) {
    if (body.image === null || body.image === undefined) {
      data.image = null;
    } else if (typeof body.image === "string") {
      data.image = body.image.trim() || null;
    }
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data,
    select: {
      id: true,
      name: true,
      email: true,
      bio: true,
      image: true,
    },
  });

  return NextResponse.json({ user });
};