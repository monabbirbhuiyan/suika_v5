"use client";

import React, { useEffect, useState, use } from "react";
import ProblemSpaceIdContainer from "@/components/problem-space/problem-space-id-container";

type Props = {
  params: Promise<{
    userId: string;
    id: string;
  }>;
};

export default function ProblemSpaceIdPage({ params }: Props) {
  const resolvedParams = use(params);
  const { userId, id } = resolvedParams;

  const [space, setSpace] = useState<any | null>(null);
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSpaceAndUser() {
      try {
        setLoading(true);

        const [userRes, spaceRes] = await Promise.all([
          fetch("http://127.0.0.1:8000/api/problem-spaces/current-user"),
          fetch(`http://127.0.0.1:8000/api/problem-spaces/${id}`),
        ]);

        if (!userRes.ok) {
          setError("Please sign in to continue.");
          return;
        }

        if (!spaceRes.ok) {
          setError("Problem space not found.");
          return;
        }

        const userData = await userRes.json();
        const spaceData = await spaceRes.json();

        setCurrentUser(userData);
        setSpace(spaceData);
      } catch (err) {
        console.error("FastAPI Canvas Data Fetch Failed:", err);
        setError("Failed to load problem space from backend.");
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      loadSpaceAndUser();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error || !space) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        {error || "Problem space not found."}
      </div>
    );
  }

  return (
    <div>
      <ProblemSpaceIdContainer user={currentUser} problemSpace={space} />
    </div>
  );
}
