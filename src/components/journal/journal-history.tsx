"use client";

import React from "react";
import { toast } from "sonner";
import { Pencil, Save, Trash2, X } from "lucide-react";
import {
  deleteJournalEntry,
  readJournalEntries,
  updateJournalEntry,
} from "@/lib/journal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Props = {
  userId: string;
};

const JournalHistory = ({ userId }: Props) => {
  const [entries, setEntries] = React.useState(() =>
    readJournalEntries(userId),
  );
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editingAnswer, setEditingAnswer] = React.useState("");
  const [pendingDeleteId, setPendingDeleteId] = React.useState<string | null>(
    null,
  );

  React.useEffect(() => {
    setEntries(readJournalEntries(userId));
  }, [userId]);

  const startEditing = (entryId: string, currentAnswer: string) => {
    setEditingId(entryId);
    setEditingAnswer(currentAnswer);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingAnswer("");
  };

  const saveEditing = (entryId: string) => {
    const trimmed = editingAnswer.trim();
    if (!trimmed) {
      toast.error("Journal entry cannot be empty.");
      return;
    }

    const next = updateJournalEntry(userId, entryId, {
      answer: trimmed,
    });
    setEntries(next);
    toast.success("Journal entry updated.");
    cancelEditing();
  };

  const removeEntry = (entryId: string) => {
    const next = deleteJournalEntry(userId, entryId);
    setEntries(next);
    toast.success("Journal entry deleted.");

    if (editingId === entryId) {
      cancelEditing();
    }

    if (pendingDeleteId === entryId) {
      setPendingDeleteId(null);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Journal Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No entries yet. Write your first daily check-in.
          </p>
        ) : (
          <div className="space-y-4">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="rounded-xl border border-border/70 bg-linear-to-br from-card via-card to-primary/5 p-4 shadow-xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Badge
                    variant="outline"
                    className="rounded-full bg-background/60"
                  >
                    {entry.type === "QUESTION" ? "Question" : "Solved"}
                  </Badge>
                  <p className="text-xs text-muted-foreground">
                    {new Date(entry.createdAt).toLocaleString()}
                  </p>
                </div>
                <p className="mt-2 text-xs font-medium text-foreground">
                  Prompt
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {entry.question}
                </p>
                <p className="mt-2 text-xs font-medium text-foreground">
                  Your entry
                </p>

                {editingId === entry.id ? (
                  <>
                    <textarea
                      value={editingAnswer}
                      onChange={(event) => setEditingAnswer(event.target.value)}
                      rows={4}
                      className="mt-1 w-full resize-none rounded-lg border border-border bg-background/80 px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring/50"
                    />
                    <div className="mt-3 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={cancelEditing}
                        className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3.5 w-3.5" />
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => saveEditing(entry.id)}
                        className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs text-primary-foreground hover:opacity-90"
                      >
                        <Save className="h-3.5 w-3.5" />
                        Save
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                      {entry.answer}
                    </p>
                    <div className="mt-3 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => startEditing(entry.id, entry.answer)}
                        className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setPendingDeleteId(entry.id)}
                        className="inline-flex items-center gap-1 rounded-full border border-destructive/40 px-3 py-1.5 text-xs text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog
        open={Boolean(pendingDeleteId)}
        onOpenChange={(open) => {
          if (!open) {
            setPendingDeleteId(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete journal entry?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. The selected journal entry will be
              permanently removed.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setPendingDeleteId(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                if (!pendingDeleteId) {
                  return;
                }

                removeEntry(pendingDeleteId);
              }}
            >
              Delete Entry
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default JournalHistory;
