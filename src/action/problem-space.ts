"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "./get-session";

export const getProblemSpaces = async () => {
  const session = await getServerSession();
  const user = session?.user;

  if (!user) {
    return null;
  }

  const problemSpaces = await prisma.user.findMany({
    where: { id: user.id },
    include: {
      problemSpaces: true,
    },
  });

  return { problemSpaces: problemSpaces[0]?.problemSpaces || [] };
};

export const createProblemSpace = async (data: any) => {
  const session = await getServerSession();
  const user = session?.user;

  if (!user) {
    return null;
  }

  const newProblemSpace = await prisma.problemSpace.create({
    data: {
      id: crypto.randomUUID(),
      title: data.title,
      description: data.description,
      createdAt: new Date(),
      updatedAt: new Date(),
      user: {
        connect: {
          id: user.id,
        },
      },
    },
  });

  return newProblemSpace;
};
