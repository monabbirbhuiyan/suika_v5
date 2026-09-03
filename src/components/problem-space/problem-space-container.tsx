"use client";
import React from "react";
import { motion } from "framer-motion";
import { Box, Plus, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "../ui/button";
import { Fragment, ProblemSpace } from "@/generated/prisma";
import CreateNewProblemSpaceForm from "../forms/create-problem-space-form";
import EditProblemSpaceForm from "../forms/edit-problem-space-form";
import { cn } from "@/lib/utils";

type Props = {
  problemSpace: (ProblemSpace & {
    fragments?: Pick<Fragment, "type">[];
  })[];
};

const typeConfig: Array<{
  type: Fragment["type"];
  label: string;
  colorClass: string;
}> = [
  { type: "QUESTION", label: "Question", colorClass: "bg-primary" },
  { type: "IDEA", label: "Idea", colorClass: "bg-[#005b96]" },
  { type: "OBSERVATION", label: "Observation", colorClass: "bg-[#dc8b30]" },
  { type: "CONSTRAINS", label: "Constrains", colorClass: "bg-[#ff4d4f]" },
  { type: "CONCLUSION", label: "Conclusion", colorClass: "bg-[#52c41a]" },
];

const getFragmentTypeCount = (fragments?: Pick<Fragment, "type">[]) => {
  const counts: Record<Fragment["type"], number> = {
    QUESTION: 0,
    IDEA: 0,
    OBSERVATION: 0,
    CONSTRAINS: 0,
    CONCLUSION: 0,
  };

  if (!fragments || fragments.length === 0) {
    return counts;
  }

  fragments.forEach((fragment) => {
    if (fragment.type in counts) {
      counts[fragment.type] += 1;
    }
  });

  return counts;
};

const ProblemSpaceContainer = ({ problemSpace }: Props) => {
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [editingSpace, setEditingSpace] = React.useState<typeof spaces[0] | null>(null);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deletingSpace, setDeletingSpace] = React.useState<typeof spaces[0] | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const pathname = usePathname();
  const spaces = problemSpace || [];

  const handleConfirmDelete = async () => {
    if (!deletingSpace) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/problem-spaces/${deletingSpace.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        throw new Error("Failed to delete problem space");
      }
      setDeleteOpen(false);
      setDeletingSpace(null);
    } catch {
      // Error handled silently
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl w-full mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-end">
          <Button
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium text-background hover:opacity-90 transition-opacity shrink-0"
          >
            <Plus className="h-4 w-4" />
            Create Problem Space
          </Button>
        </div>
      </motion.div>

      {spaces.length > 0 ? (
        <motion.div
          className="grid grid-cols-2 gap-4 mt-8"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {spaces.map((space) =>
            (() => {
              const fragmentCount = space.fragments?.length ?? 0;
              const typeCount = getFragmentTypeCount(space.fragments);
              const counts = typeConfig.map((config) => {
                return {
                  ...config,
                  count: typeCount[config.type],
                };
              });

              const handleEditClick = (e: React.MouseEvent, space: typeof spaces[0]) => {
                e.preventDefault();
                e.stopPropagation();
                setEditingSpace(space);
                setEditOpen(true);
              };

              const handleDeleteClick = (e: React.MouseEvent, space: typeof spaces[0]) => {
                e.preventDefault();
                e.stopPropagation();
                setDeletingSpace(space);
                setDeleteOpen(true);
              };

              return (
                <Link
                  key={space.id}
                  href={`${pathname}/${space.id}`}
                  className="rounded-xl bg-card p-6 text-left hover:ring-1 hover:ring-sage/30 transition-all group block relative"
                >
                  <div className="flex items-start justify-between">
                    <h3 className="font-sans font-medium text-foreground group-hover:text-sage transition-colors">
                      {space.title}
                    </h3>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
                        onClick={(e) => handleEditClick(e, space)}
                        aria-label="Edit problem space"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={(e) => handleDeleteClick(e, space)}
                        aria-label="Delete problem space"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {fragmentCount} fragments
                  </p>
                  <div className="mt-4 h-1.5 bg-border/60 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-sage/60 rounded-full transition-all"
                      style={{ width: `${space.progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    {space.progress}% clarity
                  </p>

                  {/* Fragment types */}
                  <div className="mt-3">
                    <div className="h-2 w-full overflow-hidden rounded-full bg-border/60 flex">
                      {counts.map((item) => {
                        if (item.count === 0 || fragmentCount === 0)
                          return null;

                        return (
                          <div
                            key={item.type}
                            className={cn("h-full", item.colorClass)}
                            style={{
                              width: `${(item.count / fragmentCount) * 100}%`,
                            }}
                            title={`${item.label}: ${item.count}`}
                          />
                        );
                      })}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {counts.map((item) => {
                        if (item.count === 0) return null;

                        return (
                          <div
                            key={item.type}
                            className="inline-flex items-center gap-1.5 rounded-md border border-border/60 px-2 py-0.5"
                          >
                            <span
                              className={cn(
                                "h-1.5 w-1.5 rounded-full",
                                item.colorClass,
                              )}
                            />
                            <span className="text-[10px] text-muted-foreground">
                              {item.label}: {item.count}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </Link>
              );
            })(),
          )}

          {/* New space CTA card */}
          <button
            onClick={() => setCreateOpen(true)}
            className="rounded-xl border-2 border-dashed border-border p-6 flex flex-col items-center justify-center gap-3 text-muted-foreground hover:text-sage hover:border-sage/40 transition-all group min-h-40"
          >
            <div className="rounded-full bg-card p-3 group-hover:bg-sage/15 transition-colors">
              <Plus className="h-5 w-5" />
            </div>
            <span className="text-sm font-medium">New Problem Space</span>
          </button>
        </motion.div>
      ) : (
        /* Empty state */
        <motion.div
          className="mt-16 flex flex-col items-center text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="rounded-full bg-card p-5">
            <Box className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="font-serif text-xl text-foreground mt-6">
            No problem spaces yet
          </h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-sm leading-relaxed">
            A problem space is a container for a question you are working
            through. Create your first one to begin making sense of something.
          </p>
          <button
            onClick={() => setCreateOpen(true)}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-sage px-6 py-3 text-sm font-medium text-background hover:opacity-90 transition-opacity"
          >
            <Plus className="h-4 w-4" />
            Create your first Problem Space
          </button>
        </motion.div>
      )}

      <CreateNewProblemSpaceForm
        open={createOpen}
        onOpenChange={setCreateOpen}
      />
      <EditProblemSpaceForm
        open={editOpen}
        onOpenChange={setEditOpen}
        problemSpaceId={editingSpace?.id ?? ""}
        initialTitle={editingSpace?.title ?? ""}
        initialDescription={editingSpace?.description ?? ""}
        userId={editingSpace?.userId ?? ""}
      />
      {deleteOpen && deletingSpace && (
        <div className="fixed inset-0 z-50 bg-foreground/20 backdrop-blur-sm flex items-center justify-center"
             onClick={() => setDeleteOpen(false)}>
          <div className="bg-background rounded-xl border border-border p-6 shadow-xl max-w-md w-full mx-4"
               onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold text-foreground mb-2">Delete Problem Space</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Are you sure you want to delete "{deletingSpace.title}"? This action cannot be undone and will permanently remove all associated fragments, nodes, and connections.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setDeleteOpen(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProblemSpaceContainer;
