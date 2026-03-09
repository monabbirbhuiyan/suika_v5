import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

const DEFAULT_CHAT_MODEL = process.env.GOOGLE_AI_MODEL ?? "gemini-2.5-flash";
const DEFAULT_QUOTE_MODEL =
  process.env.GOOGLE_AI_QUOTE_MODEL ?? "gemini-2.5-pro";
const DEFAULT_WEAVING_MODEL =
  process.env.GOOGLE_AI_WEAVING_MODEL ?? "gemini-2.5-flash";
const DEFAULT_RELATIONSHIP_MODEL =
  process.env.GOOGLE_AI_RELATIONSHIP_MODEL ?? "gemini-2.5-pro";

const MAX_RELATIONSHIP_EDGES = 8;
const QUOTE_MIN_RETRY_COOLDOWN_MS = 45_000;
const QUOTE_MAX_RETRY_COOLDOWN_MS = 10 * 60 * 1000;
const QUOTE_HARD_QUOTA_COOLDOWN_MS = 24 * 60 * 60 * 1000;

type QuoteCircuitState = {
  blockedUntil: number;
  lastLogAt: number;
};

const quoteCircuitState = (() => {
  const globalRef = globalThis as typeof globalThis & {
    __suikaQuoteCircuitState?: QuoteCircuitState;
  };

  if (!globalRef.__suikaQuoteCircuitState) {
    globalRef.__suikaQuoteCircuitState = {
      blockedUntil: 0,
      lastLogAt: 0,
    };
  }

  return globalRef.__suikaQuoteCircuitState;
})();

export type ChatRole = "system" | "user" | "assistant";

export type ChatMessage = {
  role: ChatRole;
  content: string;
};

export type GroqChatOptions = {
  messages: ChatMessage[];
  maxTokens?: number;
  temperature?: number;
  responseMimeType?: "application/json" | "text/plain";
};

export type WeavingSuggestionStrength = "STRONG" | "MEDIUM" | "GENTLE";
export type WeavingSuggestionKind = "MISSING_QUESTION" | "EVIDENCE_GAP";

type FragmentType =
  | "QUESTION"
  | "IDEA"
  | "OBSERVATION"
  | "CONSTRAINS"
  | "CONCLUSION";

export type WeavingSuggestionInput = {
  title: string;
  fragments: Array<{
    id: string;
    type: FragmentType;
    content: string;
  }>;
};

export type WeavingSuggestion = {
  fromTitle: string;
  toTitle: WeavingSuggestionKind;
  reason: string;
  strength: WeavingSuggestionStrength;
  focusFragmentId: string;
  recommendation: string;
  rationale: string;
};

export type ClarityConnectionInput = {
  nodeId: string;
  nodeTitle: string;
  fragments: Array<{
    id: string;
    type: FragmentType;
    content: string;
  }>;
};

export type ClarityConnectionSuggestion = {
  fromNodeId: string;
  toNodeId: string;
  fromFragmentId: string;
  toFragmentId: string;
  reason: string;
  strength: WeavingSuggestionStrength;
};

type ClarityRelationship = "CONTRADICTS" | "CLARIFIES" | "RESOLVES";

type RelationshipRecord = {
  source_id: string;
  target_id: string;
  relationship: ClarityRelationship;
  rationale: string;
};

export const suikaFallbackQuotes = [
  "Small steps compound into meaningful clarity.",
  "Progress starts when thoughts get externalized.",
  "Confusion is often the first sign of real understanding.",
  "Clarity grows where curiosity stays consistent.",
  "A better decision starts with a better question.",
  "Momentum beats perfection, every single time.",
];

