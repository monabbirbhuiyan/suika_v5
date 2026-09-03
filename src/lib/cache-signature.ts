import { createHash } from "node:crypto";

type SignatureInput = Array<{
  nodeId: string;
  nodeTitle: string;
  fragments: Array<{ id: string; type: string; content: string }>;
}>;

export const stableInputSignature = (input: SignatureInput): string => {
  const normalized = [...input]
    .map((node) => ({
      nodeId: node.nodeId,
      nodeTitle: node.nodeTitle,
      fragments: [...node.fragments]
        .map((fragment) => ({
          id: fragment.id,
          type: fragment.type,
          content: fragment.content.trim(),
        }))
        .sort((a, b) => a.id.localeCompare(b.id)),
    }))
    .sort((a, b) => a.nodeId.localeCompare(b.nodeId));

  return createHash("sha256").update(JSON.stringify(normalized)).digest("hex");
};
