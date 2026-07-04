import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import prisma from "@/lib/prisma";
import { isDatasetStale, syncRecent } from "@/lib/canlii/client";

const ACTIVE_AI_PROVIDER = (process.env.AI_PROVIDER ?? "nvidia").toLowerCase();

const DEFAULT_CHAT_MODEL = process.env.GOOGLE_AI_MODEL ?? "gemini-2.5-flash";
const DEFAULT_NVIDIA_MODEL =
  process.env.NVIDIA_AI_MODEL ?? "google/gemma-3n-e2b-it";
const DEFAULT_NVIDIA_CHAT_MODEL =
  process.env.NVIDIA_AI_CHAT_MODEL ?? DEFAULT_NVIDIA_MODEL;
const DEFAULT_NVIDIA_WEAVING_MODEL =
  process.env.NVIDIA_AI_WEAVING_MODEL ?? "google/gemma-3n-e2b-it";
const DEFAULT_NVIDIA_RELATIONSHIP_MODEL =
  process.env.NVIDIA_AI_RELATIONSHIP_MODEL ?? "google/gemma-3n-e2b-it";
const DEFAULT_NVIDIA_CONCLUSION_MODEL =
  process.env.NVIDIA_AI_CONCLUSION_MODEL ?? "google/gemma-3n-e2b-it";
const NVIDIA_THINKING_MODE =
  (process.env.NVIDIA_AI_THINKING ?? "false").toLowerCase() === "true";

const MAX_RELATIONSHIP_EDGES = 8;

// ─── CanLII Dataset Context ──────────────────────────────────────────────────

export type DatasetLaw = {
  canliiId: string;
  title: string;
  citation: string | null;
  jurisdiction: string | null;
  documentType: string;
  url: string | null;
  decisionDate: Date | null;
};

export type DatasetContext = {
  laws: DatasetLaw[];
  source: "canlii_dataset";
};

function extractSearchTerms(fragments: Array<{ content: string }>): string[] {
  const stopWords = new Set([
    "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
    "have", "has", "had", "do", "does", "did", "will", "would", "could",
    "should", "may", "might", "shall", "can", "need", "dare", "ought",
    "used", "to", "of", "in", "for", "on", "with", "at", "by", "from",
    "as", "into", "through", "during", "before", "after", "above", "below",
    "between", "out", "off", "over", "under", "again", "further", "then",
    "once", "here", "there", "when", "where", "why", "how", "all", "both",
    "each", "few", "more", "most", "other", "some", "such", "no", "nor",
    "not", "only", "own", "same", "so", "than", "too", "very", "just",
    "because", "but", "and", "or", "if", "while", "that", "this", "these",
    "those", "it", "its", "he", "she", "they", "them", "their", "what",
    "which", "who", "whom", "about", "against", "up", "down",
  ]);

  const allWords = fragments
    .flatMap((f) =>
      f.content
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
    )
    .filter((w) => w.length >= 3 && !stopWords.has(w));

  const freq = new Map<string, number>();
  for (const word of allWords) {
    freq.set(word, (freq.get(word) ?? 0) + 1);
  }

  return Array.from(freq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([word]) => word);
}

export async function searchCanLIIDataset(
  fragments: Array<{ content: string }>,
  limit = 15,
): Promise<DatasetContext> {
  const terms = extractSearchTerms(fragments);
  if (terms.length === 0) {
    return { laws: [], source: "canlii_dataset" };
  }

  const where = {
    syncStatus: "COMPLETED" as const,
    OR: terms.flatMap((term) => [
      { title: { contains: term, mode: "insensitive" as const } },
      { citation: { contains: term, mode: "insensitive" as const } },
    ]),
  };

  const rows = await prisma.canLIIDataset.findMany({
    where,
    select: {
      canliiId: true,
      title: true,
      citation: true,
      jurisdiction: true,
      documentType: true,
      url: true,
      decisionDate: true,
    },
    take: limit,
    orderBy: [{ decisionDate: "desc" }, { lastSyncedAt: "desc" }],
  });

  return {
    laws: rows.map((r) => ({
      canliiId: r.canliiId,
      title: r.title,
      citation: r.citation,
      jurisdiction: r.jurisdiction,
      documentType: r.documentType,
      url: r.url,
      decisionDate: r.decisionDate,
    })),
    source: "canlii_dataset",
  };
}