const relationshipSchema = {
  type: SchemaType.ARRAY,
  description: "Strong logical relationships between fragments.",
  items: {
    type: SchemaType.OBJECT,
    properties: {
      source_id: { type: SchemaType.STRING },
      target_id: { type: SchemaType.STRING },
      relationship: {
        type: SchemaType.STRING,
        enum: ["CONTRADICTS", "CLARIFIES", "RESOLVES"],
      },
      rationale: { type: SchemaType.STRING },
    },
    required: ["source_id", "target_id", "relationship", "rationale"],
  },
} as const;

const weavingSchema = {
  type: SchemaType.ARRAY,
  description: "Diagnostic weaving suggestions.",
  items: {
    type: SchemaType.OBJECT,
    properties: {
      kind: {
        type: SchemaType.STRING,
        enum: ["MISSING_QUESTION", "EVIDENCE_GAP"],
      },
      nodeTitle: { type: SchemaType.STRING },
      focusFragmentId: { type: SchemaType.STRING },
      reason: { type: SchemaType.STRING },
      recommendation: { type: SchemaType.STRING },
      rationale: { type: SchemaType.STRING },
      strength: {
        type: SchemaType.STRING,
        enum: ["STRONG", "MEDIUM", "GENTLE"],
      },
    },
    required: [
      "kind",
      "nodeTitle",
      "focusFragmentId",
      "reason",
      "recommendation",
      "rationale",
      "strength",
    ],
  },
} as const;

const getGemini = () => {
  const readApiKey = () => {
    return (
      process.env.GEMINI_API_KEY ??
      process.env.GOOGLE_AI_API_KEY ??
      process.env.GOOGLE_GENERATIVE_AI_API_KEY ??
      process.env.GOOGLE_API_KEY
    )?.trim();
  };

  let apiKey = readApiKey();

  if (!apiKey) {
    // Some runtimes do not eagerly load .env for ad-hoc server execution.
    const dotenv = require("dotenv") as typeof import("dotenv");
    dotenv.config({ path: ".env.local", override: false });
    dotenv.config({ path: ".env", override: false });
    apiKey = readApiKey();
  }

  if (!apiKey) {
    throw new Error(
      "Missing Gemini API key. Set GEMINI_API_KEY, GOOGLE_AI_API_KEY, GOOGLE_GENERATIVE_AI_API_KEY, or GOOGLE_API_KEY.",
    );
  }

  return new GoogleGenerativeAI(apiKey);
};

const extractJsonArray = (text: string): unknown[] | null => {
  const trimmed = text.trim();

  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch {
    // SDK should honor response schema, this is a small recovery path.
  }

  const start = trimmed.indexOf("[");
  const end = trimmed.lastIndexOf("]");

  if (start < 0 || end < 0 || end <= start) {
    return null;
  }

  try {
    const parsed = JSON.parse(trimmed.slice(start, end + 1));
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

const randomFallbackQuote = () => {
  const index = Math.floor(Math.random() * suikaFallbackQuotes.length);
  return suikaFallbackQuotes[index];
};

const normalizeQuoteText = (value: string) => {
  return value
    .replaceAll("\n", " ")
    .replace(/^['"`\s]+|['"`\s]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
};

const isUsefulQuote = (quote: string) => {
  if (quote.length < 24 || quote.length > 220) {
    return false;
  }

  const words = quote.split(/\s+/).filter(Boolean);
  if (words.length < 6) {
    return false;
  }

  const lettersOnly = quote.replace(/[^a-zA-Z]/g, "");
  return lettersOnly.length >= 18;
};

const isQuotaExceededError = (error: unknown): boolean => {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "";

  const lower = message.toLowerCase();
  return (
    lower.includes("429") ||
    lower.includes("quota exceeded") ||
    lower.includes("too many requests")
  );
};

const isModelNotFoundError = (error: unknown): boolean => {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "";

  const lower = message.toLowerCase();
  return (
    lower.includes("404") &&
    (lower.includes("not found") ||
      lower.includes("not supported for generatecontent"))
  );
};

const extractRetryDelayMs = (message: string): number | null => {
  const retryInSeconds = /retry in\s+([\d.]+)s/i.exec(message);
  if (retryInSeconds?.[1]) {
    return Math.round(Number(retryInSeconds[1]) * 1000);
  }

  const retryDelayField = /"retryDelay":"(\d+)s"/i.exec(message);
  if (retryDelayField?.[1]) {
    return Number(retryDelayField[1]) * 1000;
  }

  return null;
};

const isHardQuotaZeroError = (error: unknown): boolean => {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "";

  return /limit:\s*0/i.test(message);
};

const compactErrorMessage = (message: string) => {
  return message.split("\n")[0]?.trim() || message;
};

const normalizeStrength = (value: string): WeavingSuggestionStrength => {
  if (value === "STRONG" || value === "MEDIUM" || value === "GENTLE") {
    return value;
  }

  const lower = value.toLowerCase();

  if (lower.includes("strong") || lower.includes("high")) {
    return "STRONG";
  }

  if (lower.includes("gentle") || lower.includes("low")) {
    return "GENTLE";
  }

  return "MEDIUM";
};

const relationStrength = (
  relationship: ClarityRelationship,
): WeavingSuggestionStrength => {
  if (relationship === "CONTRADICTS" || relationship === "RESOLVES") {
    return "STRONG";
  }

  return "MEDIUM";
};

const RELATIONSHIP_STOPWORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "by",
  "for",
  "from",
  "if",
  "in",
  "into",
  "is",
  "it",
  "of",
  "on",
  "or",
  "that",
  "the",
  "this",
  "to",
  "we",
  "with",
]);

const tokenizeForRelationship = (text: string): string[] => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 3 && !RELATIONSHIP_STOPWORDS.has(token));
};

