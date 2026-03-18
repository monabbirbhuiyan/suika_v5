import React from "react";
import { getServerSession } from "@/action/get-session";
import JournalCard from "@/components/journal/journal-card";
import JournalHistory from "@/components/journal/journal-history";

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
    <div className="mx-auto w-full max-w-5xl space-y-4 p-6 md:p-8">
      <div>
        <h1 className="font-serif text-3xl text-foreground">Journal</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Daily reflection powered by AI. The prompt refreshes every 24 hours.
        </p>
      </div>

      <JournalCard userId={userId} />
      <JournalHistory userId={userId} />
    </div>
  );
};

export default JournalPage;
