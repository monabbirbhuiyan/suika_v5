"use server";

import prisma from "@/lib/prisma";
import { decideProblemSpaceClarityProgress } from "@/lib/ai";
import { getServerSession } from "./get-session";

export const getProblemSpaces = async () => {
  const session = await getServerSession();
  const user = session?.user;

  if (!user) {
    return null;
  }

  const problemSpaces = await prisma.problemSpace.findMany({
    where: { userId: user.id },
    include: {
      fragments: {
        select: {
          type: true,
        },
      },
    },
  });

  return { problemSpaces };
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

export const updateProblemSpace = async (
  id: string,
  data: { title: string; description?: string | null },
) => {
  const session = await getServerSession();
  const user = session?.user;

  if (!user || !id) {
    return null;
  }

  const existing = await prisma.problemSpace.findFirst({
    where: {
      id,
      userId: user.id,
    },
    select: {
      id: true,
    },
  });

  if (!existing) {
    return null;
  }

  const updated = await prisma.problemSpace.update({
    where: {
      id,
    },
    data: {
      title: data.title,
      description: data.description ?? null,
    },
    select: {
      id: true,
      title: true,
      description: true,
      updatedAt: true,
    },
  });

  return updated;
};

export const getProblemSpaceById = async (id: string) => {
  const session = await getServerSession();
  const user = session?.user;

  if (!user || !id) {
    return null;
  }

  const problemSpace = await prisma.problemSpace.findFirst({
    where: {
      id,
      userId: user.id,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
      fragments: {
        orderBy: {
          sortOrder: "asc",
        },
      },
      graphNodes: {
        include: {
          fragments: {
            orderBy: {
              sortOrder: "asc",
            },
          },
          pins: {
            orderBy: {
              sortOrder: "asc",
            },
          },
        },
      },
      suggestions: true,
    },
  });

  if (!problemSpace) {
    return null;
  }

  const shouldBackfillProgress =
    (problemSpace.progress ?? 0) <= 0 &&
    (problemSpace.fragments?.length ?? 0) > 0;

  if (shouldBackfillProgress) {
    const input = problemSpace.graphNodes
      .map((node) => ({
        nodeId: node.id,
        nodeTitle: node.title,
        fragments: node.fragments.map((fragment) => ({
          id: fragment.id,
          type: fragment.type,
          content: fragment.content,
        })),
      }))
      .filter((node) => node.fragments.length > 0);

    try {
      const progress = await decideProblemSpaceClarityProgress(input);

      if (progress !== (problemSpace.progress ?? 0)) {
        await prisma.problemSpace.update({
          where: { id: problemSpace.id },
          data: { progress },
        });
        problemSpace.progress = progress;
      }
    } catch {
      // Return the problem space even when AI scoring is unavailable.
    }
  }

  return problemSpace;
};
