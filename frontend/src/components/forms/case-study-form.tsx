"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  FileText,
  Loader2,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

import { toast } from "@/components/ui/toast";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";

type Props = {
  problemSpaceId: string;
};

const CaseStudyForm = ({ problemSpaceId }: Props) => {
  const router = useRouter();
  const [minimized, setMinimized] = useState(false);
  const [caseStudyText, setCaseStudyText] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["txt", "docx", "pdf"].includes(ext ?? "")) {
      toast.add({
        type: "error",
        description: "Please upload a .txt, .docx, or .pdf file.",
        priority: "high",
      });
      return;
    }

    setIsParsing(true);
    setFileName(file.name);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("http://127.0.0.1:8000/api/ai/parse-document", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(
          errData.detail || "Failed to parse document on backend",
        );
      }

      const data = await res.json();
      setCaseStudyText(data.text);

      toast.add({
        type: "success",
        description: `Parsed ${file.name} successfully.`,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to parse file";
      toast.add({ type: "error", description: message, priority: "high" });
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
      toast.add({
        type: "error",
        description: "Case study must be at least 50 characters.",
        priority: "high",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Direct call to FastAPI's unified neuro-symbolic pipeline
      const res = await fetch(
        "http://127.0.0.1:8000/api/ai/process-case-study",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            problem_space_id: problemSpaceId,
            document_text: text,
            target_claim: "claim_is_timely",
          }),
        },
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Failed to process case study with AI");
      }

      const count = data.fragments_count || 0;
      const conflictMsg = data.verification?.conflict_detected
        ? " Contradiction core detected in Z3 solver."
        : " Logical consistency verified.";

      toast.add({
        type: "success",
        description: `Generated and persisted ${count} fragments.${conflictMsg}`,
      });

      setCaseStudyText("");
      setFileName(null);
      setMinimized(true);
      router.refresh();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to process case study";
      toast.add({ type: "error", description: message, priority: "high" });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="rounded-xl border border-stone-200/70 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] mb-4">
      {/* Header bar */}
      <button
        type="button"
        onClick={() => setMinimized((m) => !m)}
        className="w-full px-4 py-2.5 flex items-center justify-between group cursor-pointer select-none"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[#12753e]" />
          <span className="text-[13px] font-semibold text-stone-800">
            Case Study Import & Z3 Verifier
          </span>
          {fileName && !minimized && (
            <span className="text-[11px] text-stone-400 ml-1">
              — {fileName}
            </span>
          )}
          {isProcessing && (
            <span className="flex items-center gap-1 text-[11px] text-[#12753e] ml-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              Verifying logic with Z3...
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
            Paste your case brief or fact summary. GLM-5.3 extracts the
            5-fragment schema, and Z3 computes minimal unsatisfiable cores
            directly on the backend.
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
              type="button"
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
            placeholder="Paste fact patterns, limitation dates, or legal rules here..."
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
              type="button"
              onClick={handleSubmit}
              disabled={isProcessing || caseStudyText.trim().length < 50}
              className="h-8 px-4 text-[12px] bg-[#12753e] hover:bg-[#0d582f] text-white rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  Running Solver...
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                  Run SMT Verifier
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
