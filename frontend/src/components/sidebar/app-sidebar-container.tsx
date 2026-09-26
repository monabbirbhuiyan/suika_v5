// src/components/sidebar/app-sidebar-container.tsx
"use client";

import React, { useEffect, useState } from "react";
import AppSidebar from "./app-sidebar";

export default function AppSidebarContainer() {
  const [userId, setUserId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUserFromBackend() {
      try {
        const res = await fetch(
          "http://127.0.0.1:8000/api/problem-spaces/current-user",
        );
        if (res.ok) {
          const data = await res.json();
          setUserId(data.id);
        }
      } catch (err) {
        console.error("Failed to fetch user from Python backend:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchUserFromBackend();
  }, []);

  if (loading) {
    return <div className="w-16 h-screen border-r bg-sidebar" />;
  }

  return <AppSidebar userId={userId} />;
}
