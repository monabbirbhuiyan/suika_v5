import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import OpenAI from "openai";

const ACTIVE_AI_PROVIDER = (process.env.AI_PROVIDER ?? "nvidia").toLowerCase();
const IS_LOCAL_PROVIDER = ACTIVE_AI_PROVIDER === "local";
const IS_GEMINI_PROVIDER = ACTIVE_AI_PROVIDER === "gemini";

const DEFAULT_CHAT_MODEL = process.env.GOOGLE_AI_MODEL ?? "gemini-2.5-flash";
const DEFAULT_QUOTE_MODEL =
  process.env.GOOGLE_AI_QUOTE_MODEL ?? "gemini-2.5-pro";
const DEFAULT_WEAVING_MODEL =
  process.env.GOOGLE_AI_WEAVING_MODEL ?? "gemini-2.5-flash";
const DEFAULT_RELATIONSHIP_MODEL =
  process.env.GOOGLE_AI_RELATIONSHIP_MODEL ?? "gemini-2.5-pro";
const DEFAULT_CONCLUSION_MODEL =
  process.env.GOOGLE_AI_CONCLUSION_MODEL ?? "gemini-2.5-flash";
const DEFAULT_NVIDIA_MODEL =
  process.env.NVIDIA_AI_MODEL ?? "meta/llama-3.1-8b-instruct";
const DEFAULT_NVIDIA_CHAT_MODEL =
  process.env.NVIDIA_AI_CHAT_MODEL ?? DEFAULT_NVIDIA_MODEL;
const DEFAULT_NVIDIA_WEAVING_MODEL =
  process.env.NVIDIA_AI_WEAVING_MODEL ?? DEFAULT_NVIDIA_CHAT_MODEL;
const DEFAULT_NVIDIA_RELATIONSHIP_MODEL =
  process.env.NVIDIA_AI_RELATIONSHIP_MODEL ?? DEFAULT_NVIDIA_CHAT_MODEL;
const DEFAULT_NVIDIA_CONCLUSION_MODEL =
  process.env.NVIDIA_AI_CONCLUSION_MODEL ?? DEFAULT_NVIDIA_CHAT_MODEL;
const NVIDIA_THINKING_MODE =
  (process.env.NVIDIA_AI_THINKING ?? "false").toLowerCase() === "true";
const DEFAULT_LOCAL_BASE_URL =
  process.env.LOCAL_AI_BASE_URL ?? "http://127.0.0.1:8000/v1";
const DEFAULT_LOCAL_API_KEY = process.env.LOCAL_AI_API_KEY ?? "local-dev";
const DEFAULT_LOCAL_MODEL =
  process.env.LOCAL_AI_MODEL ?? "artifacts/legal-cpt-3050ti";
const DEFAULT_LOCAL_CHAT_MODEL =
  process.env.LOCAL_AI_CHAT_MODEL ?? DEFAULT_LOCAL_MODEL;
const DEFAULT_LOCAL_WEAVING_MODEL =
  process.env.LOCAL_AI_WEAVING_MODEL ?? DEFAULT_LOCAL_CHAT_MODEL;
const DEFAULT_LOCAL_RELATIONSHIP_MODEL =
  process.env.LOCAL_AI_RELATIONSHIP_MODEL ?? DEFAULT_LOCAL_CHAT_MODEL;
const DEFAULT_LOCAL_CONCLUSION_MODEL =
  process.env.LOCAL_AI_CONCLUSION_MODEL ?? DEFAULT_LOCAL_CHAT_MODEL;

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

export type ProblemSpaceConclusion = {
  conclusion: string;
  why: string;
  description: string;
  suggestions: string[];
  advice: string[];
  confidence: "HIGH" | "MEDIUM" | "LOW";
  basedOnQuestionCount: number;
  totalQuestionCount: number;
};

const CLARITY_FRAGMENT_TYPES: FragmentType[] = [
  "QUESTION",
  "IDEA",
  "OBSERVATION",
  "CONSTRAINS",
  "CONCLUSION",
];

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