const tokenOverlapScore = (left: string, right: string): number => {
  const leftTokens = new Set(tokenizeForRelationship(left));
  const rightTokens = new Set(tokenizeForRelationship(right));

  if (leftTokens.size === 0 || rightTokens.size === 0) {
    return 0;
  }

  let overlap = 0;
  for (const token of leftTokens) {
    if (rightTokens.has(token)) {
      overlap += 1;
    }
  }

  return overlap / Math.max(leftTokens.size, rightTokens.size);
};

const classifyFallbackRelationship = (
  fromType: FragmentType,
  toType: FragmentType,
  fromContent: string,
  toContent: string,
): {
  relationship: ClarityRelationship;
  rationale: string;
  score: number;
} | null => {
  const overlap = tokenOverlapScore(fromContent, toContent);
  const fromText = fromContent.toLowerCase();
  const toText = toContent.toLowerCase();

  const hasBlockingLanguage =
    /\b(cannot|can't|must not|forbid|forbidden|ban|blocked|impossible|illegal|risk)\b/.test(
      fromText,
    );

  const hasDecisionLanguage =
    /\b(therefore|so we should|we should|final|decide|decision|conclusion|pivot|choose|must)\b/.test(
      fromText,
    );

  if (
    fromType === "CONSTRAINS" &&
    (toType === "IDEA" || toType === "CONCLUSION")
  ) {
    return {
      relationship: "CONTRADICTS",
      rationale: "Constraint language blocks the proposed direction.",
      score: 0.92 + overlap,
    };
  }

  if (
    fromType === "OBSERVATION" &&
    (toType === "IDEA" || toType === "CONCLUSION")
  ) {
    if (hasBlockingLanguage) {
      return {
        relationship: "CONTRADICTS",
        rationale: "Observed evidence invalidates the proposed claim.",
        score: 0.82 + overlap,
      };
    }

    return {
      relationship: "CLARIFIES",
      rationale: "Observed evidence provides context for the claim.",
      score: 0.68 + overlap,
    };
  }

  if (fromType === "CONCLUSION" && toType === "QUESTION") {
    return {
      relationship: "RESOLVES",
      rationale: "Conclusion directly answers the unresolved question.",
      score: 0.9 + overlap,
    };
  }

  if (fromType === "CONCLUSION" && toType === "IDEA" && hasDecisionLanguage) {
    return {
      relationship: "RESOLVES",
      rationale: "Decision-level statement finalizes the tentative idea.",
      score: 0.8 + overlap,
    };
  }

  if (
    fromType === "OBSERVATION" &&
    (toType === "QUESTION" || toType === "CONSTRAINS")
  ) {
    return {
      relationship: "CLARIFIES",
      rationale: "Observation supplies grounding context.",
      score: 0.56 + overlap,
    };
  }

  if (overlap >= 0.5 && hasBlockingLanguage) {
    return {
      relationship: "CONTRADICTS",
      rationale: "Blocking language conflicts with overlapping claim terms.",
      score: 0.74 + overlap,
    };
  }

  if (
    overlap >= 0.52 &&
    (fromType === "CONCLUSION" || fromType === "OBSERVATION")
  ) {
    return {
      relationship: "CLARIFIES",
      rationale: "High lexical overlap suggests explanatory linkage.",
      score: 0.54 + overlap,
    };
  }

  return null;
};

