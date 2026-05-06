"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { JournalEntry, readJournalEntries } from "@/lib/journal";

type JournalContextType = {
  entries: JournalEntry[];
  refreshEntries: () => void;
};

const JournalContext = createContext<JournalContextType | undefined>(undefined);

export const JournalProvider = ({
  children,
  userId,
}: {
  children: React.ReactNode;
  userId: string;
}) => {
  const [entries, setEntries] = useState<JournalEntry[]>(() =>
    readJournalEntries(userId),
  );

  const refreshEntries = () => {
    setEntries(readJournalEntries(userId));
  };

  useEffect(() => {
    // Listen for storage changes from other tabs
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === `suika:journal:entries:${userId}`) {
        refreshEntries();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [userId]);

  const value = {
    entries,
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