const shouldUseNvidia = () => !IS_GEMINI_PROVIDER && !IS_LOCAL_PROVIDER;

const getOpenAiCompatibleBaseUrl = () => {
  return IS_LOCAL_PROVIDER
    ? DEFAULT_LOCAL_BASE_URL
    : "https://integrate.api.nvidia.com/v1";
};

const getActiveChatModel = () => {
  return IS_LOCAL_PROVIDER
    ? DEFAULT_LOCAL_CHAT_MODEL
    : DEFAULT_NVIDIA_CHAT_MODEL;
};

const getActiveWeavingModel = () => {
  return IS_LOCAL_PROVIDER
    ? DEFAULT_LOCAL_WEAVING_MODEL
    : DEFAULT_NVIDIA_WEAVING_MODEL;
};

const getActiveRelationshipModel = () => {
  return IS_LOCAL_PROVIDER
    ? DEFAULT_LOCAL_RELATIONSHIP_MODEL
    : DEFAULT_NVIDIA_RELATIONSHIP_MODEL;
};

const getActiveConclusionModel = () => {
  return IS_LOCAL_PROVIDER
    ? DEFAULT_LOCAL_CONCLUSION_MODEL
    : DEFAULT_NVIDIA_CONCLUSION_MODEL;
};

const logActiveAiProvider = () => {
  const globalRef = globalThis as typeof globalThis & {
    __suikaAiProviderLogged?: boolean;
  };

  if (globalRef.__suikaAiProviderLogged) {
    return;
  }

  const provider = IS_LOCAL_PROVIDER
    ? "local"
    : shouldUseNvidia()
      ? "nvidia"
      : "gemini";
  console.log(`[AI_PROVIDER] active=${provider}`);
  globalRef.__suikaAiProviderLogged = true;
};

logActiveAiProvider();

const getNvidiaClient = () => {
  return new OpenAI({
    apiKey: getNvidiaApiKey(),
    baseURL: getOpenAiCompatibleBaseUrl(),
  });
};

const getNvidiaApiKey = () => {
  if (IS_LOCAL_PROVIDER) {
    return DEFAULT_LOCAL_API_KEY;
  }

  const readApiKey = () => {
    return (process.env.NVIDIA_API_KEY ?? process.env.NV_API_KEY)?.trim();
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
      "Missing Nvidia API key. Set NVIDIA_API_KEY or NV_API_KEY.",
    );
  }

  return apiKey;
};

type NvidiaMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type NvidiaChatCompletionOptions = {
  messages: NvidiaMessage[];
  maxTokens: number;
  temperature: number;
  model?: string;
};

const extractNvidiaSdkText = (content: unknown): string => {
  if (typeof content === "string") {
    return content.trim();
  }

  if (!Array.isArray(content)) {
    return "";
  }

  return content
    .map((part) => {
      if (!part || typeof part !== "object") {
        return "";
      }

      const maybeText = (part as { text?: unknown }).text;
      return typeof maybeText === "string" ? maybeText : "";
    })
    .filter(Boolean)
    .join("\n")
    .trim();
};

const nvidiaChatCompletion = async ({
  messages,
  maxTokens,
  temperature,
  model = DEFAULT_NVIDIA_MODEL,
}: NvidiaChatCompletionOptions): Promise<string> => {
  const requestCompletion = async (thinking: boolean) => {
    const completion = await getNvidiaClient().chat.completions.create({
      model,
      messages,
      temperature,
      top_p: 0.95,
      max_tokens: maxTokens,
      stream: false,
      ...(thinking && !IS_LOCAL_PROVIDER
        ? { chat_template_kwargs: { thinking: true } }
        : {}),
    } as any);

    const content = completion.choices?.[0]?.message?.content;
    return extractNvidiaSdkText(content);
  };

  const first = await requestCompletion(
    NVIDIA_THINKING_MODE && !IS_LOCAL_PROVIDER,
  );
  if (first) {
    return first;
  }

  if (NVIDIA_THINKING_MODE) {
    const second = await requestCompletion(false);
    if (second) {
      return second;
    }
  }

  throw new Error("No assistant response returned by Nvidia model.");
};