function formatDatasetContext(ctx: DatasetContext): string {
  if (ctx.laws.length === 0) return "";
  return ctx.laws
    .map(
      (law, i) => {
        const dateStr = law.decisionDate
          ? ` — decided ${law.decisionDate.toISOString().split("T")[0]}`
          : "";
        return `[${i + 1}] ${law.title} (${law.citation ?? "no citation"}) — ${law.documentType}, jurisdiction: ${law.jurisdiction ?? "unknown"}${dateStr}${law.url ? `\n    URL: ${law.url}` : ""}`;
      },
    )
    .join("\n");
}

let lastFreshnessCheck = 0;
let lastFreshnessResult = false;

async function ensureDatasetFresh(): Promise<void> {
  const now = Date.now();
  if (now - lastFreshnessCheck < 60_000) {
    if (!lastFreshnessResult) return;
  }

  try {
    const stale = await isDatasetStale();
    lastFreshnessCheck = now;
    lastFreshnessResult = stale;

    if (stale) {
      await syncRecent({ jurisdictions: ["on", "ca"] });
    }
  } catch {
    // Non-blocking: if freshness check fails, proceed with existing data
  }
}

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
export type WeavingSuggestionKind =
  | "MISSING_QUESTION"
  | "EVIDENCE_GAP"
  | "MISSING_ELEMENT"
  | "AUTHORITY_GAP"
  | "JURISDICTIONAL_DEFECT"
  | "PROCEDURAL_BAR"
  | "STANDARD_OF_REVIEW"
  | "FACTUAL_DISPUTE"
  | "AFFIRMATIVE_DEFENSE"
  | "DAMAGES_SPECIFICATION";

type FragmentType =
  | "QUESTION"
  | "IDEA"
  | "OBSERVATION"
  | "CONSTRAINS"
  | "CONCLUSION"
  | "LEGAL_ELEMENT"
  | "BINDING_AUTHORITY"
  | "PERSUASIVE_AUTHORITY"
  | "PROCEDURAL_FACT"
  | "EVIDENTIARY_FACT";

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

export type DefendingSide = "PLAINTIFF" | "DEFENDANT";

export type ArgumentEntry = {
  argument: string;
  strength: "STRONG" | "MEDIUM" | "WEAK";
  supportingAuthority?: string;
  keyEvidence?: string;
};

export type OpponentArgumentEntry = {
  argument: string;
  strength: "STRONG" | "MEDIUM" | "WEAK";
  counterRebuttal: string;
  rebuttalAuthority?: string;
};

export type BestOutcome = {
  outcome: string;
  likelihood: "HIGH" | "MEDIUM" | "LOW";
  reasoning: string;
  requiredElements: string[];
  supportingLaws: Array<{
    title: string;
    citation: string;
    url: string | null;
    relevance: string;
    documentType: string;
  }>;
  keyFactors: string[];
  risks: string[];
  nextSteps: string[];
};

export type ProblemSpaceConclusion = {
  summary: string;
  defendingSide?: DefendingSide;
  ourArguments?: ArgumentEntry[];
  opponentArguments?: OpponentArgumentEntry[];
  rebuttalStrategy?: string[];
  bestOutcomes: BestOutcome[];
  confidence: "HIGH" | "MEDIUM" | "LOW";
  basedOnQuestionCount: number;
  totalQuestionCount: number;
  controllingAuthority?: Array<{
    citation: string;
    jurisdiction: string;
    weight: "binding" | "persuasive";
  }>;
  elementAnalysis?: Array<{
    element: string;
    satisfied: boolean;
    supportingFragments: string[];
    gaps: string[];
  }>;
  proceduralPosture?: string;
  standardOfReview?: string;
};