const targetRelationshipEdgeCount = (nodeCount: number): number => {
  return Math.max(
    4,
    Math.min(MAX_RELATIONSHIP_EDGES, Math.ceil(nodeCount * 1.7)),
  );
};

const selectHighSignalEdges = <T extends ClarityConnectionSuggestion>(
  candidates: T[],
  allNodeIds: string[],
  maxEdges: number,
): T[] => {
  if (candidates.length === 0) {
    return [];
  }

  const selected: T[] = [];
  const coveredNodeIds = new Set<string>();
  const outgoingByFragment = new Map<string, number>();
  const incomingByFragment = new Map<string, number>();
  const perNodePairCount = new Map<string, number>();

  const canUse = (edge: T) => {
    const outCount = outgoingByFragment.get(edge.fromFragmentId) ?? 0;
    const inCount = incomingByFragment.get(edge.toFragmentId) ?? 0;
    const pairKey = `${edge.fromNodeId}::${edge.toNodeId}`;
    const pairCount = perNodePairCount.get(pairKey) ?? 0;

    return outCount < 2 && inCount < 2 && pairCount < 2;
  };

  const applyEdge = (edge: T) => {
    selected.push(edge);
    coveredNodeIds.add(edge.fromNodeId);
    coveredNodeIds.add(edge.toNodeId);
    outgoingByFragment.set(
      edge.fromFragmentId,
      (outgoingByFragment.get(edge.fromFragmentId) ?? 0) + 1,
    );
    incomingByFragment.set(
      edge.toFragmentId,
      (incomingByFragment.get(edge.toFragmentId) ?? 0) + 1,
    );
    const pairKey = `${edge.fromNodeId}::${edge.toNodeId}`;
    perNodePairCount.set(pairKey, (perNodePairCount.get(pairKey) ?? 0) + 1);
  };

  for (const edge of candidates) {
    if (selected.length >= maxEdges) {
      break;
    }

    const improvesCoverage =
      !coveredNodeIds.has(edge.fromNodeId) ||
      !coveredNodeIds.has(edge.toNodeId);

    if (!improvesCoverage || !canUse(edge)) {
      continue;
    }

    applyEdge(edge);

    if (coveredNodeIds.size >= allNodeIds.length) {
      break;
    }
  }

  for (const edge of candidates) {
    if (selected.length >= maxEdges) {
      break;
    }

    const key = `${edge.fromFragmentId}::${edge.toFragmentId}`;
    const exists = selected.some(
      (item) => `${item.fromFragmentId}::${item.toFragmentId}` === key,
    );

    if (exists || !canUse(edge)) {
      continue;
    }

    applyEdge(edge);
  }

  return selected;
};

