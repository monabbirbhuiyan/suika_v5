"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DatasetsControllerPage() {
  const router = useRouter();

  useEffect(() => {
    async function resolveUser() {
      try {
        const res = await fetch(
          "http://127.0.0.1:8000/api/problem-spaces/current-user",
        );
        if (!res.ok) {
          router.replace("/sign-in");
          return;
        }
        const user = await res.json();
        router.replace(`/datasets/${user.id}`);
      } catch (err) {
        console.error("FastAPI User Resolution Failed:", err);
        router.replace("/sign-in");
      }
    }

    resolveUser();
  }, [router]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
}
