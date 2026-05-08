"use server";

import prisma from "@/lib/prisma";
import {
  generateSuikaWeavingSuggestions,
  WeavingSuggestionInput,
} from "../lib/ai";
import { serializeAiSuggestionReason } from "@/lib/ai-suggestion";
import { getServerSession } from "./get-session";
import { Prisma } from "@/generated/prisma";

const byLowerTitle = <T extends { title: string }>(items: T[]) => {
  const map = new Map<string, T>();

  items.forEach((item) => {
    map.set(item.title.trim().toLowerCase(), item);
  });

  return map;
};

export const generateAiWeavingSuggestions = async (problemSpaceId: string) => {
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
    include: {
      graphNodes: {
        include: {
          fragments: {
            select: {
              id: true,
              type: true,
              content: true,
            },
          },
        },
      },
    },
  });

  if (!problemSpace) {
    return null;
  }

  const input: WeavingSuggestionInput[] = problemSpace.graphNodes
    .map((node) => ({
      title: node.title,
      fragments: node.fragments.map((fragment) => ({
        id: fragment.id,
        type: fragment.type,
        content: fragment.content,
      })),
    }))
    .filter(
      (node) => node.fragments.length > 0 && node.title.trim().length > 0,
    );

  if (input.length < 2) {
    return { created: 0, suggestions: [] };
  }

  const generated = await generateSuikaWeavingSuggestions(input);

  if (generated.length === 0) {
    return { created: 0, suggestions: [] };
  }

  const nodeByTitle = byLowerTitle(
    problemSpace.graphNodes.map((node) => ({
      id: node.id,
      title: node.title,
      fragmentIds: new Set(node.fragments.map((fragment) => fragment.id)),
    })),
  );

  const fragmentById = new Map(
    problemSpace.graphNodes.flatMap((node) =>
      node.fragments.map((fragment) => [fragment.id, fragment] as const),
    ),
  );

  const existing = await prisma.aiSuggestion.findMany({
    where: {
      problemSpaceId,
      dismissedAt: null,
      accepted: false,
    },
    select: {
      fromTitle: true,
      toTitle: true,
      reason: true,
    },
  });

  const existingKeys = new Set(
    existing.map(
      (item) =>
        `${item.fromTitle.trim().toLowerCase()}::${item.toTitle.trim().toLowerCase()}::${item.reason.trim().toLowerCase()}`,
    ),
  );

  const data = generated
    .filter((item) => {
      const fromNode = nodeByTitle.get(item.fromTitle.trim().toLowerCase());
      const toNode = nodeByTitle.get(item.toTitle.trim().toLowerCase());

      if (!fromNode || !toNode || fromNode.id === toNode.id) {
        return false;
      }

      if (!fromNode.fragmentIds.has(item.focusFragmentId)) {
        return false;
      }

      const key = `${fromNode.title.trim().toLowerCase()}::${toNode.title.trim().toLowerCase()}::${item.reason.trim().toLowerCase()}`;

      return !existingKeys.has(key);
    })
    .map((item) => {
      const focusFragment = fragmentById.get(item.focusFragmentId);

      if (!focusFragment) {
        return null;
      }

      return {
        problemSpaceId,
        fromTitle: item.fromTitle,
        toTitle: item.toTitle,
        reason: serializeAiSuggestionReason({
          kind: item.toTitle,
          summary: item.reason,
          focus: {
            nodeTitle: item.fromTitle,
            fragmentId: focusFragment.id,
            fragmentType: focusFragment.type,
            fragmentContent: focusFragment.content,
          },
          recommendation: item.recommendation,
          rationale: item.rationale,
        }),
        strength: item.strength,
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  if (data.length === 0) {
    return { created: 0, suggestions: [] };
  }

  await prisma.aiSuggestion.createMany({
    data,
  });

  return { created: data.length };
};

export const acceptAiSuggestion = async (
  problemSpaceId: string,
  suggestionId: string,
) => {
  const session = await getServerSession();
  const user = session?.user;

  if (!user || !problemSpaceId || !suggestionId) {
    return null;
  }

  try {
    return await prisma.aiSuggestion.update({
      where: {
        id: suggestionId,
        problemSpaceId,
        problemSpace: { userId: user.id },
      },
      data: { accepted: true, dismissedAt: null },
      select: { id: true, accepted: true },
    });
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2025"
    ) {
      return null;
    }
    throw e;
  }
};

export const dismissAiSuggestion = async (
  problemSpaceId: string,
  suggestionId: string,
) => {
  const session = await getServerSession();
  const user = session?.user;

  if (!user || !problemSpaceId || !suggestionId) {
    return null;
  }

  try {
    return await prisma.aiSuggestion.update({
      where: {
        id: suggestionId,
        problemSpaceId,
        problemSpace: { userId: user.id },
      },
      data: { dismissedAt: new Date() },
      select: { id: true, dismissedAt: true },
    });
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2025"
    ) {
      return null;
    }
    throw e;
  }
};
