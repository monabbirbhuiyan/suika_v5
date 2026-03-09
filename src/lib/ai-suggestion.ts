export type SuggestionFragmentType =
  | "QUESTION"
  | "IDEA"
  | "OBSERVATION"
  | "CONSTRAINS"
  | "CONCLUSION";

export type AiSuggestionKind = "MISSING_QUESTION" | "EVIDENCE_GAP";

export type AiSuggestionReasonPayload = {
  kind: AiSuggestionKind;
  summary: string;
  focus: {
    nodeTitle: string;
    fragmentId: string;
    fragmentType: SuggestionFragmentType;
    fragmentContent: string;
  };
  recommendation: string;
  rationale: string;
};

export const serializeAiSuggestionReason = (
  payload: AiSuggestionReasonPayload,
): string => {
  return JSON.stringify(payload);
};

export const parseAiSuggestionReason = (
  reason: string,
): AiSuggestionReasonPayload | null => {
  try {
    const parsed = JSON.parse(reason) as Partial<AiSuggestionReasonPayload>;

    if (!parsed || typeof parsed !== "object") {
      return null;
    }

    const summary = parsed.summary;
    const kind = parsed.kind;
    const focus = parsed.focus;
    const recommendation = parsed.recommendation;
    const rationale = parsed.rationale;

    if (
      (kind !== "MISSING_QUESTION" && kind !== "EVIDENCE_GAP") ||
      typeof summary !== "string" ||
      !focus ||
      typeof focus.nodeTitle !== "string" ||
      typeof focus.fragmentId !== "string" ||
      typeof focus.fragmentType !== "string" ||
      typeof focus.fragmentContent !== "string" ||
      typeof recommendation !== "string" ||
      typeof rationale !== "string"
    ) {
      return null;
    }

    if (
      focus.fragmentType !== "QUESTION" &&
      focus.fragmentType !== "IDEA" &&
      focus.fragmentType !== "OBSERVATION" &&
      focus.fragmentType !== "CONSTRAINS" &&
      focus.fragmentType !== "CONCLUSION"
    ) {
      return null;
    }

    return {
      kind,
      summary,
      focus: {
        nodeTitle: focus.nodeTitle,
        fragmentId: focus.fragmentId,
        fragmentType: focus.fragmentType,
        fragmentContent: focus.fragmentContent,
      },
      recommendation,
      rationale,
    };
  } catch {
    return null;
  }
};
