"use client";

import React from "react";
import { toast } from "sonner";
import { Pencil, Save, Trash2, X } from "lucide-react";
import { deleteJournalEntry, updateJournalEntry } from "@/lib/journal";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useJournalEntries } from "./journal-context";

type Props = {
  userId: string;
};

// Rotating note palettes: [bg, border, text, pin, fold]
const NOTE_PALETTES = [
  {
    bg: "#e8f5ee",
    border: "#7ab894",
    text: "#0d4f2a",
    pin: "#12753e",
    fold: "#7ab894",
  },
  {
    bg: "#fde8e8",
    border: "#e89090",
    text: "#4f0d0d",
    pin: "#bc000e",
    fold: "#e89090",
  },
  {
    bg: "#d4ece0",
    border: "#5aaa7a",
    text: "#0a3d20",
    pin: "#12753e",
    fold: "#5aaa7a",
  },
  {
    bg: "#fdf0e8",
    border: "#e8b48a",
    text: "#4f2a0d",
    pin: "#bc000e",
    fold: "#e8b48a",
  },
  {
    bg: "#c8e8d4",
    border: "#3d9060",
    text: "#082a14",
    pin: "#12753e",
    fold: "#3d9060",
  },
] as const;

const ROTATIONS = ["-1.2deg", "0.8deg", "-0.4deg", "1.5deg", "-0.7deg", "1deg"];