const chatWithNvidia = async ({
  messages,
  maxTokens = 512,
  temperature = 0.7,
}: GroqChatOptions) => {
  const nvidiaMessages: NvidiaMessage[] = messages.filter(
    (message) => message.content.trim().length > 0,
  );

  if (nvidiaMessages.length === 0) {
    throw new Error("At least one user or assistant message is required.");
  }

  return nvidiaChatCompletion({
    messages: nvidiaMessages,
    maxTokens,
    temperature,
    model: getActiveChatModel(),
  });
};

const generateSuikaMotivationalQuoteWithNvidia = async (): Promise<{
  quote: string;
  source: "ai";
}> => {
  const prompt =
    "You write one-line motivational quotes for Suika. Return exactly one plain-text sentence only. No markdown, no labels, no list.";

  const raw = await nvidiaChatCompletion({
    messages: [
      { role: "system", content: prompt },
      {
        role: "user",
        content:
          "Generate one motivational quote about finding clarity through messy thinking.",
      },
    ],
    maxTokens: 96,
    temperature: 0.85,
    model: getActiveChatModel(),
  });

  const candidate = extractQuoteCandidate(raw);

  if (!candidate || !isUsefulQuote(candidate)) {
    throw new Error("Nvidia model returned an unusable quote.");
  }

  return { quote: candidate as string, source: "ai" as const };
};

const generateSuikaWeavingSuggestionsWithNvidia = async (
  inputs: WeavingSuggestionInput[],
): Promise<WeavingSuggestion[]> => {
  const systemInstruction =
    "You are Suika AI Weaving focused on diagnostics. Return only a JSON array. Use only node titles and fragment ids from input.";

  const text = await nvidiaChatCompletion({
    messages: [
      { role: "system", content: systemInstruction },
      {
        role: "user",
        content: `Analyze nodes and generate up to 8 suggestions:\n${JSON.stringify(inputs, null, 2)}\n\nReturn JSON array entries with keys: kind, nodeTitle, focusFragmentId, reason, recommendation, rationale, strength.`,
      },
    ],
    maxTokens: 2048,
    temperature: 0.2,
    model: getActiveWeavingModel(),
  });

  const parsed = extractJsonArray(text);

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
};