const fallbackWeavingSuggestions = (
  inputs: WeavingSuggestionInput[],
): WeavingSuggestion[] => {
  return inputs
    .flatMap((item) => {
      const first = item.fragments[0];
      if (!first) {
        return [];
      }

      const hasQuestion = item.fragments.some((f) => f.type === "QUESTION");
      const hasConclusionOrIdea = item.fragments.some(
        (f) => f.type === "CONCLUSION" || f.type === "IDEA",
      );
      const hasObservation = item.fragments.some(
        (f) => f.type === "OBSERVATION",
      );

      const suggestions: WeavingSuggestion[] = [];

      if (!hasQuestion) {
        suggestions.push({
          fromTitle: item.title,
          toTitle: "MISSING_QUESTION",
          reason:
            "This node has ideas/observations but no explicit guiding question.",
          strength: "MEDIUM",
          focusFragmentId: first.id,
          recommendation:
            "What is the main uncertainty this node is trying to resolve?",
          rationale:
            "A clear question helps evaluate future decisions and evidence.",
        });
      }

      if (hasConclusionOrIdea && !hasObservation) {
        suggestions.push({
          fromTitle: item.title,
          toTitle: "EVIDENCE_GAP",
          reason: "This node has claims but lacks concrete evidence.",
          strength: "STRONG",
          focusFragmentId: first.id,
          recommendation:
            "Add one concrete observation, data point, or example supporting this claim.",
          rationale:
            "Evidence reduces premature certainty and improves reliability.",
        });
      }

      return suggestions;
    })
    .slice(0, 8);
};

const fallbackClarityConnections = (
  input: ClarityConnectionInput[],
): ClarityConnectionSuggestion[] => {
  const scored: Array<ClarityConnectionSuggestion & { score: number }> = [];
  const nodeIds = input.map((node) => node.nodeId);

  for (const fromNode of input) {
    for (const toNode of input) {
      for (const from of fromNode.fragments) {
        for (const to of toNode.fragments) {
          if (from.id === to.id) {
            continue;
          }

          const classified = classifyFallbackRelationship(
            from.type,
            to.type,
            from.content,
            to.content,
          );

          if (!classified) {
            continue;
          }

          const sameNodePenalty = fromNode.nodeId === toNode.nodeId ? 0.16 : 0;
          const score = classified.score - sameNodePenalty;

          if (score < 0.72) {
            continue;
          }

          scored.push({
            fromNodeId: fromNode.nodeId,
            toNodeId: toNode.nodeId,
            fromFragmentId: from.id,
            toFragmentId: to.id,
            reason: `${classified.relationship}: ${classified.rationale}`,
            strength: relationStrength(classified.relationship),
            score,
          });
        }
      }
    }
  }

  const deduped = Array.from(
    new Map(
      scored.map((item) => [
        `${item.fromFragmentId}::${item.toFragmentId}`,
        item,
      ]),
    ).values(),
  );

  deduped.sort((a, b) => {
    const rank = { STRONG: 3, MEDIUM: 2, GENTLE: 1 } as const;
    const byStrength = rank[b.strength] - rank[a.strength];

    if (byStrength !== 0) {
      return byStrength;
    }

    return b.score - a.score;
  });

  const selected = selectHighSignalEdges(
    deduped,
    nodeIds,
    targetRelationshipEdgeCount(nodeIds.length),
  );

  return selected.map(({ score: _score, ...edge }) => edge);
};

export const chatWithGemini = async ({
  messages,
  maxTokens = 512,
  temperature = 0.7,
}: GroqChatOptions) => {
  const systemInstruction = messages
    .filter((m) => m.role === "system")
    .map((m) => m.content.trim())
    .filter(Boolean)
    .join("\n\n");

  const contents = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

  if (contents.length === 0) {
    throw new Error("At least one user or assistant message is required.");
  }

  const model = getGemini().getGenerativeModel({
    model: DEFAULT_CHAT_MODEL,
    ...(systemInstruction ? { systemInstruction } : {}),
    generationConfig: {
      temperature,
      maxOutputTokens: maxTokens,
    },
  });

  const result = await model.generateContent({ contents });
  const text = result.response.text().trim();

  if (!text) {
    throw new Error("No assistant response returned by Gemini.");
  }

  return text;
};

