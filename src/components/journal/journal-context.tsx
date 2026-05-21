"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { JournalEntry, readJournalEntries } from "@/lib/journal";

type JournalContextType = {
  entries: JournalEntry[];
  loading: boolean;
  refreshEntries: () => Promise<void>;
};

const JournalContext = createContext<JournalContextType | undefined>(undefined);

export const JournalProvider = ({
  children,
  userId,
}: {
  children: React.ReactNode;
  userId: string;
}) => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshEntries = async () => {
    setLoading(true);
    try {
      const next = await readJournalEntries();
      setEntries(next);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refreshEntries();
  }, [userId]);

  useEffect(() => {
    const onFocus = () => {
      void refreshEntries();
    };

    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [userId]);

  const value = {
    entries,
    loading,
    refreshEntries,
  };

  return (
    <JournalContext.Provider value={value}>{children}</JournalContext.Provider>
  );
};

export const useJournalEntries = () => {
  const context = useContext(JournalContext);
  if (context === undefined) {
    throw new Error("useJournalEntries must be used within JournalProvider");
  }
  return context;
};
