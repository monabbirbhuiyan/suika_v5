import "dotenv/config";

import {
  analyzeFragmentRelationships,
  chatWithGroq,
  decideProblemSpaceClarityProgress,
  generateClarityGraphConnections,
  generateProblemSpaceConclusion,
  generateSuikaMotivationalQuote,
  generateSuikaWeavingSuggestions,
} from "../src/lib/ai";

const provider = (process.env.AI_PROVIDER ?? "nvidia").toLowerCase();

const clarityInput = [
  {
    nodeId: "node-1",
    nodeTitle: "Retention",
    fragments: [
      {
        id: "f-1",
        type: "QUESTION" as const,
        content: "Why are week-1 users not returning after onboarding?",
      },
      {
        id: "f-2",
        type: "OBSERVATION" as const,
        content: "Activation dropped by 18% after the redesign.",
      },
      {
        id: "f-3",
        type: "CONSTRAINS" as const,
        content: "We cannot increase paid ad spend this quarter.",
      },
    ],
  },
  {
    nodeId: "node-2",
    nodeTitle: "Onboarding",
    fragments: [
      {
        id: "f-4",
        type: "IDEA" as const,
        content: "Introduce a guided setup checklist for first-session users.",
      },
      {
        id: "f-5",
        type: "QUESTION" as const,
        content: "Which first action best predicts user retention?",
      },
      {
        id: "f-6",
        type: "CONCLUSION" as const,
        content:
          "We should simplify the first-time setup path before adding features.",
      },
    ],
  },
] satisfies Parameters<typeof generateClarityGraphConnections>[0];

const weavingInput = clarityInput.map((node) => ({
  title: node.nodeTitle,
  fragments: node.fragments,
}));

const flatRelationshipInput = clarityInput.flatMap((node) =>
  node.fragments.map((fragment) => ({
    id: fragment.id,
    type: fragment.type,
    content: fragment.content,
  })),
);

type TestResult = {
  name: string;
  ok: boolean;
  detail: string;
};

const tests: Array<() => Promise<TestResult>> = [
  async () => {
    const reply = await chatWithGroq({
      messages: [{ role: "user", content: "Reply with exactly: ok" }],
      maxTokens: 16,
      temperature: 0,
    });

    return {
      name: "chat",
      ok: reply.trim().length > 0,
      detail: `reply=${JSON.stringify(reply.slice(0, 120))}`,
    };
  },
  async () => {
    const quote = await generateSuikaMotivationalQuote();
    return {
      name: "motivational-quote",
      ok: quote.quote.trim().length > 0,
      detail: `source=${quote.source}, quote=${JSON.stringify(quote.quote.slice(0, 120))}`,
    };
  },
  async () => {
    const suggestions = await generateSuikaWeavingSuggestions(weavingInput);
    return {
      name: "weaving-suggestions",
      ok: Array.isArray(suggestions),
      detail: `count=${suggestions.length}`,
    };
  },
  async () => {
    const relationships = await analyzeFragmentRelationships(
      flatRelationshipInput,
    );
    return {
      name: "fragment-relationships",
      ok: Array.isArray(relationships),
      detail: `count=${relationships.length}`,
    };
  },
  async () => {
    const connections = await generateClarityGraphConnections(clarityInput);
    return {
      name: "clarity-connections",
      ok: Array.isArray(connections),
      detail: `count=${connections.length}`,
    };
  },
  async () => {
    const progress = await decideProblemSpaceClarityProgress(clarityInput);
    return {
      name: "clarity-progress",
      ok: Number.isFinite(progress) && progress >= 0 && progress <= 100,
      detail: `progress=${progress}`,
    };
  },
  async () => {
    const conclusion = await generateProblemSpaceConclusion(clarityInput);
    return {
      name: "problem-space-conclusion",
      ok:
        conclusion.conclusion.trim().length > 0 &&
        conclusion.why.trim().length > 0,
      detail: `confidence=${conclusion.confidence}, basedOnQuestionCount=${conclusion.basedOnQuestionCount}`,
    };
  },
];

const main = async () => {
  console.log(`[AI_TEST] provider=${provider}`);

  const results: TestResult[] = [];

  for (const run of tests) {
    try {
      const result = await run();
      results.push(result);
      console.log(
        `[AI_TEST] ${result.ok ? "PASS" : "FAIL"} ${result.name} :: ${result.detail}`,
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown execution error";
      const result: TestResult = {
        name: "unknown",
        ok: false,
        detail: message,
      };
      results.push(result);
      console.log(`[AI_TEST] FAIL ${result.name} :: ${result.detail}`);
    }
  }

  const passed = results.filter((result) => result.ok).length;
  const failed = results.length - passed;

  console.log(`[AI_TEST] summary passed=${passed} failed=${failed}`);

  if (failed > 0) {
    process.exitCode = 1;
  }
};

main().catch((error) => {
  const message = error instanceof Error ? error.message : "Unknown error";
  console.error(`[AI_TEST] Fatal: ${message}`);
  process.exit(1);
});
