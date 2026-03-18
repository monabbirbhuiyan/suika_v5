export type JournalEntryType = "QUESTION" | "SOLVED";

export type JournalEntry = {
  id: string;
  createdAt: string;
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
const entriesKey = (userId: string) => `suika:journal:entries:${userId}`;

const persistEntries = (userId: string, entries: JournalEntry[]) => {
  const next = [...entries]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 250);

  localStorage.setItem(entriesKey(userId), JSON.stringify(next));
  return next;
};

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

export const readJournalEntries = (userId: string): JournalEntry[] => {
  try {
    const raw = localStorage.getItem(entriesKey(userId));
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as JournalEntry[];
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter((entry) => {
        return Boolean(
          entry?.id &&
          entry?.createdAt &&
          entry?.question &&
          entry?.answer &&
          entry?.type,
        );
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  } catch {
    return [];
  }
};

export const appendJournalEntry = (userId: string, entry: JournalEntry) => {
  const current = readJournalEntries(userId);
  return persistEntries(userId, [entry, ...current]);
};

export const updateJournalEntry = (
  userId: string,
  entryId: string,
  patch: Partial<Pick<JournalEntry, "question" | "answer" | "type">>,
) => {
  const current = readJournalEntries(userId);
  const updated = current.map((entry) => {
    if (entry.id !== entryId) {
      return entry;
    }

    return {
      ...entry,
      question: patch.question ?? entry.question,
      answer: patch.answer ?? entry.answer,
      type: patch.type ?? entry.type,
    };
  });

  return persistEntries(userId, updated);
};

export const deleteJournalEntry = (userId: string, entryId: string) => {
  const current = readJournalEntries(userId);
  const filtered = current.filter((entry) => entry.id !== entryId);
  return persistEntries(userId, filtered);
};
