"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Upload,
  FileText,
  Loader2,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { createNodesFromCaseStudy } from "@/action/fragments";

type Props = {
  problemSpaceId: string;
};

const CaseStudyForm = ({ problemSpaceId }: Props) => {
  const router = useRouter();
  const [minimized, setMinimized] = React.useState(false);
  const [caseStudyText, setCaseStudyText] = React.useState("");
  const [fileName, setFileName] = React.useState<string | null>(null);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [isParsing, setIsParsing] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const parseFile = async (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase();

    if (ext === "txt") {
      return await file.text();
    }

    if (ext === "docx") {
      const mammoth = await import("mammoth");
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      return result.value;
    }

    if (ext === "pdf") {
      const { PDFParse } = await import("pdf-parse");
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const parser = new PDFParse({ data: uint8Array });
      try {
        const result = await parser.getText();
        return result.text;
      } finally {
        await parser.destroy();
      }
    }

    throw new Error(`Unsupported file type: .${ext}`);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["txt", "docx", "pdf"].includes(ext ?? "")) {
      toast.error("Please upload a .txt, .docx, or .pdf file");
      return;
    }

    setIsParsing(true);
    setFileName(file.name);

    try {
      const text = await parseFile(file);
      setCaseStudyText(text);
      toast.success(`Parsed ${file.name}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to parse file";
      toast.error(message);
      setFileName(null);
    } finally {
      setIsParsing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleSubmit = async () => {
    const text = caseStudyText.trim();
    if (text.length < 50) {
      toast.error("Case study must be at least 50 characters");
      return;
    }

    setIsProcessing(true);

    try {
      const response = await fetch("/api/ai/parse-case-study", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemSpaceId,
          caseStudyText: text,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to parse case study");
      }

      const nodes = data.nodes;
      if (!nodes || nodes.length === 0) {
        throw new Error("No nodes were generated from the case study");
      }

      const result = await createNodesFromCaseStudy(problemSpaceId, nodes);

      if (!result) {
        throw new Error("Failed to save nodes to database");
      }

      toast.success(
        `Created ${result.nodeCount} node${result.nodeCount !== 1 ? "s" : ""} from case study`,
      );
      setCaseStudyText("");
      setFileName(null);
      setMinimized(true);
      router.refresh();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to process case study";
      toast.error(message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="rounded-xl border border-stone-200/70 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] mb-4">
      {/* Header bar — always visible */}
      <button
        onClick={() => setMinimized((m) => !m)}
        className="w-full px-4 py-2.5 flex items-center justify-between group cursor-pointer select-none"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[#12753e]" />
          <span className="text-[13px] font-semibold text-stone-800">
            Case Study Import
          </span>
          {fileName && !minimized && (
            <span className="text-[11px] text-stone-400 ml-1">
              — {fileName}
            </span>
          )}
          {isProcessing && (
            <span className="flex items-center gap-1 text-[11px] text-[#12753e] ml-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              Analyzing...
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {minimized ? (
            <ChevronDown className="h-4 w-4 text-stone-300 group-hover:text-stone-500 transition-colors" />
          ) : (
            <ChevronUp className="h-4 w-4 text-stone-300 group-hover:text-stone-500 transition-colors" />
          )}
        </div>
      </button>

      {/* Expanded body */}
      {!minimized && (
        <div className="px-4 pb-4 space-y-3 border-t border-stone-100 pt-3">
          <p className="text-[12px] text-stone-400">
            Paste your case study or upload a document. AI will analyze and
            create nodes with fragments automatically.
          </p>

          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.docx,.pdf"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing || isParsing}
              className="w-full flex items-center justify-center gap-2 rounded-lg border border-dashed border-stone-200 bg-stone-50/30 py-3 text-[12px] text-stone-400 hover:border-[#12753e]/30 hover:bg-[#dff3e7]/30 hover:text-[#12753e] transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isParsing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Parsing document...
                </>
              ) : fileName ? (
                <>
                  <FileText className="h-4 w-4" />
                  {fileName}
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Upload .txt, .docx, or .pdf
                </>
              )}
            </button>
          </div>

          <Textarea
            value={caseStudyText}
            onChange={(e) => setCaseStudyText(e.target.value)}
            placeholder="Paste your case study, legal brief, or fact summary here..."
            rows={8}
            disabled={isProcessing}
            className="text-[13px] resize-none border-stone-200 focus-visible:ring-stone-300 placeholder:text-stone-300"
          />

          <div className="flex items-center justify-between">
            <span className="text-[11px] text-stone-300">
              {caseStudyText.length > 0
                ? `${caseStudyText.split(/\s+/).filter(Boolean).length} words`
                : "Min 50 characters"}
            </span>
            <Button
              onClick={handleSubmit}
              disabled={isProcessing || caseStudyText.trim().length < 50}
              className="h-8 px-4 text-[12px] bg-[#12753e] hover:bg-[#0d582f] text-white rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                  Analyze with AI
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CaseStudyForm;