const CLARITY_FRAGMENT_TYPES: FragmentType[] = [
  "QUESTION",
  "IDEA",
  "OBSERVATION",
  "CONSTRAINS",
  "CONCLUSION",
  "LEGAL_ELEMENT",
  "BINDING_AUTHORITY",
  "PERSUASIVE_AUTHORITY",
  "PROCEDURAL_FACT",
  "EVIDENTIARY_FACT",
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

const NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1";

const getActiveChatModel = () => {
  return DEFAULT_NVIDIA_CHAT_MODEL;
};

const getActiveWeavingModel = () => {
  return DEFAULT_NVIDIA_WEAVING_MODEL;
};

const getActiveRelationshipModel = () => {
  return DEFAULT_NVIDIA_RELATIONSHIP_MODEL;
};

const getActiveConclusionModel = () => {
  return DEFAULT_NVIDIA_CONCLUSION_MODEL;
};

const logActiveAiProvider = () => {
  const globalRef = globalThis as typeof globalThis & {
    __suikaAiProviderLogged?: boolean;
  };

  if (globalRef.__suikaAiProviderLogged) {
    return;
  }

  const provider = ACTIVE_AI_PROVIDER === "gemini" ? "gemini" : "nvidia";
  console.log(`[AI_PROVIDER] active=${provider}`);
  globalRef.__suikaAiProviderLogged = true;
};

logActiveAiProvider();

let nvidiaClient: OpenAI | null = null;

const getNvidiaClient = () => {
  if (!nvidiaClient) {
    nvidiaClient = new OpenAI({
      apiKey: getNvidiaApiKey(),
      baseURL: NVIDIA_BASE_URL,
    });
  }

  return nvidiaClient;
};

const getNvidiaApiKey = () => {
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
  useChainOfThought?: boolean;
};

const isNemotronModel = (model?: string) => {
  if (!model) return false;
  const normalized = model.trim().toLowerCase();
  return (
    normalized.startsWith("nvidia/nemotron") ||
    normalized === "nvidia/nemotron-3-super-120b-a12b" ||
    normalized.includes("nemotron-3-super")
  );
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
  useChainOfThought,
}: NvidiaChatCompletionOptions): Promise<string> => {
  const enableThinking =
    useChainOfThought ?? (isNemotronModel(model) ? true : NVIDIA_THINKING_MODE);

  const requestCompletion = async (thinking: boolean) => {
    const thinkingConfig =
      typeof useChainOfThought === "boolean"
        ? { enable_thinking: useChainOfThought }
        : thinking
          ? { enable_thinking: true }
          : {};

    const completion = await getNvidiaClient().chat.completions.create({
      model,
      messages,
      temperature,
      top_p: 0.95,
      max_tokens: maxTokens,
      stream: false,
      response_format: { type: "json_object" },
      ...(Object.keys(thinkingConfig).length > 0
        ? { chat_template_kwargs: thinkingConfig }
        : {}),
    } as any);

    const content = completion.choices?.[0]?.message?.content;
    return extractNvidiaSdkText(content);
  };

  const first = await requestCompletion(enableThinking);
  if (first) {
    return first;
  }

  if (enableThinking) {
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

  const raw = await chatWithGemini({
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
  });

  const candidate = extractQuoteCandidate(raw);

  if (!candidate || !isUsefulQuote(candidate)) {
    throw new Error("Quoted model returned an unusable quote.");
  }

  return { quote: candidate as string, source: "ai" as const };
};

const generateSuikaWeavingSuggestionsWithNvidia = async (
  inputs: WeavingSuggestionInput[],
): Promise<WeavingSuggestion[]> => {
  const systemInstruction = `You are a litigation partner reviewing associate work product for legal case analysis.

DIAGNOSTIC CATEGORIES (kind):
- MISSING_ELEMENT: Required legal element has no supporting evidence fragment
- AUTHORITY_GAP: Legal conclusion lacks binding/controlling authority
- JURISDICTIONAL_DEFECT: Missing venue, standing, ripeness, or subject-matter jurisdiction facts
- PROCEDURAL_BAR: Statute of limitations, exhaustion, waiver, or preclusion not addressed
- STANDARD_OF_REVIEW: Missing articulation of applicable appellate standard
- FACTUAL_DISPUTE: Material fact genuinely contested requiring trial
- AFFIRMATIVE_DEFENSE: Potential defense not pleaded or supported
- DAMAGES_SPECIFICATION: Damage model or causation chain incomplete
- MISSING_QUESTION: Node has ideas/observations but no explicit guiding question
- EVIDENCE_GAP: Node has claims but lacks concrete evidence

For each suggestion, recommend the SPECIFIC fragment type to add (QUESTION/OBSERVATION/CONSTRAINS/CONCLUSION/LEGAL_ELEMENT/BINDING_AUTHORITY/PERSUASIVE_AUTHORITY/PROCEDURAL_FACT/EVIDENTIARY_FACT) and cite the governing rule/case in rationale.

Return only a JSON array. Use only node titles and fragment ids from input.`;

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

      const validKinds = [
        "MISSING_QUESTION",
        "EVIDENCE_GAP",
        "MISSING_ELEMENT",
        "AUTHORITY_GAP",
        "JURISDICTIONAL_DEFECT",
        "PROCEDURAL_BAR",
        "STANDARD_OF_REVIEW",
        "FACTUAL_DISPUTE",
        "AFFIRMATIVE_DEFENSE",
        "DAMAGES_SPECIFICATION",
      ];

      if (
        !validKinds.includes(record.kind as string) ||
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
        toTitle: record.kind as WeavingSuggestionKind,
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
  datasetCtx?: DatasetContext,
): Promise<RelationshipRecord[]> => {
  const datasetBlock = datasetCtx && datasetCtx.laws.length > 0
    ? `\n\nREFERENCE CANADIAN LAWS FROM DATASET (use these to cite specific authorities in your rationale):\n${formatDatasetContext(datasetCtx)}\n\nWhen a relationship involves a legal principle, cite the specific law from the dataset above by its number (e.g., "[1]") in the rationale. If no dataset law applies, cite the principle from the fragment content itself.`
    : "";

  const systemInstruction = `You are a senior legal analyst specializing in case law reasoning and statutory interpretation.

Analyze legal fragments and map STRONG logical relationships using these precise definitions:

RELATIONSHIP TYPES:
- CONTRADICTS: Source legally precludes target (statutory bar, binding precedent, jurisdictional defect, constitutional violation, procedural bar)
- CLARIFIES: Source provides controlling authority, statutory text, or factual predicate that illuminates target's legal significance
- RESOLVES: Source contains a holding, finding, or determination that directly answers target's legal question

LEGAL REASONING RULES:
- Distinguish binding vs. persuasive authority in rationale
- Identify jurisdiction, court level, and date for each authority
- Flag missing elements: standing, ripeness, exhaustion, statutes of limitations
- Note when fragments represent: elements of a claim, affirmative defenses, standards of review
- Rationale MUST cite specific legal principle, statute, or case name from source
- When a Canadian law from the dataset applies, cite it by reference number (e.g., "[1]") in the rationale
- No weak analogical links without explicit doctrinal basis${datasetBlock}

Return ONLY JSON array: {source_id, target_id, relationship, rationale}.`;

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
  datasetCtx?: DatasetContext,
  defendingSide?: DefendingSide,
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

  const datasetBlock = datasetCtx && datasetCtx.laws.length > 0
    ? `\n\nREFERENCE CANADIAN LAWS FROM DATASET:\n${formatDatasetContext(datasetCtx)}\n\nYou MUST use these laws to support outcomes, arguments, and rebuttals. Cite laws by number (e.g., "[1]") throughout.`
    : "";

  const sideLabel = defendingSide === "DEFENDANT"
    ? "DEFENDANT (you are defending the accused/respondent)"
    : defendingSide === "PLAINTIFF"
      ? "PLAINTIFF/PROSECUTOR (you are bringing the claim/complaint)"
      : null;

  const argumentBlock = sideLabel
    ? `
ARGUMENT STRATEGY (from the perspective of the ${sideLabel}):

1. "ourArguments" (array): Your strongest arguments.
   Each: { argument: string, strength: "STRONG"|"MEDIUM"|"WEAK", supportingAuthority?: string, keyEvidence?: string }

2. "opponentArguments" (array): The opposing side's best arguments against you.
   Each: { argument: string, strength: "STRONG"|"MEDIUM"|"WEAK", counterRebuttal: string, rebuttalAuthority?: string }

3. "rebuttalStrategy" (array): General strategic advice for countering the opponent.

RULES:
- Each argument MUST be grounded in the fragments or applicable law
- Opponent arguments must be the BEST case against you, not straw men
- Rebuttals must be specific and cite controlling authority
- "defendingSide" must be returned as "${defendingSide}"` : "";

  const text = await nvidiaChatCompletion({
    messages: [
      {
        role: "system",
        content: `You are a senior legal strategist analyzing a legal problem space.

TASK: Determine the best possible outcomes AND build an argument strategy for the ${sideLabel ?? "relevant party"}.

FRAMEWORK:
1. Identify the controlling legal standard (statute, regulation, precedent)
2. Map each QUESTION fragment to required legal elements
3. Evaluate EVIDENCE fragments against each element
4. Apply CONSTRAINTS (jurisdictional, procedural, statutory)
5. Cross-reference the Canadian law dataset to find applicable legislation, regulations, and case law
6. Determine which outcomes are most favorable AND achievable
7. Build argument strategy from the ${sideLabel ?? "relevant party"} perspective
8. Anticipate and counter the opposing side's strongest arguments${datasetBlock}
${argumentBlock}

OUTPUT JSON:
{
  "summary": "Brief overview of the case posture and legal landscape",
  "defendingSide": "${defendingSide ?? ""}",
  "ourArguments": [{ "argument": "...", "strength": "STRONG|MEDIUM|WEAK", "supportingAuthority": "...", "keyEvidence": "..." }],
  "opponentArguments": [{ "argument": "...", "strength": "STRONG|MEDIUM|WEAK", "counterRebuttal": "...", "rebuttalAuthority": "..." }],
  "rebuttalStrategy": ["..."],
  "bestOutcomes": [
    {
      "outcome": "Description of best possible result",
      "likelihood": "HIGH | MEDIUM | LOW",
      "reasoning": "Legal reasoning citing specific laws by number",
      "requiredElements": ["..."],
      "supportingLaws": [{ "title": "...", "citation": "...", "url": null, "relevance": "...", "documentType": "CASE_LAW|LEGISLATION|REGULATION" }],
      "keyFactors": ["..."],
      "risks": ["..."],
      "nextSteps": ["..."]
    }
  ],
  "controllingAuthority": [{ "citation": "...", "jurisdiction": "...", "weight": "binding|persuasive" }],
  "elementAnalysis": [{ "element": "...", "satisfied": true, "supportingFragments": [], "gaps": [] }],
  "proceduralPosture": "...",
  "standardOfReview": "..."
}

RULES:
- Generate 2-4 ranked outcomes from BEST to WORST
- Each outcome MUST cite specific laws from the dataset by number
- Arguments must be concrete and actionable
- Include controlling authority and element analysis${datasetBlock}`,
      },
      {
        role: "user",
        content: `Analyze this problem space. Determine best outcomes and build argument strategy.
${sideLabel ? `The user represents the ${sideLabel}. Build arguments from this perspective.` : ""}
Return JSON with keys: summary, defendingSide, ourArguments, opponentArguments, rebuttalStrategy, bestOutcomes, confidence, basedOnQuestionCount, totalQuestionCount, controllingAuthority, elementAnalysis, proceduralPosture, standardOfReview.
Data:
${JSON.stringify(payload, null, 2)}`,
      },
    ],
    maxTokens: 4096,
    temperature: 0.0,
    model: getActiveConclusionModel(),
  });

  const parsed = extractJsonObject(text);

  if (!parsed) {
    return fallbackProblemSpaceConclusion(input);
  }

  const summary =
    typeof parsed.summary === "string" ? parsed.summary.trim() : "";

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

  const parseLikelihood = (val: string): "HIGH" | "MEDIUM" | "LOW" => {
    const upper = val.trim().toUpperCase();
    if (upper === "HIGH" || upper === "LOW") return upper;
    return "MEDIUM";
  };

  const parseSupportingLaws = (laws: unknown[]): BestOutcome["supportingLaws"] => {
    return laws
      .map((al) => {
        if (!al || typeof al !== "object") return null;
        const record = al as Record<string, unknown>;
        const title = typeof record.title === "string" ? record.title.trim() : "";
        const citation = typeof record.citation === "string" ? record.citation.trim() : "";
        const url = typeof record.url === "string" ? record.url.trim() : null;
        const relevance = typeof record.relevance === "string" ? record.relevance.trim() : "";
        const documentType = typeof record.documentType === "string" ? record.documentType.trim() : "LEGISLATION";
        if (!title) return null;
        return { title, citation, url, relevance, documentType };
      })
      .filter((l): l is BestOutcome["supportingLaws"][number] => Boolean(l));
  };

  const bestOutcomes: BestOutcome[] = Array.isArray(parsed.bestOutcomes)
    ? parsed.bestOutcomes
        .map((o) => {
          if (!o || typeof o !== "object") return null;
          const record = o as Record<string, unknown>;
          const outcome = typeof record.outcome === "string" ? record.outcome.trim() : "";
          const reasoning = typeof record.reasoning === "string" ? record.reasoning.trim() : "";
          if (!outcome || !reasoning) return null;
          const likelihood = parseLikelihood(String(record.likelihood ?? "MEDIUM"));
          const requiredElements = normalizeBullets(record.requiredElements, 8);
          const supportingLaws = Array.isArray(record.supportingLaws)
            ? parseSupportingLaws(record.supportingLaws)
            : [];
          const keyFactors = normalizeBullets(record.keyFactors, 6);
          const risks = normalizeBullets(record.risks, 6);
          const nextSteps = normalizeBullets(record.nextSteps, 6);
          return { outcome, likelihood, reasoning, requiredElements, supportingLaws, keyFactors, risks, nextSteps } as BestOutcome;
        })
        .filter((o): o is BestOutcome => Boolean(o))
    : [];

  const controllingAuthority = Array.isArray(parsed.controllingAuthority)
    ? parsed.controllingAuthority
        .map((ca) => {
          if (!ca || typeof ca !== "object") return null;
          const citation = typeof ca.citation === "string" ? ca.citation.trim() : "";
          const jurisdiction = typeof ca.jurisdiction === "string" ? ca.jurisdiction.trim() : "";
          const weight = ca.weight === "binding" || ca.weight === "persuasive" ? ca.weight : "persuasive";
          if (!citation || !jurisdiction) return null;
          return { citation, jurisdiction, weight };
        })
        .filter((ca): ca is { citation: string; jurisdiction: string; weight: "binding" | "persuasive" } => Boolean(ca))
    : [];

  const elementAnalysis = Array.isArray(parsed.elementAnalysis)
    ? parsed.elementAnalysis
        .map((ea) => {
          if (!ea || typeof ea !== "object") return null;
          const element = typeof ea.element === "string" ? ea.element.trim() : "";
          const satisfied = typeof ea.satisfied === "boolean" ? ea.satisfied : false;
          const supportingFragments = Array.isArray(ea.supportingFragments)
            ? ea.supportingFragments.map((s: unknown) => String(s).trim()).filter(Boolean)
            : [];
          const gaps = Array.isArray(ea.gaps)
            ? ea.gaps.map((g: unknown) => String(g).trim()).filter(Boolean)
            : [];
          if (!element) return null;
          return { element, satisfied, supportingFragments, gaps };
        })
        .filter((ea): ea is { element: string; satisfied: boolean; supportingFragments: string[]; gaps: string[] } => Boolean(ea))
    : [];

  const proceduralPosture =
    typeof parsed.proceduralPosture === "string" ? parsed.proceduralPosture.trim() : undefined;
  const standardOfReview =
    typeof parsed.standardOfReview === "string" ? parsed.standardOfReview.trim() : undefined;

  // Parse argument strategy
  const parsedDefendingSide =
    typeof parsed.defendingSide === "string"
      ? parsed.defendingSide.trim().toUpperCase()
      : undefined;
  const validSides: DefendingSide[] = ["PLAINTIFF", "DEFENDANT"];
  const ourDefendingSide: DefendingSide | undefined =
    parsedDefendingSide && validSides.includes(parsedDefendingSide as DefendingSide)
      ? (parsedDefendingSide as DefendingSide)
      : defendingSide;

  const ourArguments: ArgumentEntry[] = Array.isArray(parsed.ourArguments)
    ? parsed.ourArguments
        .map((arg) => {
          if (!arg || typeof arg !== "object") return null;
          const record = arg as Record<string, unknown>;
          const argument = typeof record.argument === "string" ? record.argument.trim() : "";
          const rawStrength = typeof record.strength === "string" ? record.strength.trim().toUpperCase() : "MEDIUM";
          const strength: ArgumentEntry["strength"] =
            rawStrength === "STRONG" || rawStrength === "WEAK" ? rawStrength : "MEDIUM";
          const supportingAuthority = typeof record.supportingAuthority === "string" ? record.supportingAuthority.trim() : undefined;
          const keyEvidence = typeof record.keyEvidence === "string" ? record.keyEvidence.trim() : undefined;
          if (!argument) return null;
          return { argument, strength, supportingAuthority, keyEvidence } as ArgumentEntry;
        })
        .filter((a): a is ArgumentEntry => Boolean(a))
    : [];

  const opponentArguments: OpponentArgumentEntry[] = Array.isArray(parsed.opponentArguments)
    ? parsed.opponentArguments
        .map((arg) => {
          if (!arg || typeof arg !== "object") return null;
          const record = arg as Record<string, unknown>;
          const argument = typeof record.argument === "string" ? record.argument.trim() : "";
          const rawStrength = typeof record.strength === "string" ? record.strength.trim().toUpperCase() : "MEDIUM";
          const strength: OpponentArgumentEntry["strength"] =
            rawStrength === "STRONG" || rawStrength === "WEAK" ? rawStrength : "MEDIUM";
          const counterRebuttal = typeof record.counterRebuttal === "string" ? record.counterRebuttal.trim() : "";
          const rebuttalAuthority = typeof record.rebuttalAuthority === "string" ? record.rebuttalAuthority.trim() : undefined;
          if (!argument || !counterRebuttal) return null;
          return { argument, strength, counterRebuttal, rebuttalAuthority } as OpponentArgumentEntry;
        })
        .filter((a): a is OpponentArgumentEntry => Boolean(a))
    : [];

  const rebuttalStrategy = normalizeBullets(parsed.rebuttalStrategy, 6);

  if (!summary || bestOutcomes.length === 0) {
    return fallbackProblemSpaceConclusion(input);
  }

  let _fallback: ProblemSpaceConclusion | null = null;
  const getFallback = () =>
    (_fallback ??= fallbackProblemSpaceConclusion(input));

  return {
    summary: summary.slice(0, 800),
    defendingSide: ourDefendingSide,
    ourArguments: ourArguments.length > 0 ? ourArguments : undefined,
    opponentArguments: opponentArguments.length > 0 ? opponentArguments : undefined,
    rebuttalStrategy: rebuttalStrategy.length > 0 ? rebuttalStrategy : undefined,
    bestOutcomes: bestOutcomes.length > 0 ? bestOutcomes : getFallback().bestOutcomes,
    confidence,
    basedOnQuestionCount,
    totalQuestionCount,
    controllingAuthority,
    elementAnalysis,
    proceduralPosture,
    standardOfReview,
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
      summary:
        "There is not enough explicit question framing yet to determine best outcomes confidently.",
      bestOutcomes: [
        {
          outcome: "Awaiting sufficient question framing to determine viable outcomes",
          likelihood: "LOW",
          reasoning: "A strong outcome analysis requires clear question fragments. This space currently lacks explicit question anchors to anchor legal analysis.",
          requiredElements: [],
          supportingLaws: [],
          keyFactors: [],
          risks: ["Insufficient question framing", "No clear legal issue defined"],
          nextSteps: [
            "Add at least 2-3 focused question fragments across your nodes.",
            "Pair each question with at least one observation or constraint.",
            "Re-run outcome analysis after adding question fragments.",
          ],
        },
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

  const pickedOutcome =
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
    summary: `Based on ${basedOnQuestionCount} of ${questions.length} question fragments, the following outcome has the strongest support.`,
    bestOutcomes: [
      {
        outcome: pickedOutcome,
        likelihood: confidence === "MEDIUM" ? "MEDIUM" : "LOW",
        reasoning: `This outcome best aligns with ${basedOnQuestionCount} of ${questions.length} explicit questions by semantic overlap and fit with available constraints/observations. Add more evidence and legal authorities to strengthen this analysis.`,
        requiredElements: questions.map((q) => q.content.slice(0, 120)),
        supportingLaws: [],
        keyFactors: conclusionCandidates.slice(0, 3).map((c) => c.content.slice(0, 120)),
        risks: ["Limited evidence base", "Few controlling authorities cited"],
        nextSteps: [
          "Add supporting observations and legal authorities.",
          "Re-run outcome analysis after updating fragments.",
          "Cross-reference with CanLII dataset for applicable laws.",
        ],
      },
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

  await ensureDatasetFresh();
  const datasetCtx = await searchCanLIIDataset(fragments);
  return analyzeFragmentRelationshipsWithNvidia(fragments, datasetCtx);
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

export const decideProblemSpaceClarityProgress = (
  input: ClarityConnectionInput[],
  suggestions: ClarityConnectionSuggestion[],
): number => {
  const nodeCount = input.length;
  const allFragments = input.flatMap((node) => node.fragments);
  const fragmentCount = allFragments.length;

  if (fragmentCount === 0) {
    return 0;
  }

  if (fragmentCount === 1) {
    return 12;
  }

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
  defendingSide?: DefendingSide,
): Promise<ProblemSpaceConclusion> => {
  if (input.length === 0) {
    return fallbackProblemSpaceConclusion(input);
  }

  await ensureDatasetFresh();
  const allFragments = input.flatMap((node) =>
    node.fragments.map((f) => ({ content: f.content })),
  );
  const datasetCtx = await searchCanLIIDataset(allFragments);

  try {
    return await generateProblemSpaceConclusionWithNvidia(input, datasetCtx, defendingSide);
  } catch {
    return fallbackProblemSpaceConclusion(input);
  }
};
