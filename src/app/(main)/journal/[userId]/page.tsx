import React from "react";
import { getServerSession } from "@/action/get-session";
import JournalCard from "@/components/journal/journal-card";
import JournalHistory from "@/components/journal/journal-history";
import { JournalProvider } from "@/components/journal/journal-context";

const JournalPage = async () => {
  const session = await getServerSession();
  const userId = session?.user?.id;

  if (!userId) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        Please sign in to use Journal.
      </div>
    );
  }

  return (
    <div
      className="min-h-full w-full bg-[#d8e8d6] dark:bg-[#182820]"
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2312753e' fill-opacity='0.10'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
      }}
    >
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-8">
        {/* Header */}
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h1 className="font-serif text-3xl font-bold text-[#0d4f2a] dark:text-[#a8d4b8]">
              Journal
            </h1>
            <p className="mt-1 text-sm text-[#2d6e47] dark:text-[#6aaa80]">
              Pin your thoughts. Questions &amp; breakthroughs.
            </p>
          </div>
        </div>

        <JournalProvider userId={userId}>
          {/* Write note + history on the corkboard */}
          <div className="flex flex-col gap-8">
            <JournalCard userId={userId} />
            <JournalHistory userId={userId} />
          </div>
        </JournalProvider>
      </div>
    </div>
  );
};

export default JournalPage;
