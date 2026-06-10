export type SuggestionFragmentType =
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

export type AiSuggestionKind =
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

    const validKinds: AiSuggestionKind[] = [
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

    const validFragmentTypes: SuggestionFragmentType[] = [
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

    if (
      !validKinds.includes(kind as AiSuggestionKind) ||
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

    if (!validFragmentTypes.includes(focus.fragmentType as SuggestionFragmentType)) {
      return null;
    }

    const validatedKind = kind as AiSuggestionKind;

    return {
      kind: validatedKind,
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
