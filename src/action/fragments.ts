"use server";
import { Prisma } from "@/generated/prisma";
import prisma from "@/lib/prisma";
import { singleInstanceFragmentTypes } from "@/lib/schemas";
import { getServerSession } from "./get-session";

const singleInstanceFragmentTypeSet = new Set<string>(
  singleInstanceFragmentTypes,
);

const isUniqueConstraintError = (error: unknown) => {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
};

export const createFragment = async (
  problemSpaceId: string,
  data: {
    title?: string;
    content: string;
    nodeId: string;
    type: "QUESTION" | "IDEA" | "OBSERVATION" | "CONSTRAINS" | "CONCLUSION";
  },
) => {
  const session = await getServerSession();
  const user = session?.user;

  if (!user || !problemSpaceId) {
    return null;
  }

  const problemSpace = await prisma.problemSpace.findFirst({
    where: {
      id: problemSpaceId,
      userId: user.id,
    },
    select: {
      id: true,
    },
  });

  if (!problemSpace) {
    return null;
  }

  const node = await prisma.graphNode.findFirst({
    where: {
      id: data.nodeId,
      problemSpaceId,
      problemSpace: {
        userId: user.id,
      },
    },
    select: {
      id: true,
    },
  });

  if (!node) {
    return null;
  }

  if (singleInstanceFragmentTypeSet.has(data.type)) {
    const existingTypeInNode = await prisma.fragment.findFirst({
      where: {
        nodeId: node.id,
        type: data.type,
      },
      select: {
        id: true,
      },
    });

    if (existingTypeInNode) {
      return null;
    }
  }

  let fragment;
  try {
    fragment = await prisma.fragment.create({
      data: {
        content: data.content,
        type: data.type,
        node: {
          connect: {
            id: node.id,
          },
        },
        problemSpace: {
          connect: {
            id: problemSpaceId,
          },
        },
      },
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return null;
    }

    throw error;
  }

  return fragment;
};

export const getFragmentsByProblemSpaceId = async (problemSpaceId: string) => {
  const session = await getServerSession();
  const user = session?.user;

  if (!user || !problemSpaceId) {
    return null;
  }

  const problemSpace = await prisma.problemSpace.findFirst({
    where: {
      id: problemSpaceId,
      userId: user.id,
    },
    select: {
      id: true,
    },
  });

  if (!problemSpace) {
    return null;
  }

  const fragments = await prisma.fragment.findMany({
    where: {
      problemSpaceId,
    },
    include: {
      node: {
        select: {
          id: true,
          title: true,
        },
      },
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  return fragments;
};

export const createNode = async (
  problemSpaceId: string,
  data: {
    title: string;
  },
) => {
  const session = await getServerSession();
  const user = session?.user;

  if (!user || !problemSpaceId) {
    return null;
  }

  const problemSpace = await prisma.problemSpace.findFirst({
    where: {
      id: problemSpaceId,
      userId: user.id,
    },
    select: {
      id: true,
    },
  });

  if (!problemSpace) {
    return null;
  }

  const node = await prisma.graphNode.create({
    data: {
      title: data.title,
      problemSpace: {
        connect: {
          id: problemSpaceId,
        },
      },
    },
  });

  return node;
};

export const updateNode = async (
  problemSpaceId: string,
  nodeId: string,
  data: {
    title: string;
  },
) => {
  const session = await getServerSession();
  const user = session?.user;

  if (!user || !problemSpaceId || !nodeId) {
    return null;
  }

  const node = await prisma.graphNode.findFirst({
    where: {
      id: nodeId,
      problemSpaceId,
      problemSpace: {
        userId: user.id,
      },
    },
    select: {
      id: true,
    },
  });

  if (!node) {
    return null;
  }

  const updatedNode = await prisma.graphNode.update({
    where: {
      id: node.id,
    },
    data: {
      title: data.title,
    },
  });

  return updatedNode;
};

export const deleteNode = async (problemSpaceId: string, nodeId: string) => {
  const session = await getServerSession();
  const user = session?.user;

  if (!user || !problemSpaceId || !nodeId) {
    return null;
  }

  const node = await prisma.graphNode.findFirst({
    where: {
      id: nodeId,
      problemSpaceId,
      problemSpace: {
        userId: user.id,
      },
    },
    select: {
      id: true,
    },
  });

  if (!node) {
    return null;
  }

  await prisma.graphNode.delete({
    where: {
      id: node.id,
    },
  });

  return { success: true };
};

export const updateFragment = async (
  problemSpaceId: string,
  fragmentId: string,
  data: {
    content: string;
    type: "QUESTION" | "IDEA" | "OBSERVATION" | "CONSTRAINS" | "CONCLUSION";
  },
) => {
  const session = await getServerSession();
  const user = session?.user;

  if (!user || !problemSpaceId || !fragmentId) {
    return null;
  }

  const fragment = await prisma.fragment.findFirst({
    where: {
      id: fragmentId,
      problemSpaceId,
      problemSpace: {
        userId: user.id,
      },
    },
    select: {
      id: true,
      nodeId: true,
      type: true,
    },
  });

  if (!fragment) {
    return null;
  }

  if (
    data.type !== fragment.type &&
    singleInstanceFragmentTypeSet.has(data.type)
  ) {
    const existingTypeInNode = await prisma.fragment.findFirst({
      where: {
        nodeId: fragment.nodeId,
        type: data.type,
        id: {
          not: fragment.id,
        },
      },
      select: {
        id: true,
      },
    });

    if (existingTypeInNode) {
      return null;
    }
  }

  let updatedFragment;
  try {
    updatedFragment = await prisma.fragment.update({
      where: {
        id: fragment.id,
      },
      data: {
        content: data.content,
        type: data.type,
      },
      select: {
        id: true,
      },
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return null;
    }

    throw error;
  }

  return updatedFragment;
};

export const deleteFragment = async (
  problemSpaceId: string,
  fragmentId: string,
) => {
  const session = await getServerSession();
  const user = session?.user;

  if (!user || !problemSpaceId || !fragmentId) {
    return null;
  }

  const fragment = await prisma.fragment.findFirst({
    where: {
      id: fragmentId,
      problemSpaceId,
      problemSpace: {
        userId: user.id,
      },
    },
    select: {
      id: true,
    },
  });

  if (!fragment) {
    return null;
  }

  await prisma.fragment.delete({
    where: {
      id: fragment.id,
    },
  });

  return { success: true };
};
