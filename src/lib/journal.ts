export type JournalEntryType = "QUESTION" | "SOLVED";

export type JournalEntry = {
  id: string;
  createdAt: string;
  entryDate: string;
  question: string;
  answer: string;
  type: JournalEntryType;
};

export type JournalPromptState = {
  question: string;
  askedAt: string;
};

const DAY_MS = 24 * 60 * 60 * 1000;

const promptKey = (userId: string) => `suika:journal:prompt:${userId}`;

export const isPromptExpired = (askedAtIso: string) => {
  const askedAt = new Date(askedAtIso).getTime();
  if (Number.isNaN(askedAt)) {
    return true;
  }

  return Date.now() - askedAt >= DAY_MS;
};

export const readPromptState = (userId: string): JournalPromptState | null => {
  try {
    const raw = localStorage.getItem(promptKey(userId));
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as JournalPromptState;
    if (!parsed?.question || !parsed?.askedAt) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
};

export const writePromptState = (userId: string, state: JournalPromptState) => {
  localStorage.setItem(promptKey(userId), JSON.stringify(state));
};

const parseEntriesResponse = (payload: unknown): JournalEntry[] => {
  if (!payload || typeof payload !== "object") {
    return [];
  }

  const items = (payload as { entries?: unknown[] }).entries;
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .map((entry) => {
      if (!entry || typeof entry !== "object") {
        return null;
      }

      const record = entry as {
        id?: unknown;
        createdAt?: unknown;
        entryDate?: unknown;
        question?: unknown;
        answer?: unknown;
        type?: unknown;
      };

      if (
        typeof record.id !== "string" ||
        typeof record.createdAt !== "string" ||
        typeof record.entryDate !== "string" ||
        typeof record.question !== "string" ||
        typeof record.answer !== "string" ||
        (record.type !== "QUESTION" && record.type !== "SOLVED")
      ) {
        return null;
      }

      return {
        id: record.id,
        createdAt: record.createdAt,
        entryDate: record.entryDate,
        question: record.question,
        answer: record.answer,
        type: record.type,
      } satisfies JournalEntry;
    })
    .filter((entry): entry is JournalEntry => Boolean(entry));
};

export const readJournalEntries = async (): Promise<JournalEntry[]> => {
  const response = await fetch("/api/journal/entries", {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    return [];
  }

  const payload = await response.json().catch(() => null);
  return parseEntriesResponse(payload);
};

export const appendJournalEntry = async (entry: {
  question: string;
  answer: string;
  type: JournalEntryType;
  createdAt?: string;
}): Promise<JournalEntry | null> => {
  const response = await fetch("/api/journal/entries", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(entry),
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json().catch(() => null)) as {
    entry?: JournalEntry;
  } | null;

  return payload?.entry ?? null;
};

export const updateJournalEntry = async (
  entryId: string,
  patch: Partial<Pick<JournalEntry, "question" | "answer" | "type">>,
) => {
  const response = await fetch(`/api/journal/entries/${entryId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(patch),
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json().catch(() => null)) as {
    entry?: JournalEntry;
  } | null;

  return payload?.entry ?? null;
};

export const deleteJournalEntry = async (entryId: string) => {
  const response = await fetch(`/api/journal/entries/${entryId}`, {
    method: "DELETE",
  });

  return response.ok;
};
