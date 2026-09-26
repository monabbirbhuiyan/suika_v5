"use client";

import React, { useEffect, useState, use } from "react";
import ProblemSpaceContainer from "@/components/problem-space/problem-space-container";

type Props = {
  params: Promise<{
    userId: string;
  }>;
};

export default function ProblemSpacePage({ params }: Props) {
  const resolvedParams = use(params);
  const userId = resolvedParams.userId;

  const [problemSpaces, setProblemSpaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUserSpaces() {
      try {
        setLoading(true);
        const res = await fetch(
          `http://127.0.0.1:8000/api/problem-spaces/user/${userId}`,
        );
        if (!res.ok) {
          setProblemSpaces([]);
          return;
        }
        const data = await res.json();
        setProblemSpaces(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to load problem spaces from FastAPI:", err);
        setProblemSpaces([]);
      } finally {
        setLoading(false);
      }
    }

    if (userId) {
      fetchUserSpaces();
    }
  }, [userId]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <ProblemSpaceContainer problemSpace={problemSpaces} />
    </div>
  );
}
