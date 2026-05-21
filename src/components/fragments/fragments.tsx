"use client";

import React from "react";
import { Fragment } from "@/generated/prisma";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteFragment, updateFragment } from "@/action/fragments";
import { fragmentTypes, singleInstanceFragmentTypes } from "@/lib/schemas";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";

type Props = {
  problemSpaceId: string;
  nodeFragments: Fragment[];
};

const typeButtonStyles: Record<(typeof fragmentTypes)[number], string> = {
  QUESTION: "border-primary bg-primary/10 text-primary",
  IDEA: "border-[#005b96] bg-[#005b96]/10 text-[#005b96]",
  OBSERVATION: "border-[#dc8b30] bg-[#dc8b30]/10 text-[#dc8b30]",
  CONSTRAINS: "border-destructive bg-destructive/10 text-destructive",
  CONCLUSION: "border-[#52bf90] bg-[#52bf90]/10 text-[#52bf90]",
};

const typeStyles: Record<
  Fragment["type"],
  { border: string; dot: string; label: string }
> = {
  QUESTION: {
    border: "border-l-primary",
    dot: "bg-primary",
    label: "Question",
  },
  IDEA: {
    border: "border-l-[#005b96]",
    dot: "bg-[#005b96]",
    label: "Idea",
  },
  OBSERVATION: {
    border: "border-l-[#dc8b30]",
    dot: "bg-[#dc8b30]",
    label: "Observation",
  },
  CONSTRAINS: {
    border: "border-l-destructive",
    dot: "bg-destructive",
    label: "Constrains",
  },
  CONCLUSION: {
    border: "border-l-[#52bf90]",
    dot: "bg-[#52bf90]",
    label: "Conclusion",
  },
};

const singleInstanceFragmentTypeSet = new Set<string>(
  singleInstanceFragmentTypes,
);

const fragmentTypePriority: Record<Fragment["type"], number> = {
  QUESTION: 0,
  IDEA: 1,
  OBSERVATION: 2,
  CONSTRAINS: 3,
  CONCLUSION: 4,
};

const getFragmentTypeLabels = (nodeFragments: Fragment[]) => {
  const totalByType = new Map<Fragment["type"], number>();

  nodeFragments.forEach((fragment) => {
    totalByType.set(fragment.type, (totalByType.get(fragment.type) ?? 0) + 1);
  });

  const seenByType = new Map<Fragment["type"], number>();

  return nodeFragments.map((fragment) => {
    const seen = (seenByType.get(fragment.type) ?? 0) + 1;
    seenByType.set(fragment.type, seen);

    const baseLabel = typeStyles[fragment.type].label;
    const total = totalByType.get(fragment.type) ?? 0;

    return total > 1 ? `${baseLabel} ${seen}` : baseLabel;
  });
};

