import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import prisma from "@/lib/prisma";
import { isDatasetStale, syncRecent } from "@/lib/canlii/client";

const ACTIVE_AI_PROVIDER = (process.env.AI_PROVIDER ?? "nvidia").toLowerCase();

const DEFAULT_CHAT_MODEL = process.env.GOOGLE_AI_MODEL ?? "gemini-2.5-flash";
const DEFAULT_NVIDIA_MODEL =
  process.env.NVIDIA_AI_MODEL ?? "nvidia/llama-3.3-nemotron-super-49b-v1.5";
const DEFAULT_NVIDIA_CHAT_MODEL =
  process.env.NVIDIA_AI_CHAT_MODEL ?? DEFAULT_NVIDIA_MODEL;
const DEFAULT_NVIDIA_RELATIONSHIP_MODEL =
  process.env.NVIDIA_AI_RELATIONSHIP_MODEL ?? "nvidia/llama-3.3-nemotron-super-49b-v1.5";
const DEFAULT_NVIDIA_CONCLUSION_MODEL =
  process.env.NVIDIA_AI_CONCLUSION_MODEL ?? "nvidia/llama-3.3-nemotron-super-49b-v1.5";
const NVIDIA_THINKING_MODE =
  (process.env.NVIDIA_AI_THINKING ?? "true").toLowerCase() === "true";

const MAX_RELATIONSHIP_EDGES = 8;
const MAX_RETRIES = 3;
const RETRY_BASE_DELAY_MS = 500;

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
      // Fire-and-forget: don't block the LLM call on dataset sync
      void syncRecent({ jurisdictions: ["on", "ca"] });
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

type FragmentType =
  | "QUESTION"
  | "IDEA"
  | "OBSERVATION"
  | "CONSTRAINS"
  | "CONCLUSION";

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
  legalCitations?: Array<{
    title: string;
    citation: string;
    relevance: string;
  }>;
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
];

type ClarityRelationship = "CONTRADICTS" | "CLARIFIES" | "RESOLVES";

type RelationshipRecord = {
  source_id: string;
  target_id: string;
  relationship: ClarityRelationship;
  rationale: string;
  legalCitations?: Array<{
    title: string;
    citation: string;
    relevance: string;
  }>;
};

type AnalyzeRelationshipOptions = {
  includeDatasetContext?: boolean;
  maxFragmentContentChars?: number;
  maxOutputTokens?: number;
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

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = MAX_RETRIES,
): Promise<T> => {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxRetries) {
        const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt);
        const jitter = Math.random() * 100;
        await sleep(delay + jitter);
      }
    }
  }

  throw lastError;
};

const getActiveChatModel = () => {
  return DEFAULT_NVIDIA_CHAT_MODEL;
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
  responseMimeType?: "application/json" | "text/plain";
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
  responseMimeType,
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

    const completion = await retryWithBackoff(async () => {
      return getNvidiaClient().chat.completions.create({
        model,
        messages,
        temperature,
        top_p: 0.95,
        max_tokens: maxTokens,
        stream: false,
        response_format: responseMimeType
          ? { type: responseMimeType === "text/plain" ? "text" : "json_object" }
          : { type: "json_object" },
        ...(Object.keys(thinkingConfig).length > 0
          ? { chat_template_kwargs: thinkingConfig }
          : {}),
      } as any);
    });

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
  maxTokens = 1024,
  temperature = 0.7,
  responseMimeType,
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
    responseMimeType,
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
    maxTokens: 128,
    temperature: 0.85,
  });

  const candidate = extractQuoteCandidate(raw);

  if (!candidate || !isUsefulQuote(candidate)) {
    throw new Error("Quoted model returned an unusable quote.");
  }

  return { quote: candidate as string, source: "ai" as const };
};

