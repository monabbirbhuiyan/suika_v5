"use client";

import React, { useEffect, useState, use } from "react";
import DatasetsClient from "@/components/datasets/datasets-client";
import { useRouter } from "next/navigation";

type Props = {
  params: Promise<{ userId: string }>;
};

export default function DatasetsPage({ params }: Props) {
  const router = useRouter();
  const resolvedParams = use(params);
  const userId = resolvedParams.userId;

  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    async function verifyUser() {
      try {
        setLoading(true);
        const res = await fetch(
          "http://127.0.0.1:8000/api/problem-spaces/current-user",
        );

        if (!res.ok) {
          router.replace("/sign-in");
          return;
        }

        const user = await res.json();

        if (user.id !== userId) {
          setAuthorized(false);
        } else {
          setAuthorized(true);
        }
      } catch (err) {
        console.error("Failed to verify user from FastAPI:", err);
        setAuthorized(false);
      } finally {
        setLoading(false);
      }
    }

    if (userId) {
      verifyUser();
    }
  }, [userId, router]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (authorized === false) {
    return (
      <div className="mx-auto w-full max-w-350 space-y-4 px-4 py-4 md:px-5 md:py-5 text-brand-ink">
        <div className="rounded-xl border border-(--brand-red)/20 bg-brand-red-100/35 p-6 text-center">
          <p className="text-brand-red font-medium">Unauthorized</p>
          <p className="text-sm text-[#5f7a70] mt-2">
            You don't have permission to view this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-350 space-y-4 px-4 py-4 md:px-5 md:py-5 text-brand-ink">
      <DatasetsClient userId={userId} />
    </div>
  );
}
