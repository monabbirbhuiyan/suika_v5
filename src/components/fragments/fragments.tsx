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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

type Props = {
  problemSpaceId: string;
  nodeFragments: Fragment[];
};

const typeDotColors: Record<(typeof fragmentTypes)[number], string> = {
  QUESTION: "bg-[#12753e]",
  IDEA: "bg-[#3b82f6]",
  OBSERVATION: "bg-[#f59e0b]",
  CONSTRAINS: "bg-[#bc000e]",
  CONCLUSION: "bg-[#10b981]",
};

const typeButtonStyles: Record<(typeof fragmentTypes)[number], string> = {
  QUESTION: "border-[#12753e]/30 bg-[#dff3e7] text-[#12753e]",
  IDEA: "border-blue-200 bg-blue-50 text-blue-700",
  OBSERVATION: "border-amber-200 bg-amber-50 text-amber-700",
  CONSTRAINS: "border-[#bc000e]/30 bg-[#fde6e8] text-[#bc000e]",
  CONCLUSION: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

const typeLabels: Record<Fragment["type"], string> = {
  QUESTION: "Question",
  IDEA: "Idea",
  OBSERVATION: "Observation",
  CONSTRAINS: "Constraint",
  CONCLUSION: "Conclusion",
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

    const baseLabel = typeLabels[fragment.type];
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

  const formatTypeLabel = (value: Fragment["type"]) =>
    value.charAt(0) + value.slice(1).toLowerCase();

  return (
    <>
      <div className="space-y-1.5">
        {orderedNodeFragments.map((fragment, index) => {
          const dotColor = typeDotColors[fragment.type];
          const typeLabel = fragmentTypeLabels[index];
          return (
            <div
              key={fragment.id}
              className="group/frag rounded-lg bg-stone-50/60 hover:bg-stone-50 border border-stone-100/80 transition-all duration-150"
            >
              {editingFragmentId === fragment.id ? (
                <div className="p-3 space-y-2.5">
                  <div className="grid grid-cols-2 gap-1.5">
                    {fragmentTypes.map((type) => {
                      const isActive = editingFragmentType === type;
                      const isDisabled = disabledEditTypes.has(type);
                      return (
                        <Button
                          key={type}
                          type="button"
                          variant="outline"
                          size="sm"
                          className={`justify-start border text-[11px] h-7 transition-all duration-150 hover:cursor-pointer ${typeButtonStyles[type]} ${
                            isActive
                              ? "ring-2 ring-offset-1 ring-stone-300 opacity-100 font-medium"
                              : isDisabled
                                ? "opacity-20"
                                : "opacity-50 hover:opacity-80"
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
                    className="min-h-[60px] text-[13px] bg-white border-stone-200 focus-visible:ring-stone-300 resize-none leading-relaxed"
                    placeholder="Fragment content"
                  />
                  <div className="flex items-center justify-end gap-1.5">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={cancelFragmentEdit}
                      className="h-7 px-3 text-[12px] text-stone-500 hover:text-stone-700 hover:bg-stone-100"
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleUpdateFragment(fragment.id)}
                      className="h-7 px-4 text-[12px] bg-[#12753e] hover:bg-[#0d582f] text-white rounded-lg"
                      disabled={
                        actionLoadingKey === `fragment-update-${fragment.id}`
                      }
                    >
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="px-3 py-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${dotColor} shrink-0`}
                        />
                        <span className="text-[11px] font-medium text-stone-500">
                          {typeLabel}
                        </span>
                      </div>
                      <p className="text-[13px] text-stone-700 leading-relaxed">
                        {fragment.content}
                      </p>
                      <p className="text-[10px] text-stone-400 mt-1">
                        {new Date(fragment.createdAt).toLocaleDateString(
                          undefined,
                          { month: "short", day: "numeric" },
                        )}
                      </p>
                    </div>
                    <div className="shrink-0 opacity-0 group-hover/frag:opacity-100 transition-opacity duration-150">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 text-stone-300 hover:text-stone-500 hover:bg-stone-200/50"
                          >
                            <span className="text-xs leading-none">···</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="w-32 bg-white border-stone-200 shadow-xl rounded-xl"
                        >
                          <DropdownMenuItem
                            onClick={() => startFragmentEdit(fragment)}
                            className="text-stone-600 focus:bg-stone-50 focus:text-stone-800 rounded-lg text-[13px] cursor-pointer"
                          >
                            <Pencil className="h-3 w-3 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-[#bc000e] focus:bg-[#fde6e8] focus:text-[#bc000e] rounded-lg text-[13px] cursor-pointer"
                            onClick={() => setDeleteFragmentId(fragment.id)}
                          >
                            <Trash2 className="h-3 w-3 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
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
        <DialogContent className="bg-white border-stone-200 rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-stone-800 text-[15px]">
              Delete fragment
            </DialogTitle>
            <DialogDescription className="text-stone-500 text-[13px]">
              This will permanently delete this fragment.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="secondary"
              onClick={() => setDeleteFragmentId(null)}
              disabled={actionLoadingKey !== null}
              className="bg-stone-100 hover:bg-stone-200 text-stone-700 border-0 rounded-lg text-[13px]"
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
              className="bg-[#bc000e] hover:bg-[#8e000a] text-white rounded-lg text-[13px]"
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