const analyzeFragmentRelationshipsWithNvidia = async (
  fragments: Array<{
    id: string;
    type: FragmentType;
    content: string;
  }>,
  datasetCtx?: DatasetContext,
  options?: AnalyzeRelationshipOptions,
): Promise<RelationshipRecord[]> => {
  const maxFragmentContentChars = Math.max(
    150,
    options?.maxFragmentContentChars ?? 600,
  );
  const maxOutputTokens = Math.max(512, options?.maxOutputTokens ?? 3072);

  const truncatedFragments = fragments.map((f) => ({
    ...f,
    content:
      f.content.length > maxFragmentContentChars
        ? f.content.slice(0, maxFragmentContentChars) + "..."
        : f.content,
  }));

  const datasetBlock = datasetCtx && datasetCtx.laws.length > 0
    ? `\n\nREFERENCE CANADIAN LAWS FROM DATASET:\n${formatDatasetContext(datasetCtx)}\n\nFor EACH relationship, you MUST identify specific laws from the dataset that support the connection. Include them in the "legalCitations" array with title, citation, and relevance. Cite laws by number (e.g., "[1]") in the rationale AND list them in legalCitations.`
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
- When a Canadian law from the dataset applies, cite it by reference number (e.g., "[1]") in the rationale AND include it in legalCitations
- No weak analogical links without explicit doctrinal basis
- Each relationship MUST have at least 1-2 supporting legal citations from the dataset when available${datasetBlock}

Return ONLY JSON array with this shape:
[{
  "source_id": "fragment_id",
  "target_id": "fragment_id",
  "relationship": "CONTRADICTS|CLARIFIES|RESOLVES",
  "rationale": "Detailed legal reasoning citing specific laws by number",
  "legalCitations": [
    { "title": "Full case/statute name", "citation": "Citation (e.g., 2023 SCC 15, R.S.C. 1985, c. C-46 s. 2)", "relevance": "How this law supports the connection" }
  ]
}]

IMPORTANT: Each connection MUST include the "legalCitations" array with real, specific laws from the dataset. Do not return empty arrays.`;

  const text = await nvidiaChatCompletion({
    messages: [
      { role: "system", content: systemInstruction },
      {
        role: "user",
        content: `Analyze fragments and return relationships with supporting legal citations:\n${JSON.stringify(truncatedFragments, null, 2)}`,
      },
    ],
    maxTokens: maxOutputTokens,
    temperature: 0,
    model: getActiveRelationshipModel(),
    useChainOfThought: true,
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
        legalCitations?: unknown;
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

      const legalCitations = Array.isArray(record.legalCitations)
        ? record.legalCitations
            .map((lc) => {
              if (!lc || typeof lc !== "object") return null;
              const r = lc as Record<string, unknown>;
              const title = typeof r.title === "string" ? r.title.trim() : "";
              const citation = typeof r.citation === "string" ? r.citation.trim() : "";
              const relevance = typeof r.relevance === "string" ? r.relevance.trim() : "";
              if (!title) return null;
              return { title, citation, relevance };
            })
            .filter((lc): lc is { title: string; citation: string; relevance: string } => Boolean(lc))
        : [];

      return {
        source_id: record.source_id.trim(),
        target_id: record.target_id.trim(),
        relationship,
        rationale: record.rationale.trim(),
        legalCitations: legalCitations.length > 0 ? legalCitations : undefined,
      } as RelationshipRecord;
    })
    .filter((item): item is RelationshipRecord => Boolean(item));
};

const generateProblemSpaceConclusionWithNvidia = async (
  input: ClarityConnectionInput[],
  datasetCtx?: DatasetContext,
  defendingSide?: DefendingSide,
  connections?: Array<{
    fromNodeId: string;
    toNodeId: string;
    fromFragmentId: string;
    toFragmentId: string;
    reason: string;
    strength: string;
  }>,
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
    ? `\n\nAPPLICABLE CANADIAN LAWS (cite by number [1], [2], etc.):\n${formatDatasetContext(datasetCtx)}`
    : "";

  let connectionsBlock = "";
  if (connections && connections.length > 0) {
    const nodeTitleMap = new Map(input.map((n) => [n.nodeId, n.nodeTitle]));
    const fragmentMap = new Map(
      input.flatMap((n) => n.fragments.map((f) => [f.id, { ...f, nodeTitle: n.nodeTitle }])),
    );

    const connectionLines = connections.map((c) => {
      const fromFrag = fragmentMap.get(c.fromFragmentId);
      const toFrag = fragmentMap.get(c.toFragmentId);
      const fromNode = nodeTitleMap.get(c.fromNodeId) ?? "Unknown";
      const toNode = nodeTitleMap.get(c.toNodeId) ?? "Unknown";
      const fromContent = fromFrag?.content.slice(0, 120) ?? "N/A";
      const toContent = toFrag?.content.slice(0, 120) ?? "N/A";
      const fromType = fromFrag?.type ?? "UNKNOWN";
      const toType = toFrag?.type ?? "UNKNOWN";
      return `[${c.strength}] ${fromNode} (${fromType}) -> ${toNode} (${toType}): ${c.reason.slice(0, 150)}
  Source: "${fromContent}"
  Target: "${toContent}"`;
    });

    connectionsBlock = `\n\nFRAGMENT CONNECTIONS FROM CLARITY GRAPH (${connections.length} connections):
These show how fragments across nodes are logically related. Use these connections to:
1. Identify which fragments support or contradict each other
2. Build arguments that leverage connected evidence
3. Find weaknesses where connected fragments create vulnerabilities

${connectionLines.join("\n\n")}`;
  }

  const isPlaintiff = defendingSide === "PLAINTIFF";

  const sideInstructions = isPlaintiff
    ? `You are analyzing this case from the PLAINTIFF/PROSECUTOR perspective.
The plaintiff is the party bringing the claim or complaint. They bear the burden of proof.
Your job is to find the STRONGEST path to victory for the plaintiff.

PLAINTIFF'S GOAL: Prove the case by establishing all required legal elements.
PLAINTIFF'S STRENGTHS: Look for evidence fragments that support each element of the claim.
PLAINTIFF'S RISKS: Identify gaps in evidence, missing elements, procedural bars, and statute of limitations issues.
PLAINTIFF'S STRATEGY: Build the strongest possible case using observations, evidence, and ideas.

When building "ourArguments": These are the PLAINTIFF's strongest arguments to prove the claim.
When building "opponentArguments": These are the DEFENDANT's best defenses and counterarguments.
When building "rebuttalStrategy": How the PLAINTIFF can counter the defendant's defenses.`
    : defendingSide === "DEFENDANT"
    ? `You are analyzing this case from the DEFENDANT's perspective.
The defendant is the party responding to the claim. They have the burden of raising defenses.
Your job is to find the STRONGEST defenses and ways to defeat the plaintiff's case.

DEFENDANT'S GOAL: Defeat the plaintiff's claim by raising defenses, challenging elements, and exploiting weaknesses.
DEFENDANT'S STRENGTHS: Look for missing elements, insufficient evidence, procedural defects, and applicable defenses.
DEFENDANT'S RISKS: Identify the plaintiff's strongest arguments and evidence that could prevail.
DEFENDANT'S STRATEGY: Challenge every element, raise affirmative defenses, and exploit gaps.

When building "ourArguments": These are the DEFENDANT's strongest defenses to defeat the claim.
When building "opponentArguments": These are the PLAINTIFF's best arguments to prove the claim.
When building "rebuttalStrategy": How the DEFENDANT can counter the plaintiff's arguments.`
    : `Analyze this case from a neutral perspective, considering both sides.

When building "ourArguments": Present the strongest arguments for the party you are analyzing.
When building "opponentArguments": Present the opposing party's best counterarguments.
When building "rebuttalStrategy": How to counter the opponent's arguments.`;

  const fragmentAnalysisInstructions = `For each fragment provided in the data:
- QUESTION fragments: Identify the legal elements that must be answered
- IDEA fragments: Evaluate whether they support or weaken the case
- OBSERVATION fragments: Use as factual evidence to support arguments
- CONSTRAINS fragments: Apply as limitations, defenses, or procedural bars
- CONCLUSION fragments: Assess strength and validity

Reference specific fragment types and content in your analysis.`;

  const text = await nvidiaChatCompletion({
    messages: [
      {
        role: "system",
        content: `You are a senior legal strategist. Analyze the case data and provide a comprehensive legal analysis.

${sideInstructions}

${datasetBlock}
${connectionsBlock}

ANALYSIS STEPS:
1. Review all fragments carefully - each type provides different legal information
2. Review the fragment connections above to understand how pieces of the case relate
3. Identify the key legal issues from QUESTION fragments
4. Use OBSERVATION fragments as factual support
5. Apply CONSTRAINS fragments as limitations or defenses
6. Reference applicable laws from the dataset
7. Use the fragment connections to build stronger, more interconnected arguments

IMPORTANT: You MUST return at least 2 "ourArguments" and 2 "opponentArguments". Even with limited data, construct arguments based on what the fragments and connections suggest about the case.

Return this JSON structure:
{
  "summary": "2-3 sentence overview from your side's perspective",
  "defendingSide": "${defendingSide ?? "PLAINTIFF"}",
  "ourArguments": [
    {"argument": "Strongest argument", "strength": "STRONG|MEDIUM|WEAK", "supportingAuthority": "Cite specific law or fragment", "keyEvidence": "Which fragment supports this"}
  ],
  "opponentArguments": [
    {"argument": "Opponent's best argument against you", "strength": "STRONG|MEDIUM|WEAK", "counterRebuttal": "How to counter it", "rebuttalAuthority": "Supporting law or precedent"}
  ],
  "rebuttalStrategy": ["Strategic advice for countering opponent"],
  "bestOutcomes": [
    {
      "outcome": "Best result from your side",
      "likelihood": "HIGH|MEDIUM|LOW",
      "reasoning": "Legal reasoning with citations",
      "requiredElements": ["Elements needed"],
      "supportingLaws": [{"title": "Law name", "citation": "Citation", "url": null, "relevance": "How it helps", "documentType": "CASE_LAW|LEGISLATION|REGULATION"}],
      "keyFactors": ["Favorable factors"],
      "risks": ["Risks"],
      "nextSteps": ["Next actions"]
    }
  ],
  "controllingAuthority": [{"citation": "Citation", "jurisdiction": "Jurisdiction", "weight": "binding|persuasive"}],
  "elementAnalysis": [{"element": "Legal element", "satisfied": true, "supportingFragments": [], "gaps": []}],
  "proceduralPosture": "Current status",
  "standardOfReview": "Standard applied",
  "confidence": "HIGH|MEDIUM|LOW",
  "basedOnQuestionCount": 0,
  "totalQuestionCount": 0
}

RULES:
- Generate 2-4 outcomes ranked best to worst
- Arguments MUST reference the fragments and connections provided
- Use fragment connections to identify supporting evidence chains and contradictions
- Even with few fragments, construct plausible legal arguments based on the case type
- Return ONLY valid JSON, no markdown or explanation`,
      },
      {
        role: "user",
        content: `Analyze this case from the ${isPlaintiff ? "PLAINTIFF" : "DEFENDANT"}'s perspective.

FRAGMENT DATA:
${JSON.stringify(payload, null, 2)}

Return ONLY valid JSON with all required fields.`,
      },
    ],
    maxTokens: 4096,
    temperature: 0.1,
    model: getActiveConclusionModel(),
    useChainOfThought: true,
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
    // Try to recover from markdown code blocks
  }

  const codeBlockMatch = trimmed.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
  if (codeBlockMatch) {
    try {
      const parsed = JSON.parse(codeBlockMatch[1].trim());
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch {
      // Continue to fallback
    }
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
    // Try to recover from markdown code blocks
  }

  const codeBlockMatch = trimmed.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
  if (codeBlockMatch) {
    try {
      const parsed = JSON.parse(codeBlockMatch[1].trim());
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      // Continue to fallback
    }
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
  defendingSide?: DefendingSide,
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
  const observations = allFragments.filter(
    (fragment) => fragment.type === "OBSERVATION",
  );
  const constraints = allFragments.filter(
    (fragment) => fragment.type === "CONSTRAINS",
  );
  const conclusions = allFragments.filter(
    (fragment) => fragment.type === "CONCLUSION",
  );
  const ideas = allFragments.filter(
    (fragment) => fragment.type === "IDEA",
  );

  if (questions.length === 0 && allFragments.length === 0) {
    return {
      summary:
        "There is not enough information yet to provide a meaningful legal analysis. Add fragments describing the legal issue, facts, and constraints.",
      bestOutcomes: [
        {
          outcome: "Awaiting sufficient case information",
          likelihood: "LOW",
          reasoning: "A meaningful analysis requires fragments describing the legal issue, relevant facts, and any constraints.",
          requiredElements: [],
          supportingLaws: [],
          keyFactors: [],
          risks: ["No case information provided"],
          nextSteps: [
            "Add QUESTION fragments describing the legal issues.",
            "Add OBSERVATION fragments with case facts.",
            "Add CONSTRAINS fragments for any legal limitations.",
          ],
        },
      ],
      confidence: "LOW",
      basedOnQuestionCount: 0,
      totalQuestionCount: 0,
    };
  }

  const isPlaintiff = defendingSide === "PLAINTIFF";
  const sideLabel = isPlaintiff ? "Plaintiff" : defendingSide === "DEFENDANT" ? "Defendant" : "your side";

  const basedOnQuestionCount = questions.length;
  const confidence: ProblemSpaceConclusion["confidence"] =
    basedOnQuestionCount >= 2 ? "MEDIUM" : "LOW";

  const summaryParts: string[] = [];
  if (questions.length > 0) {
    summaryParts.push(`The case involves ${questions.length} legal question(s): ${questions.slice(0, 2).map(q => q.content.slice(0, 60)).join("; ")}`);
  }
  if (observations.length > 0) {
    summaryParts.push(`There ${observations.length === 1 ? "is" : "are"} ${observations.length} factual observation(s) available`);
  }
  if (constraints.length > 0) {
    summaryParts.push(`with ${constraints.length} constraint(s) to consider`);
  }

  const summary = summaryParts.length > 0
    ? summaryParts.join(". ") + "."
    : `Based on ${allFragments.length} fragment(s), the following analysis is provided from the ${sideLabel}'s perspective.`;

  const ourArguments: ProblemSpaceConclusion["ourArguments"] = [];
  const opponentArguments: ProblemSpaceConclusion["opponentArguments"] = [];

  if (isPlaintiff) {
    questions.forEach((q) => {
      ourArguments.push({
        argument: `Establish the element: ${q.content.slice(0, 150)}`,
        strength: observations.length > 0 ? "MEDIUM" : "WEAK",
        keyEvidence: observations.length > 0 ? observations[0].content.slice(0, 100) : undefined,
      });
    });
    constraints.forEach((c) => {
      opponentArguments.push({
        argument: `Defendant may argue: ${c.content.slice(0, 150)}`,
        strength: "MEDIUM",
        counterRebuttal: `Challenge the applicability of this constraint to the specific facts of this case.`,
        rebuttalAuthority: undefined,
      });
    });
    if (opponentArguments.length === 0 && questions.length > 0) {
      opponentArguments.push({
        argument: "Defendant will challenge whether all legal elements are fully satisfied",
        strength: "MEDIUM",
        counterRebuttal: "Demonstrate that the available evidence, while limited, establishes a prima facie case",
        rebuttalAuthority: undefined,
      });
    }
  } else {
    questions.forEach((q) => {
      opponentArguments.push({
        argument: `Plaintiff must prove: ${q.content.slice(0, 150)}`,
        strength: "MEDIUM",
        counterRebuttal: observations.length > 0
          ? `Challenge whether the evidence (${observations[0].content.slice(0, 60)}...) is sufficient`
          : "Challenge sufficiency of evidence on this element",
        rebuttalAuthority: undefined,
      });
    });
    constraints.forEach((c) => {
      ourArguments.push({
        argument: `Defense based on constraint: ${c.content.slice(0, 150)}`,
        strength: "STRONG",
        keyEvidence: c.content.slice(0, 100),
        supportingAuthority: undefined,
      });
    });
    if (ourArguments.length === 0) {
      ourArguments.push({
        argument: "Challenge plaintiff's burden of proof on each element",
        strength: "MEDIUM",
        keyEvidence: observations.length > 0 ? `Factual disputes exist: ${observations[0].content.slice(0, 80)}` : undefined,
        supportingAuthority: undefined,
      });
    }
  }

  const bestOutcome = conclusions.length > 0
    ? conclusions[0].content.slice(0, 300)
    : ideas.length > 0
      ? ideas[0].content.slice(0, 300)
      : observations.length > 0
        ? observations[0].content.slice(0, 300)
        : questions.length > 0
          ? `Resolution of: ${questions[0].content.slice(0, 200)}`
          : `The ${sideLabel} should pursue the strongest available legal theory`;

  return {
    summary,
    defendingSide,
    ourArguments: ourArguments.length > 0 ? ourArguments : undefined,
    opponentArguments: opponentArguments.length > 0 ? opponentArguments : undefined,
    rebuttalStrategy: [
      "Strengthen your position by adding more specific factual fragments",
      "Add more IDEA fragments to develop your legal theories",
      "Re-run analysis after adding more evidence and observations",
    ],
    bestOutcomes: [
      {
        outcome: bestOutcome,
        likelihood: confidence === "MEDIUM" ? "MEDIUM" : "LOW",
        reasoning: `Based on ${basedOnQuestionCount} question(s), ${observations.length} observation(s), and ${constraints.length} constraint(s). This analysis is generated from available fragments. Add more evidence for a more detailed analysis.`,
        requiredElements: questions.map((q) => q.content.slice(0, 120)),
        supportingLaws: [],
        keyFactors: [
          ...observations.slice(0, 3).map((o) => o.content.slice(0, 120)),
          ...conclusions.slice(0, 2).map((c) => c.content.slice(0, 120)),
        ],
        risks: [
          ...constraints.slice(0, 3).map((c) => c.content.slice(0, 120)),
          ...(constraints.length === 0 ? ["No constraints identified - add constraint fragments"] : []),
        ],
        nextSteps: [
          "Add more observation and evidence fragments",
          "Add IDEA fragments for stronger arguments",
          "Re-run analysis after updating fragments",
        ],
      },
    ],
    confidence,
    basedOnQuestionCount,
    totalQuestionCount: questions.length,
    controllingAuthority: [],
    elementAnalysis: questions.map((q) => ({
          element: q.content.slice(0, 150),
          satisfied: observations.length > 0,
          supportingFragments: observations.slice(0, 2).map((o) => o.content.slice(0, 80)),
          gaps: observations.length === 0 ? ["No supporting evidence provided"] : [],
        })),
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

export const analyzeFragmentRelationships = async (
  fragments: Array<{
    id: string;
    type: FragmentType;
    content: string;
  }>,
  options?: AnalyzeRelationshipOptions,
): Promise<RelationshipRecord[]> => {
  if (fragments.length < 2) {
    return [];
  }

  let datasetCtx: DatasetContext | undefined;

  if (options?.includeDatasetContext !== false) {
    await ensureDatasetFresh();
    datasetCtx = await searchCanLIIDataset(fragments);
  }

  return analyzeFragmentRelationshipsWithNvidia(fragments, datasetCtx, options);
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
      {
        includeDatasetContext: false,
        maxFragmentContentChars: 350,
        maxOutputTokens: 2048,
      },
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
          legalCitations: record.legalCitations,
        } as ClarityConnectionSuggestion;
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
  connections?: Array<{
    fromNodeId: string;
    toNodeId: string;
    fromFragmentId: string;
    toFragmentId: string;
    reason: string;
    strength: string;
  }>,
): Promise<ProblemSpaceConclusion> => {
  if (input.length === 0) {
    return fallbackProblemSpaceConclusion(input, defendingSide);
  }

  await ensureDatasetFresh();
  const allFragments = input.flatMap((node) =>
    node.fragments.map((f) => ({ content: f.content })),
  );
  const datasetCtx = await searchCanLIIDataset(allFragments);

  try {
    return await generateProblemSpaceConclusionWithNvidia(input, datasetCtx, defendingSide, connections);
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error(`[AI_CONCLUSION_FALLBACK] ${compactErrorMessage(message)}`);
    }
    return fallbackProblemSpaceConclusion(input, defendingSide);
  }
};

// ---------------------------------------------------------------------------
// Fragment Suggestions
// ---------------------------------------------------------------------------

export type FragmentSuggestion = {
  nodeId: string;
  nodeTitle: string;
  type: FragmentType;
  content: string;
  reason: string;
};

const generateFragmentSuggestionsWithNvidia = async (
  input: ClarityConnectionInput[],
): Promise<FragmentSuggestion[]> => {
  const payload = input
    .map((node) => ({
      nodeId: node.nodeId,
      nodeTitle: node.nodeTitle,
      fragments: node.fragments.map((f) => ({
        id: f.id,
        type: f.type,
        content: f.content.length > 200 ? f.content.slice(0, 200) + "..." : f.content,
      })),
    }))
    .filter((node) => node.fragments.length > 0);

  const text = await nvidiaChatCompletion({
    messages: [
      {
        role: "system",
        content: `You are a legal case analyst. Given existing case fragments, suggest 3-5 NEW fragments that would strengthen the analysis.

Fragment types: QUESTION, IDEA, OBSERVATION, CONSTRAINS, CONCLUSION.

Return ONLY a JSON array:
[{"nodeId":"existing node id","type":"TYPE","content":"suggested text","reason":"why this helps"}]

Rules: Only suggest types listed below per node. Do not duplicate existing content.`,
      },
      {
        role: "user",
        content: `Nodes and fragments:\n${JSON.stringify(payload, null, 0)}\n\nSuggest 3-5 new fragments to strengthen this case.`,
      },
    ],
    maxTokens: 768,
    temperature: 0,
    model: getActiveRelationshipModel(),
    useChainOfThought: true,
  });

  if (process.env.NODE_ENV !== "production") {
    console.log("[AI_SUGGESTIONS_RAW]", text.slice(0, 500));
  }

  const parsed = extractJsonArray(text);

  if (!parsed || !Array.isArray(parsed)) {
    return [];
  }

  const validTypes = new Set<string>(["QUESTION", "IDEA", "OBSERVATION", "CONSTRAINS", "CONCLUSION"]);
  const nodeIds = new Set(input.map((n) => n.nodeId));

  return parsed
    .filter((s): s is Record<string, unknown> => typeof s === "object" && s !== null)
    .filter((s) => {
      const nodeId = s.nodeId as string | undefined;
      const type = s.type as string | undefined;
      const content = s.content as string | undefined;
      const reason = s.reason as string | undefined;
      return Boolean(nodeId && type && content && reason && nodeIds.has(nodeId) && validTypes.has(type));
    })
    .map((s) => ({
      nodeId: s.nodeId as string,
      nodeTitle: input.find((n) => n.nodeId === (s.nodeId as string))?.nodeTitle ?? "",
      type: s.type as FragmentType,
      content: (s.content as string).trim(),
      reason: (s.reason as string).trim(),
    }))
    .slice(0, 6);
};

const fallbackFragmentSuggestions = (
  input: ClarityConnectionInput[],
): FragmentSuggestion[] => {
  const suggestions: FragmentSuggestion[] = [];

  for (const node of input) {
    const types = node.fragments.map((f) => f.type);
    const fragCount = node.fragments.length;
    const hasQuestion = types.includes("QUESTION");
    const hasIdea = types.includes("IDEA");
    const hasObservation = types.includes("OBSERVATION");
    const hasConstraint = types.includes("CONSTRAINS");
    const hasConclusion = types.includes("CONCLUSION");

    // Missing type suggestions
    if (!hasQuestion) {
      suggestions.push({
        nodeId: node.nodeId,
        nodeTitle: node.nodeTitle,
        type: "QUESTION",
        content: `What are the key legal issues regarding ${node.nodeTitle}?`,
        reason: "A clear question focuses the analysis and guides evidence gathering",
      });
    }

    if (!hasObservation && fragCount > 0) {
      suggestions.push({
        nodeId: node.nodeId,
        nodeTitle: node.nodeTitle,
        type: "OBSERVATION",
        content: `What facts or evidence support or relate to "${node.nodeTitle}"?`,
        reason: "Observations provide the factual foundation for legal arguments",
      });
    }

    if (!hasIdea && fragCount >= 1) {
      suggestions.push({
        nodeId: node.nodeId,
        nodeTitle: node.nodeTitle,
        type: "IDEA",
        content: `Consider potential legal theories or arguments that apply to ${node.nodeTitle}`,
        reason: "Ideas help develop legal theories before forming conclusions",
      });
    }

    if (!hasConstraint && fragCount >= 2) {
      suggestions.push({
        nodeId: node.nodeId,
        nodeTitle: node.nodeTitle,
        type: "CONSTRAINS",
        content: `What limitations, risks, or counterarguments exist for ${node.nodeTitle}?`,
        reason: "Constraints identify weaknesses that need to be addressed",
      });
    }

    if (!hasConclusion && fragCount >= 3) {
      suggestions.push({
        nodeId: node.nodeId,
        nodeTitle: node.nodeTitle,
        type: "CONCLUSION",
        content: `Based on the available evidence, what can be determined about ${node.nodeTitle}?`,
        reason: "Conclusions synthesize findings into actionable determinations",
      });
    }

    // Strengthening suggestions — add more depth even when types are covered
    if (fragCount > 0 && fragCount < 3) {
      suggestions.push({
        nodeId: node.nodeId,
        nodeTitle: node.nodeTitle,
        type: "IDEA",
        content: `What alternative interpretations or theories exist for ${node.nodeTitle}?`,
        reason: "Multiple theories strengthen analysis by showing thorough consideration",
      });
    }

    if (fragCount >= 2 && hasObservation) {
      suggestions.push({
        nodeId: node.nodeId,
        nodeTitle: node.nodeTitle,
        type: "OBSERVATION",
        content: `What additional evidence or facts would strengthen the position on ${node.nodeTitle}?`,
        reason: "More evidence makes arguments more persuasive",
      });
    }

    if (fragCount >= 3 && hasConstraint) {
      suggestions.push({
        nodeId: node.nodeId,
        nodeTitle: node.nodeTitle,
        type: "IDEA",
        content: `How could the constraints facing ${node.nodeTitle} be addressed or mitigated?`,
        reason: "Addressing constraints proactively strengthens the overall position",
      });
    }
  }

  return suggestions.slice(0, 5);
};

export const generateFragmentSuggestions = async (
  input: ClarityConnectionInput[],
): Promise<FragmentSuggestion[]> => {
  if (input.length === 0) {
    return [];
  }

  return fallbackFragmentSuggestions(input);
};