const JournalHistory = ({ userId: _userId }: Props) => {
  const { entries, loading, refreshEntries } = useJournalEntries();
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editingAnswer, setEditingAnswer] = React.useState("");
  const [pendingDeleteId, setPendingDeleteId] = React.useState<string | null>(
    null,
  );

  const startEditing = (entryId: string, currentAnswer: string) => {
    setEditingId(entryId);
    setEditingAnswer(currentAnswer);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingAnswer("");
  };

  const saveEditing = async (entryId: string) => {
    const trimmed = editingAnswer.trim();
    if (!trimmed) {
      toast.error("Entry cannot be empty.");
      return;
    }
    const updated = await updateJournalEntry(entryId, { answer: trimmed });
    if (!updated) {
      toast.error("Failed to update.");
      return;
    }
    toast.success("Entry updated.");
    await refreshEntries();
    cancelEditing();
  };

  const removeEntry = async (entryId: string) => {
    const deleted = await deleteJournalEntry(entryId);
    if (!deleted) {
      toast.error("Failed to delete.");
      return;
    }
    toast.success("Entry deleted.");
    await refreshEntries();
    if (editingId === entryId) cancelEditing();
    if (pendingDeleteId === entryId) setPendingDeleteId(null);
  };

  const groupedEntries = entries.reduce(
    (acc, entry) => {
      const key = entry.entryDate || entry.createdAt.slice(0, 10);
      if (!acc[key]) acc[key] = [];
      acc[key].push(entry);
      return acc;
    },
    {} as Record<string, typeof entries>,
  );

  const dayKeys = Object.keys(groupedEntries).sort((a, b) => (a > b ? -1 : 1));

  let globalIndex = 0;

  return (
    <>
      {loading ? (
        <p className="text-sm text-[#2d6e47] dark:text-[#6aaa80]">
          Loading entries…
        </p>
      ) : entries.length === 0 ? (
        <p className="text-sm text-[#2d6e47] dark:text-[#6aaa80]">
          No entries yet. Pin your first note above.
        </p>
      ) : (
        <div className="space-y-8">
          {dayKeys.map((day) => (
            <div key={day}>
              {/* Day divider */}
              <div className="flex items-center gap-3 mb-4">
                <div className="h-px flex-1 bg-[#12753e]/30 dark:bg-[#12753e]/20" />
                <p className="text-[11px] font-semibold uppercase tracking-widest text-[#12753e] dark:text-[#5aaa7a] shrink-0">
                  {new Date(`${day}T00:00:00`).toLocaleDateString(undefined, {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
                <div className="h-px flex-1 bg-[#12753e]/30 dark:bg-[#12753e]/20" />
              </div>

              {/* Masonry-style note grid */}
              <div className="columns-1 sm:columns-2 lg:columns-3 gap-5 space-y-0">
                {groupedEntries[day].map((entry) => {
                  const palette =
                    NOTE_PALETTES[globalIndex % NOTE_PALETTES.length];
                  const rotation = ROTATIONS[globalIndex % ROTATIONS.length];
                  globalIndex++;

                  return (
                    <div
                      key={entry.id}
                      className="group relative break-inside-avoid mb-5 inline-block w-full"
                      style={{ transform: `rotate(${rotation})` }}
                    >
                      {/* Pin */}
                      <div
                        className="absolute -top-2.5 left-1/2 z-10 -translate-x-1/2 h-5 w-2.5 rounded-full shadow"
                        style={{ backgroundColor: palette.pin }}
                      />

                      {/* Note body */}
                      <div
                        className="relative rounded-sm p-4 shadow-[3px_5px_16px_rgba(0,0,0,0.15)] transition-shadow hover:shadow-[4px_8px_24px_rgba(0,0,0,0.22)]"
                        style={{
                          backgroundColor: palette.bg,
                          border: `1px solid ${palette.border}`,
                        }}
                      >
                        {/* Fold corner */}
                        <div
                          className="absolute bottom-0 right-0 h-6 w-6"
                          style={{
                            background: `linear-gradient(135deg, transparent 50%, ${palette.fold} 50%)`,
                          }}
                        />

                        {/* Badge + time */}
                        <div className="flex items-center justify-between mb-2">
                          <span
                            className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                            style={{
                              backgroundColor: `${palette.border}55`,
                              color: palette.text,
                              border: `1px solid ${palette.border}`,
                            }}
                          >
                            {entry.type === "SOLVED"
                              ? "✓ Solved"
                              : "? Question"}
                          </span>
                          <span
                            className="text-[10px]"
                            style={{ color: palette.text, opacity: 0.6 }}
                          >
                            {new Date(entry.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>

                        {/* Prompt */}
                        <p
                          className="text-[11px] italic leading-relaxed mb-2"
                          style={{ color: palette.text, opacity: 0.7 }}
                        >
                          {entry.question}
                        </p>

                        {/* Answer */}
                        {editingId === entry.id ? (
                          <>
                            <textarea
                              value={editingAnswer}
                              onChange={(e) => setEditingAnswer(e.target.value)}
                              rows={4}
                              className="w-full resize-none rounded bg-white/50 px-2 py-1.5 text-sm outline-none focus:ring-1"
                              style={{
                                color: palette.text,
                                borderColor: palette.border,
                                border: `1px solid ${palette.border}`,
                              }}
                            />
                            <div className="mt-2 flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={cancelEditing}
                                className="inline-flex items-center gap-1 rounded px-2.5 py-1 text-xs hover:bg-black/10"
                                style={{ color: palette.text }}
                              >
                                <X className="h-3 w-3" /> Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => saveEditing(entry.id)}
                                className="inline-flex items-center gap-1 rounded px-2.5 py-1 text-xs font-medium"
                                style={{
                                  backgroundColor: palette.text,
                                  color: palette.bg,
                                }}
                              >
                                <Save className="h-3 w-3" /> Save
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
                            <p
                              className="whitespace-pre-wrap text-sm leading-relaxed"
                              style={{ color: palette.text }}
                            >
                              {entry.answer}
                            </p>
                            <div className="mt-3 flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                type="button"
                                onClick={() =>
                                  startEditing(entry.id, entry.answer)
                                }
                                className="inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] hover:bg-black/10"
                                style={{ color: palette.text }}
                              >
                                <Pencil className="h-3 w-3" /> Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => setPendingDeleteId(entry.id)}
                                className="inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] text-red-600 hover:bg-red-100"
                              >
                                <Trash2 className="h-3 w-3" /> Delete
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog
        open={Boolean(pendingDeleteId)}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteId(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete this note?</DialogTitle>
            <DialogDescription>This cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingDeleteId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (pendingDeleteId) await removeEntry(pendingDeleteId);
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default JournalHistory;
