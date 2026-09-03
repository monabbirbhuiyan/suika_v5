"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { TrendingUp, Shield, Sword } from "lucide-react";
import { Button } from "../ui/button";

type Props = {
  problemSpaceId: string;
  userId: string;
};

const ConcludeProblemSpacePanel = ({ problemSpaceId, userId }: Props) => {
  const router = useRouter();
  const [defendingSide, setDefendingSide] = React.useState<
    "PLAINTIFF" | "DEFENDANT"
  >("PLAINTIFF");

  const navigateToAnalysis = () => {
    router.push(
      `/problem-spaces/${userId}/${problemSpaceId}/analysis?side=${defendingSide}`,
    );
  };

  return (
    <div className="mx-6 my-3 px-4 py-3 flex items-center justify-between rounded-xl bg-white border border-stone-200/70 border-l-[3px] border-l-[#12753e] shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] transition-all duration-200">
      <div className="flex items-center gap-3">
        <span className="text-[12px] font-medium text-stone-500">
          Case Analysis
        </span>
        <div className="flex items-center rounded-lg bg-white border border-stone-200/60 p-0.5 shadow-sm">
          <button
            type="button"
            onClick={() => setDefendingSide("PLAINTIFF")}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-[11px] font-semibold transition-all duration-150 ${
              defendingSide === "PLAINTIFF"
                ? "bg-[#12753e] text-white shadow-sm"
                : "text-stone-400 hover:text-stone-600"
            }`}
          >
            <Sword className="h-3 w-3" />
            Plaintiff
          </button>
          <button
            type="button"
            onClick={() => setDefendingSide("DEFENDANT")}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-[11px] font-semibold transition-all duration-150 ${
              defendingSide === "DEFENDANT"
                ? "bg-[#12753e] text-white shadow-sm"
                : "text-stone-400 hover:text-stone-600"
            }`}
          >
            <Shield className="h-3 w-3" />
            Defendant
          </button>
        </div>
      </div>
      <Button
        type="button"
        onClick={navigateToAnalysis}
        size="sm"
        className="h-8 text-[12px] bg-[#12753e] hover:bg-[#0d582f] text-white rounded-lg"
      >
        <TrendingUp className="h-3.5 w-3.5 mr-1.5" />
        Analyze Case
      </Button>
    </div>
  );
};

export default ConcludeProblemSpacePanel;