const analyzeFragmentRelationshipsWithNvidia = async (
  fragments: Array<{
    id: string;
    type: FragmentType;
    content: string;
  }>,
): Promise<RelationshipRecord[]> => {
  const systemInstruction = `You are the analytical reasoning engine for Suika.
Analyze provided fragments and map strong logical relationships.
Relationship definitions:
- CONTRADICTS: source blocks or invalidates target.
- CLARIFIES: source provides evidence/context for target.
- RESOLVES: source answer/decision resolves target uncertainty.
Rules:
- No weak links.
- Never self-link.
- source_id and target_id must exactly match input IDs.
- Prefer sparse, high-signal relationships.
- rationale must be a clear 2-4 sentence explanation in plain English.
- rationale should explain what in the source supports/challenges/answers the target and why that matters for decision quality.
Return only JSON array objects with keys: source_id, target_id, relationship, rationale.`;

  const text = await nvidiaChatCompletion({
    messages: [
      { role: "system", content: systemInstruction },
      {
        role: "user",
        content: `Analyze fragments and return relationships:\n${JSON.stringify(fragments, null, 2)}`,
      },
    ],
    maxTokens: 4096,
    temperature: 0,
    model: getActiveRelationshipModel(),
  });

  const parsed = extractJsonArray(text);

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

const generateProblemSpaceConclusionWithNvidia = async (
  input: ClarityConnectionInput[],
): Promise<ProblemSpaceConclusion> => {
  const payload = input
    .map((node) => ({
      nodeId: node.nodeId,
      nodeTitle: node.nodeTitle,
      fragments: node.fragments.map((fragment) => ({
        id: fragment.id,
        type: fragment.type,
        content: fragment.content,
      })),
    }))
    .filter((node) => node.fragments.length > 0);

  const text = await nvidiaChatCompletion({
    messages: [
      {
        role: "system",
        content:
          "You are Suika Conclude AI. Pick the most supported conclusion that answers the greatest number of question fragments across nodes. Return only valid JSON.",
      },
      {
        role: "user",
        content: `Analyze this problem space and conclude it. Prioritize the conclusion with the highest question coverage and strongest evidence/constraint fit.\nReturn JSON with keys: conclusion, why, description, suggestions (string[]), advice (string[]), confidence (HIGH|MEDIUM|LOW), basedOnQuestionCount (number), totalQuestionCount (number).\nData:\n${JSON.stringify(payload, null, 2)}`,
      },
    ],
    maxTokens: 2048,
    temperature: 0.2,
    model: getActiveConclusionModel(),
  });

  const parsed = extractJsonObject(text);

  if (!parsed) {
    return fallbackProblemSpaceConclusion(input);
  }

  const conclusion =
    typeof parsed.conclusion === "string" ? parsed.conclusion.trim() : "";
  const why = typeof parsed.why === "string" ? parsed.why.trim() : "";
  const description =
    typeof parsed.description === "string" ? parsed.description.trim() : "";

  const confidenceRaw =
    typeof parsed.confidence === "string"
      ? parsed.confidence.trim().toUpperCase()
      : "MEDIUM";
  const confidence: ProblemSpaceConclusion["confidence"] =
    confidenceRaw === "HIGH" || confidenceRaw === "LOW"
      ? confidenceRaw
      : "MEDIUM";

  const basedOnQuestionCount =
    typeof parsed.basedOnQuestionCount === "number" &&
    Number.isFinite(parsed.basedOnQuestionCount)
      ? Math.max(0, Math.round(parsed.basedOnQuestionCount))
      : 0;

  const totalQuestionCount =
    typeof parsed.totalQuestionCount === "number" &&
    Number.isFinite(parsed.totalQuestionCount)
      ? Math.max(0, Math.round(parsed.totalQuestionCount))
      : 0;

  const suggestions = normalizeBullets(parsed.suggestions, 4);
  const advice = normalizeBullets(parsed.advice, 4);

  if (!conclusion || !why || !description) {
    return fallbackProblemSpaceConclusion(input);
  }

  let _fallback: ProblemSpaceConclusion | null = null;
  const getFallback = () =>
    (_fallback ??= fallbackProblemSpaceConclusion(input));

  return {
    conclusion: conclusion.slice(0, 600),
    why: why.slice(0, 600),
    description: description.slice(0, 600),
    suggestions:
      suggestions.length > 0 ? suggestions : getFallback().suggestions,
    advice: advice.length > 0 ? advice : getFallback().advice,
    confidence,
    basedOnQuestionCount,
    totalQuestionCount,
  };
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

const extractJsonObject = (text: string): Record<string, unknown> | null => {
  const trimmed = text.trim();

  try {
    const parsed = JSON.parse(trimmed);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    // Recover from accidental prose wrappers.
  }

  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");

  if (start < 0 || end < 0 || end <= start) {
    return null;
  }

  try {
    const parsed = JSON.parse(trimmed.slice(start, end + 1));
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    return null;
  }

  return null;
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

const extractQuoteCandidate = (raw: string): string | null => {
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }

  let unwrapped = trimmed;
  if (unwrapped.startsWith("```")) {
    unwrapped = unwrapped
      .replace(/^```(json|text)?\n?/i, "")
      .replace(/```$/i, "")
      .trim();
  }

  try {
    const parsed = JSON.parse(unwrapped) as unknown;

    if (typeof parsed === "string") {
      return normalizeQuoteText(parsed);
    }

    if (parsed && typeof parsed === "object") {
      const record = parsed as Record<string, unknown>;
      if (typeof record.quote === "string") {
        return normalizeQuoteText(record.quote);
      }
    }
  } catch {
    // Non-JSON responses are allowed below.
  }

  const objectQuoteMatch =
    /"quote"\s*:\s*"([\s\S]*?)"/i.exec(unwrapped)?.[1] ?? null;
  if (objectQuoteMatch) {
    return normalizeQuoteText(objectQuoteMatch);
  }

  return normalizeQuoteText(unwrapped);
};

const isUsefulQuote = (quote: string) => {
  if (quote.length < 16 || quote.length > 240) {
    return false;
  }

  const words = quote.split(/\s+/).filter(Boolean);
  if (words.length < 4) {
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

const normalizeSentence = (text: string) => {
  const trimmed = text.replace(/\s+/g, " ").trim();
  if (!trimmed) {
    return "";
  }

  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
};

const trimFragmentPreview = (text: string, maxChars = 120) => {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (cleaned.length <= maxChars) {
    return cleaned;
  }

  return `${cleaned.slice(0, maxChars - 1).trimEnd()}...`;
};

const relationshipReasonParagraph = (params: {
  relationship: ClarityRelationship;
  rationale: string;
  fromNodeTitle?: string;
  toNodeTitle?: string;
  fromContent: string;
  toContent: string;
}) => {
  const relationHeader = `${params.relationship}:`;
  const coreReason = normalizeSentence(params.rationale);

  const fromDescriptor = params.fromNodeTitle
    ? `in ${params.fromNodeTitle}`
    : "in the source fragment";
  const toDescriptor = params.toNodeTitle
    ? `in ${params.toNodeTitle}`
    : "in the target fragment";

  const contextSentence = normalizeSentence(
    `Specifically, the claim ${fromDescriptor} ("${trimFragmentPreview(params.fromContent)}") is linked to the claim ${toDescriptor} ("${trimFragmentPreview(params.toContent)}")`,
  );

  const guidanceSentence = normalizeSentence(
    "Use this link to verify whether the target should be strengthened, revised, or resolved based on the source evidence and intent",
  );

  return `${relationHeader} ${coreReason} ${contextSentence} ${guidanceSentence}`.trim();
};

const normalizeBullets = (value: unknown, maxItems: number) => {
  if (!Array.isArray(value)) {
    return [] as string[];
  }

  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((item) => item.length > 0)
    .slice(0, maxItems);
};

const fallbackProblemSpaceConclusion = (
  input: ClarityConnectionInput[],
): ProblemSpaceConclusion => {
  const allFragments = input.flatMap((node) =>
    node.fragments.map((fragment) => ({
      nodeTitle: node.nodeTitle,
      ...fragment,
    })),
  );

  const questions = allFragments.filter(
    (fragment) => fragment.type === "QUESTION",
  );
  const conclusionCandidates = allFragments.filter(
    (fragment) => fragment.type === "CONCLUSION",
  );

  if (questions.length === 0) {
    return {
      conclusion:
        "There is not enough explicit question framing yet to conclude this problem space confidently.",
      why: "A conclusion is strongest when it answers clear question fragments. This space currently lacks explicit question anchors.",
      description:
        "Add at least 2-3 focused question fragments across your nodes, then run Conclude problem space again.",
      suggestions: [
        "Convert broad uncertainties into specific question fragments.",
        "Pair each question with at least one observation or constraint.",
        "Mark one question as the primary decision question.",
      ],
      advice: [
        "Prefer one measurable question per node.",
        "Avoid jumping to conclusions before evidence and constraints are represented.",
      ],
      confidence: "LOW",
      basedOnQuestionCount: 0,
      totalQuestionCount: 0,
    };
  }

  const bestCandidate =
    conclusionCandidates
      .map((candidate) => {
        const score = questions.reduce((total, question) => {
          return total + tokenOverlapScore(candidate.content, question.content);
        }, 0);

        const coveredQuestions = questions.filter((question) => {
          return tokenOverlapScore(candidate.content, question.content) >= 0.12;
        }).length;

        return {
          candidate,
          score,
          coveredQuestions,
        };
      })
      .sort((a, b) => {
        if (b.coveredQuestions !== a.coveredQuestions) {
          return b.coveredQuestions - a.coveredQuestions;
        }

        return b.score - a.score;
      })[0] ?? null;

  const pickedConclusion =
    bestCandidate?.candidate.content.trim() ||
    allFragments
      .find((fragment) => fragment.type !== "QUESTION")
      ?.content.trim() ||
    "The available evidence suggests narrowing this problem into one decisive path and validating it quickly.";

  const basedOnQuestionCount =
    bestCandidate?.coveredQuestions ?? Math.min(1, questions.length);
  const confidence: ProblemSpaceConclusion["confidence"] =
    basedOnQuestionCount >= Math.max(2, Math.ceil(questions.length * 0.6))
      ? "MEDIUM"
      : "LOW";

  return {
    conclusion: pickedConclusion,
    why: `This conclusion best aligns with ${basedOnQuestionCount} of ${questions.length} explicit questions by semantic overlap and fit with available constraints/observations.`,
    description:
      "The conclusion reflects the strongest currently-supported direction in your nodes, but you should still validate assumptions with targeted evidence.",
    suggestions: [
      "Turn this conclusion into a concrete next-step experiment.",
      "Add one supporting observation and one opposing constraint to stress-test it.",
      "Re-run conclusion after updating contradictory fragments.",
    ],
    advice: [
      "Treat this as a working conclusion, not an irreversible decision.",
      "Use short feedback loops to confirm whether the conclusion remains true.",
    ],
    confidence,
    basedOnQuestionCount,
    totalQuestionCount: questions.length,
  };
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
  const selectedFragmentPairKeys = new Set<string>();

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
    selectedFragmentPairKeys.add(
      `${edge.fromFragmentId}::${edge.toFragmentId}`,
    );
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
    if (selectedFragmentPairKeys.has(key) || !canUse(edge)) {
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
            reason: relationshipReasonParagraph({
              relationship: classified.relationship,
              rationale: classified.rationale,
              fromNodeTitle: fromNode.nodeTitle,
              toNodeTitle: toNode.nodeTitle,
              fromContent: from.content,
              toContent: to.content,
            }),
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
  // Gemini path intentionally disabled. Use Nvidia for all runtime chat calls.
  return chatWithNvidia(options);
};

export const generateSuikaMotivationalQuote = async () => {
  try {
    return await generateSuikaMotivationalQuoteWithNvidia();
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
    return await generateSuikaWeavingSuggestionsWithNvidia(inputs);
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

  return analyzeFragmentRelationshipsWithNvidia(fragments);
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
      node_title: node.nodeTitle,
      type: fragment.type,
      content: fragment.content,
    })),
  );

  const fragmentToNodeId = new Map(flatFragments.map((f) => [f.id, f.node_id]));
  const fragmentById = new Map(flatFragments.map((f) => [f.id, f]));

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
        const fromFragment = fragmentById.get(record.source_id);
        const toFragment = fragmentById.get(record.target_id);

        if (
          !fromNodeId ||
          !toNodeId ||
          !fromFragment ||
          !toFragment ||
          record.source_id === record.target_id
        ) {
          return null;
        }

        return {
          fromNodeId,
          toNodeId,
          fromFragmentId: record.source_id,
          toFragmentId: record.target_id,
          reason: relationshipReasonParagraph({
            relationship: record.relationship,
            rationale: record.rationale,
            fromNodeTitle: fromFragment.node_title,
            toNodeTitle: toFragment.node_title,
            fromContent: fromFragment.content,
            toContent: toFragment.content,
          }).slice(0, 900),
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

const clamp01 = (value: number) => {
  return Math.max(0, Math.min(1, value));
};

const clampPercent = (value: number) => {
  return Math.max(0, Math.min(100, Math.round(value)));
};

const relationSignalWeight = (reason: string) => {
  if (reason.startsWith("RESOLVES")) {
    return 3;
  }

  if (reason.startsWith("CONTRADICTS")) {
    return 2;
  }

  return 1.6;
};

// AI chooses relationships first, then we convert that signal map into a stable 0-100 clarity score.
export const decideProblemSpaceClarityProgress = async (
  input: ClarityConnectionInput[],
): Promise<number> => {
  const nodeCount = input.length;
  const allFragments = input.flatMap((node) => node.fragments);
  const fragmentCount = allFragments.length;

  if (fragmentCount === 0) {
    return 0;
  }

  if (fragmentCount === 1) {
    return 12;
  }

  const suggestions = await generateClarityGraphConnections(input);

  const coveredNodes = new Set<string>();
  const coveredFragments = new Set<string>();
  const relationCounts = {
    resolves: 0,
    contradicts: 0,
    clarifies: 0,
  };

  let weightedConnectionSignal = 0;

  suggestions.forEach((edge) => {
    coveredNodes.add(edge.fromNodeId);
    coveredNodes.add(edge.toNodeId);
    coveredFragments.add(edge.fromFragmentId);
    coveredFragments.add(edge.toFragmentId);

    weightedConnectionSignal += relationSignalWeight(edge.reason);

    if (edge.reason.startsWith("RESOLVES")) {
      relationCounts.resolves += 1;
      return;
    }

    if (edge.reason.startsWith("CONTRADICTS")) {
      relationCounts.contradicts += 1;
      return;
    }

    relationCounts.clarifies += 1;
  });

  const typeCoverage =
    new Set(allFragments.map((fragment) => fragment.type)).size /
    CLARITY_FRAGMENT_TYPES.length;
  const nodeCoverage =
    nodeCount === 0 ? 0 : coveredNodes.size / Math.max(1, nodeCount);
  const fragmentCoverage = coveredFragments.size / fragmentCount;
  const maxEdgeSignal = Math.max(
    1,
    targetRelationshipEdgeCount(Math.max(1, nodeCount)) * 3,
  );
  const networkSignal = clamp01(weightedConnectionSignal / maxEdgeSignal);

  let questionPresence = 0;
  let conclusionPresence = 0;
  for (const fragment of allFragments) {
    if (fragment.type === "QUESTION") questionPresence = 1;
    else if (fragment.type === "CONCLUSION") conclusionPresence = 1;
    if (questionPresence && conclusionPresence) break;
  }

  const relationTotal = Math.max(1, suggestions.length);
  const contradictionRatio = relationCounts.contradicts / relationTotal;
  const resolutionRatio = relationCounts.resolves / relationTotal;
  const clarityRatio = relationCounts.clarifies / relationTotal;
  const coherence = clamp01(
    0.55 +
      resolutionRatio * 0.45 +
      clarityRatio * 0.2 -
      contradictionRatio * 0.4,
  );

  const perNodeDensity = clamp01(fragmentCount / Math.max(3, nodeCount * 3));

  const normalizedScore =
    typeCoverage * 0.2 +
    nodeCoverage * 0.2 +
    fragmentCoverage * 0.15 +
    networkSignal * 0.15 +
    coherence * 0.15 +
    questionPresence * 0.07 +
    conclusionPresence * 0.04 +
    perNodeDensity * 0.04;

  let progress = clampPercent(normalizedScore * 100);

  const contentFloor = Math.min(40, 10 + fragmentCount * 3);
  progress = Math.max(progress, contentFloor);

  if (suggestions.length === 0) {
    progress = Math.min(progress, 38);
  }

  if (fragmentCount < 4) {
    progress = Math.min(progress, 55);
  }

  return clampPercent(progress);
};

export const generateProblemSpaceConclusion = async (
  input: ClarityConnectionInput[],
): Promise<ProblemSpaceConclusion> => {
  if (input.length === 0) {
    return fallbackProblemSpaceConclusion(input);
  }

  try {
    return await generateProblemSpaceConclusionWithNvidia(input);
  } catch {
    return fallbackProblemSpaceConclusion(input);
  }
};