// Backward-compatible export name.
export const chatWithGroq = async (options: GroqChatOptions) => {
  return chatWithGemini(options);
};

export const generateSuikaMotivationalQuote = async () => {
  const now = Date.now();

  if (now < quoteCircuitState.blockedUntil) {
    const shouldLog =
      process.env.NODE_ENV !== "production" &&
      now - quoteCircuitState.lastLogAt > 30_000;

    if (shouldLog) {
      const secondsLeft = Math.ceil(
        (quoteCircuitState.blockedUntil - now) / 1000,
      );
      console.warn(
        `[AI_QUOTE_FALLBACK] quota cooldown active (${secondsLeft}s left)`,
      );
      quoteCircuitState.lastLogAt = now;
    }

    return { quote: randomFallbackQuote(), source: "fallback" as const };
  }

  let lastError: Error | null = null;

  try {
    const gemini = getGemini();

    const candidateModels = Array.from(
      new Set([
        DEFAULT_QUOTE_MODEL,
        "gemini-2.5-flash",
        "gemini-2.5-flash-lite",
      ]),
    );

    for (const modelName of candidateModels) {
      const model = gemini.getGenerativeModel({
        model: modelName,
        generationConfig: {
          temperature: 0.85,
          maxOutputTokens: 96,
          responseMimeType: "application/json",
        },
        systemInstruction:
          "You write one-line motivational quotes for Suika. Return ONLY a valid JSON object with a single key 'quote'. Do not use markdown.",
      });

      for (let attempt = 0; attempt < 2; attempt += 1) {
        try {
          const result = await model.generateContent(
            "Generate one motivational quote about finding clarity through messy thinking.",
          );

          let rawText = result.response.text().trim();

          if (rawText.startsWith("```")) {
            rawText = rawText
              .replace(/^```(json)?\n?/, "")
              .replace(/```$/, "")
              .trim();
          }

          const parsed = JSON.parse(rawText);

          if (parsed.quote) {
            const quote = normalizeQuoteText(parsed.quote);

            if (isUsefulQuote(quote)) {
              return { quote, source: "ai" as const };
            }
          }
        } catch (e) {
          lastError =
            e instanceof Error ? e : new Error("Parse/Validation failed");

          if (isQuotaExceededError(lastError)) {
            const parsedDelay = extractRetryDelayMs(lastError.message);
            const retryDelayMs = isHardQuotaZeroError(lastError)
              ? QUOTE_HARD_QUOTA_COOLDOWN_MS
              : Math.min(
                  QUOTE_MAX_RETRY_COOLDOWN_MS,
                  Math.max(QUOTE_MIN_RETRY_COOLDOWN_MS, parsedDelay ?? 60_000),
                );

            quoteCircuitState.blockedUntil = Date.now() + retryDelayMs;
            break;
          }

          if (isModelNotFoundError(lastError)) {
            break;
          }
        }
      }

      if (Date.now() < quoteCircuitState.blockedUntil) {
        break;
      }
    }

    if (process.env.NODE_ENV !== "production") {
      const details = compactErrorMessage(
        lastError?.message ?? "No valid quote returned by model",
      );
      console.warn(`[AI_QUOTE_FALLBACK] ${details}`);
      quoteCircuitState.lastLogAt = Date.now();
    }

    return { quote: randomFallbackQuote(), source: "fallback" as const };
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      const message =
        error instanceof Error
          ? error.message
          : "Unknown quote generation error";
      console.warn(`[AI_QUOTE_FALLBACK] ${compactErrorMessage(message)}`);
      quoteCircuitState.lastLogAt = Date.now();
    }

    return { quote: randomFallbackQuote(), source: "fallback" as const };
  }
};

