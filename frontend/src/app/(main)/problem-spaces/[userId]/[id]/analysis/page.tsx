"use client";

import React, { useEffect, useState, use } from "react";
import AnalysisPageClient from "@/components/problem-space/analysis-page-client";
import { useRouter } from "next/navigation";

type Props = {
  params: Promise<{
    userId: string;
    id: string;
  }>;
};

export default function AnalysisPage({ params }: Props) {
  const router = useRouter();
  const resolvedParams = use(params);
  const { userId, id } = resolvedParams;

  const [problemSpace, setProblemSpace] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

        const [userRes, spaceRes] = await Promise.all([
          fetch("http://127.0.0.1:8000/api/problem-spaces/current-user"),
          fetch(`http://127.0.0.1:8000/api/problem-spaces/${id}`),
        ]);

        if (!userRes.ok) {
          router.replace("/sign-in");
          return;
        }

        if (!spaceRes.ok) {
          setError("Problem space not found.");
          return;
        }

        const spaceData = await spaceRes.json();
        setProblemSpace(spaceData);
      } catch (err) {
        console.error("FastAPI Analysis page data load failed:", err);
        setError("Failed to load problem space from backend.");
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      loadData();
    }
  }, [id, router]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error || !problemSpace) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        {error || "Problem space not found."}
      </div>
    );
  }

  return (
    <AnalysisPageClient
      problemSpaceId={problemSpace.id}
      userId={userId}
      problemSpaceTitle={problemSpace.title}
    />
  );
}