const Fragments = ({ problemSpaceId, nodeFragments }: Props) => {
  const router = useRouter();
  const [editingFragmentId, setEditingFragmentId] = React.useState<
    string | null
  >(null);
  const [editingFragmentContent, setEditingFragmentContent] =
    React.useState("");
  const [editingFragmentType, setEditingFragmentType] =
    React.useState<Fragment["type"]>("QUESTION");
  const [actionLoadingKey, setActionLoadingKey] = React.useState<string | null>(
    null,
  );
  const [deleteFragmentId, setDeleteFragmentId] = React.useState<string | null>(
    null,
  );

  const orderedNodeFragments = React.useMemo(() => {
    return [...nodeFragments].sort((a, b) => {
      const byType =
        fragmentTypePriority[a.type] - fragmentTypePriority[b.type];

      if (byType !== 0) {
        return byType;
      }

      const bySortOrder = (a.sortOrder ?? 0) - (b.sortOrder ?? 0);

      if (bySortOrder !== 0) {
        return bySortOrder;
      }

      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
  }, [nodeFragments]);

  const formatTypeLabel = (value: Fragment["type"]) =>
    value.charAt(0) + value.slice(1).toLowerCase();

  const disabledEditTypes = React.useMemo(() => {
    if (!editingFragmentId) {
      return new Set<Fragment["type"]>();
    }

    const disabled = new Set<Fragment["type"]>();

    nodeFragments.forEach((fragment) => {
      if (
        fragment.id !== editingFragmentId &&
        singleInstanceFragmentTypeSet.has(fragment.type)
      ) {
        disabled.add(fragment.type);
      }
    });

    return disabled;
  }, [editingFragmentId, nodeFragments]);

  const fragmentTypeLabels = React.useMemo(
    () => getFragmentTypeLabels(orderedNodeFragments),
    [orderedNodeFragments],
  );

  const startFragmentEdit = (fragment: Fragment) => {
    setEditingFragmentId(fragment.id);

    setEditingFragmentContent(fragment.content || "");
    setEditingFragmentType(fragment.type);
  };

  const cancelFragmentEdit = () => {
    setEditingFragmentId(null);

    setEditingFragmentContent("");
    setEditingFragmentType("QUESTION");
  };

  const handleUpdateFragment = async (fragmentId: string) => {
    const nextContent = editingFragmentContent.trim();

    if (!nextContent) {
      toast.error("Content is required.");
      return;
    }

    setActionLoadingKey(`fragment-update-${fragmentId}`);
    try {
      const response = await updateFragment(problemSpaceId, fragmentId, {
        content: nextContent,
        type: editingFragmentType,
      });

      if (!response) {
        toast.error("Unable to update fragment.");
        return;
      }

      toast.success("Fragment updated.");
      cancelFragmentEdit();
      router.refresh();
    } catch {
      toast.error("Failed to update fragment.");
    } finally {
      setActionLoadingKey(null);
    }
  };

  const handleDeleteFragment = async (fragmentId: string) => {
    setActionLoadingKey(`fragment-delete-${fragmentId}`);
    try {
      const response = await deleteFragment(problemSpaceId, fragmentId);

      if (!response) {
        toast.error("Unable to delete fragment.");
        return;
      }

      toast.success("Fragment deleted.");
      setDeleteFragmentId(null);
      router.refresh();
    } catch {
      toast.error("Failed to delete fragment.");
    } finally {
      setActionLoadingKey(null);
    }
  };

  return (
    <>
      <div className="space-y-2">
        {orderedNodeFragments.map((fragment, index) => {
          const typeStyle = typeStyles[fragment.type];
          const typeLabel = fragmentTypeLabels[index];
          return (
            <div
              key={fragment.id}
              className={`rounded-md border border-l-[3px] bg-card p-3 ${typeStyle.border}`}
            >
              {editingFragmentId === fragment.id ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    {fragmentTypes.map((type) => {
                      const isActive = editingFragmentType === type;
                      const isDisabled = disabledEditTypes.has(type);
                      return (
                        <Button
                          key={type}
                          type="button"
                          variant="outline"
                          className={`justify-start border transition-opacity hover:cursor-pointer ${typeButtonStyles[type]} ${
                            isActive
                              ? "opacity-100"
                              : isDisabled
                                ? "opacity-20"
                                : "opacity-45 hover:opacity-70"
                          }`}
                          onClick={() => {
                            if (!isDisabled) {
                              setEditingFragmentType(type as Fragment["type"]);
                            }
                          }}
                          disabled={isDisabled}
                        >
                          {formatTypeLabel(type)}
                        </Button>
                      );
                    })}
                  </div>
                  <Textarea
                    value={editingFragmentContent}
                    onChange={(event) =>
                      setEditingFragmentContent(event.target.value)
                    }
                    className="min-h-20"
                    placeholder="Fragment content"
                  />
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={cancelFragmentEdit}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleUpdateFragment(fragment.id)}
                      disabled={
                        actionLoadingKey === `fragment-update-${fragment.id}`
                      }
                    >
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <div
                        className={`h-1.5 w-1.5 rounded-full ${typeStyle.dot}`}
                      />
                      <span className="text-[10px] text-muted-foreground tracking-wider">
                        {typeLabel}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => startFragmentEdit(fragment)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setDeleteFragmentId(fragment.id)}
                        disabled={
                          actionLoadingKey === `fragment-delete-${fragment.id}`
                        }
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <h4 className="text-sm font-medium text-foreground">
                    {fragment.content}
                  </h4>
                  <p className="text-[10px] text-muted-foreground/60 mt-2">
                    {new Date(fragment.createdAt).toLocaleDateString()}
                  </p>
                </>
              )}
            </div>
          );
        })}
      </div>

      <Dialog
        open={deleteFragmentId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteFragmentId(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete fragment</DialogTitle>
            <DialogDescription>
              This will permanently delete this fragment.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setDeleteFragmentId(null)}
              disabled={actionLoadingKey !== null}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deleteFragmentId) {
                  void handleDeleteFragment(deleteFragmentId);
                }
              }}
              disabled={actionLoadingKey !== null}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Fragments;