export const generateSuikaWeavingSuggestions = async (
  inputs: WeavingSuggestionInput[],
): Promise<WeavingSuggestion[]> => {
  if (inputs.length === 0) {
    return [];
  }

  try {
    const model = getGemini().getGenerativeModel({
      model: DEFAULT_WEAVING_MODEL,
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: weavingSchema as any,
        temperature: 0.2,
        maxOutputTokens: 2048,
      },
      systemInstruction:
        "You are Suika AI Weaving focused on diagnostics. Return only a JSON array following the schema. Use only node titles and fragment ids from input.",
    });

    const result = await model.generateContent(
      `Analyze nodes and generate up to 8 suggestions:\n${JSON.stringify(inputs, null, 2)}`,
    );

    const parsed = extractJsonArray(result.response.text());

    if (!parsed) {
      return fallbackWeavingSuggestions(inputs);
    }

    const nodeByTitle = new Map(
      inputs.map((item) => [item.title.trim().toLowerCase(), item]),
    );

    const normalized = parsed
      .map((entry) => {
        if (!entry || typeof entry !== "object") {
          return null;
        }

        const record = entry as {
          kind?: unknown;
          nodeTitle?: unknown;
          focusFragmentId?: unknown;
          reason?: unknown;
          recommendation?: unknown;
          rationale?: unknown;
          strength?: unknown;
        };

        if (
          (record.kind !== "MISSING_QUESTION" &&
            record.kind !== "EVIDENCE_GAP") ||
          typeof record.nodeTitle !== "string" ||
          typeof record.focusFragmentId !== "string" ||
          typeof record.reason !== "string" ||
          typeof record.recommendation !== "string" ||
          typeof record.rationale !== "string"
        ) {
          return null;
        }

        return {
          fromTitle: record.nodeTitle.trim(),
          toTitle: record.kind,
          reason: record.reason.trim().slice(0, 180),
          strength: normalizeStrength(String(record.strength ?? "MEDIUM")),
          focusFragmentId: record.focusFragmentId.trim(),
          recommendation: record.recommendation.trim().slice(0, 220),
          rationale: record.rationale.trim().slice(0, 180),
        } satisfies WeavingSuggestion;
      })
      .filter((item): item is WeavingSuggestion => {
        if (!item) {
          return false;
        }

        const node = nodeByTitle.get(item.fromTitle.toLowerCase());
        if (!node) {
          return false;
        }

        return node.fragments.some(
          (fragment) => fragment.id === item.focusFragmentId,
        );
      });

    if (normalized.length === 0) {
      return fallbackWeavingSuggestions(inputs);
    }

    const deduped = Array.from(
      new Map(
        normalized.map((item) => [
          `${item.fromTitle.toLowerCase()}::${item.toTitle}::${item.recommendation.toLowerCase()}`,
          item,
        ]),
      ).values(),
    );

    return deduped.slice(0, 8);
  } catch {
    return fallbackWeavingSuggestions(inputs);
  }
};

