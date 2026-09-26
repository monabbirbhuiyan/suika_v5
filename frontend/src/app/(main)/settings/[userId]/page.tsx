"use client";

import React, { useEffect, useState } from "react";
import SettingsView from "@/components/settings/settings-view";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      try {
        setLoading(true);
        const res = await fetch(
          "http://127.0.0.1:8000/api/problem-spaces/current-user",
        );

        if (!res.ok) {
          router.replace("/sign-in");
          return;
        }

        const data = await res.json();
        setUser(data);
      } catch (err) {
        console.error("FastAPI Settings user fetch failed:", err);
        router.replace("/sign-in");
      } finally {
        setLoading(false);
      }
    }

    fetchUser();
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="max-w-6xl mx-auto rounded-2xl border border-(--brand-green)/15 bg-white/85 p-5 md:p-6">
      <SettingsView user={user} />
    </div>
  );
}