export const analyzeFragmentRelationships = async (
  fragments: Array<{
    id: string;
    type: FragmentType;
    content: string;
  }>,
): Promise<RelationshipRecord[]> => {
  if (fragments.length < 2) {
    return [];
  }

  const model = getGemini().getGenerativeModel({
    model: DEFAULT_RELATIONSHIP_MODEL,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: relationshipSchema as any,
      temperature: 0.1,
      maxOutputTokens: 4096,
    },
    systemInstruction: `You are the analytical reasoning engine for Suika.
Analyze provided fragments and map strong logical relationships.
Relationship definitions:
- CONTRADICTS: source blocks or invalidates target.
- CLARIFIES: source provides evidence/context for target.
- RESOLVES: source answer/decision resolves target uncertainty.
Rules:
- No weak links.
- Never self-link.
- source_id and target_id must exactly match input IDs.
- Prefer sparse, high-signal relationships.`,
  });

  const result = await model.generateContent(
    `Analyze fragments and return relationships:\n${JSON.stringify(fragments, null, 2)}`,
  );

  const parsed = extractJsonArray(result.response.text());

  if (!parsed) {
    return [];
  }

  return parsed
    .map((entry) => {
      if (!entry || typeof entry !== "object") {
        return null;
      }

      const record = entry as {
        source_id?: unknown;
        target_id?: unknown;
        relationship?: unknown;
        rationale?: unknown;
      };

      if (
        typeof record.source_id !== "string" ||
        typeof record.target_id !== "string" ||
        typeof record.relationship !== "string" ||
        typeof record.rationale !== "string"
      ) {
        return null;
      }

      const relationship = record.relationship.trim().toUpperCase();

      if (
        relationship !== "CONTRADICTS" &&
        relationship !== "CLARIFIES" &&
        relationship !== "RESOLVES"
      ) {
        return null;
      }

      return {
        source_id: record.source_id.trim(),
        target_id: record.target_id.trim(),
        relationship,
        rationale: record.rationale.trim(),
      } satisfies RelationshipRecord;
    })
    .filter((item): item is RelationshipRecord => Boolean(item));
};

export const generateClarityGraphConnections = async (
  input: ClarityConnectionInput[],
): Promise<ClarityConnectionSuggestion[]> => {
  if (input.length < 2) {
    return [];
  }

  const flatFragments = input.flatMap((node) =>
    node.fragments.map((fragment) => ({
      id: fragment.id,
      node_id: node.nodeId,
      type: fragment.type,
      content: fragment.content,
    })),
  );

  const fragmentToNodeId = new Map(flatFragments.map((f) => [f.id, f.node_id]));

  const nodeIds = input.map((node) => node.nodeId);
  const maxEdges = targetRelationshipEdgeCount(nodeIds.length);

  try {
    const records = await analyzeFragmentRelationships(
      flatFragments.map((fragment) => ({
        id: fragment.id,
        type: fragment.type,
        content: fragment.content,
      })),
    );

    if (records.length === 0) {
      return fallbackClarityConnections(input);
    }

    const mapped = records
      .map((record) => {
        const fromNodeId = fragmentToNodeId.get(record.source_id);
        const toNodeId = fragmentToNodeId.get(record.target_id);

        if (!fromNodeId || !toNodeId || record.source_id === record.target_id) {
          return null;
        }

        return {
          fromNodeId,
          toNodeId,
          fromFragmentId: record.source_id,
          toFragmentId: record.target_id,
          reason: `${record.relationship}: ${record.rationale.replace(/\s+/g, " ").slice(0, 320)}`,
          strength: relationStrength(record.relationship),
        } satisfies ClarityConnectionSuggestion;
      })
      .filter((item): item is ClarityConnectionSuggestion => Boolean(item));

    const deduped = Array.from(
      new Map(
        mapped.map((item) => [
          `${item.fromFragmentId}::${item.toFragmentId}`,
          item,
        ]),
      ).values(),
    );

    deduped.sort((a, b) => {
      const strength = { STRONG: 3, MEDIUM: 2, GENTLE: 1 } as const;
      const byStrength = strength[b.strength] - strength[a.strength];

      if (byStrength !== 0) {
        return byStrength;
      }

      const relationScore = (reason: string) => {
        if (reason.startsWith("RESOLVES")) {
          return 3;
        }
        if (reason.startsWith("CONTRADICTS")) {
          return 2;
        }
        return 1;
      };

      return relationScore(b.reason) - relationScore(a.reason);
    });

    const selected = selectHighSignalEdges(deduped, nodeIds, maxEdges);

    return selected.length > 0 ? selected : fallbackClarityConnections(input);
  } catch {
    return fallbackClarityConnections(input);
  }
};
