"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Pencil,
  Plus,
  Trash2,
  X,
  MoreHorizontal,
  ChevronDown,
} from "lucide-react";

import { Fragment, GraphNode } from "@/types/canva";
import { toast } from "@/components/ui/toast";
import CreateFragmentForm from "../forms/create-fragment-form";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
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
import Fragments from "../fragments/fragments";

type DeleteTarget = { kind: "node"; id: string } | null;

type Props = {
  problemSpaceId: string;
  graphNodes: GraphNode[];
  fragments: Fragment[];
};

const ProblemSpaceNodes = ({
  problemSpaceId,
  graphNodes,
  fragments,
}: Props) => {
  const router = useRouter();
  const [createFragmentNodeId, setCreateFragmentNodeId] = useState<
    string | null
  >(null);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editingNodeTitle, setEditingNodeTitle] = useState("");
  const [actionLoadingKey, setActionLoadingKey] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());

  const fragmentsByNode = useMemo(() => {
    const grouped = new Map<string, Fragment[]>();
    fragments.forEach((fragment) => {
      const current = grouped.get(fragment.nodeId) ?? [];
      current.push(fragment);
      grouped.set(fragment.nodeId, current);
    });
    return grouped;
  }, [fragments]);

  const toggleCollapse = (nodeId: string) => {
    setCollapsedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const startNodeEdit = (node: Pick<GraphNode, "id" | "title">) => {
    setEditingNodeId(node.id);
    setEditingNodeTitle(node.title);
  };

  const cancelNodeEdit = () => {
    setEditingNodeId(null);
    setEditingNodeTitle("");
  };

  const handleUpdateNode = async (nodeId: string) => {
    const nextTitle = editingNodeTitle.trim();

    if (!nextTitle) {
      toast.add({
        type: "error",
        description: "Node name is required.",
        priority: "high",
      });
      return;
    }

    setActionLoadingKey(`node-update-${nodeId}`);
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/nodes/${nodeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: nextTitle }),
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      toast.add({
        type: "success",
        description: "Node updated successfully.",
      });

      cancelNodeEdit();
      router.refresh();
    } catch (err) {
      console.error("FastAPI Update Node Error:", err);
      toast.add({
        type: "error",
        description: "Failed to update node via Python backend.",
        priority: "high",
      });
    } finally {
      setActionLoadingKey(null);
    }
  };

  const handleDeleteNode = async (nodeId: string) => {
    setActionLoadingKey(`node-delete-${nodeId}`);
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/nodes/${nodeId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      toast.add({
        type: "success",
        description: "Node deleted successfully.",
      });

      router.refresh();
    } catch (err) {
      console.error("FastAPI Delete Node Error:", err);
      toast.add({
        type: "error",
        description: "Failed to delete node via Python backend.",
        priority: "high",
      });
    } finally {
      setActionLoadingKey(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    await handleDeleteNode(deleteTarget.id);
    setDeleteTarget(null);
  };

  return (
    <>
      <CreateFragmentForm
        open={createFragmentNodeId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setCreateFragmentNodeId(null);
          }
        }}
        problemSpaceId={problemSpaceId}
        nodes={graphNodes}
        fragments={fragments}
        initialNodeId={createFragmentNodeId ?? undefined}
        lockNodeSelection
      />

      <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-3">
        {graphNodes.map((node) => {
          const nodeFragments = fragmentsByNode.get(node.id) ?? [];
          const isCollapsed = collapsedNodes.has(node.id);

          return (
            <div
              key={node.id}
              className="group rounded-xl bg-white border border-stone-200/70 border-l-[3px] border-l-[#12753e] shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] transition-all duration-200"
            >
              {/* Node header */}
              <div
                className="px-4 py-3 flex items-center justify-between gap-2 cursor-pointer select-none"
                onClick={() => toggleCollapse(node.id)}
              >
                {editingNodeId === node.id ? (
                  <div
                    className="flex-1 flex items-center gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Input
                      value={editingNodeTitle}
                      onChange={(event) =>
                        setEditingNodeTitle(event.target.value)
                      }
                      className="h-8 bg-stone-50 border-stone-200 focus-visible:ring-stone-300 text-[13px]"
                      placeholder="Node name"
                      autoFocus
                    />
                    <Button
                      size="sm"
                      onClick={() => handleUpdateNode(node.id)}
                      disabled={actionLoadingKey === `node-update-${node.id}`}
                      className="h-8 px-3 bg-[#12753e] hover:bg-[#0d582f] text-white text-[12px] rounded-lg"
                    >
                      Save
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={cancelNodeEdit}
                      className="h-8 w-8 text-stone-400 hover:text-stone-600"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2 min-w-0">
                      <ChevronDown
                        className={`h-3.5 w-3.5 text-stone-300 shrink-0 transition-transform duration-200 ${
                          isCollapsed ? "-rotate-90" : ""
                        }`}
                      />
                      <h3 className="text-[13px] font-semibold text-stone-800 truncate">
                        {node.title}
                      </h3>
                      <span className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-[#dff3e7] text-[#12753e] text-[10px] font-semibold shrink-0">
                        {nodeFragments.length}
                      </span>
                    </div>
                    <div
                      className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-stone-400 hover:text-[#12753e] hover:bg-[#dff3e7]"
                        onClick={() => setCreateFragmentNodeId(node.id)}
                        title="Add fragment"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          className="h-7 w-7 inline-flex items-center justify-center rounded-md text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors"
                          aria-label="Node options"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="w-44 bg-white border-stone-200 shadow-xl rounded-xl"
                        >
                          <DropdownMenuItem
                            onClick={() => setCreateFragmentNodeId(node.id)}
                            className="text-stone-600 focus:bg-stone-50 focus:text-stone-800 rounded-lg text-[13px] cursor-pointer"
                          >
                            <Plus className="h-3.5 w-3.5 mr-2" />
                            Add Fragment
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => startNodeEdit(node)}
                            className="text-stone-600 focus:bg-stone-50 focus:text-stone-800 rounded-lg text-[13px] cursor-pointer"
                          >
                            <Pencil className="h-3.5 w-3.5 mr-2" />
                            Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-[#bc000e] focus:bg-[#fde6e8] focus:text-[#bc000e] rounded-lg text-[13px] cursor-pointer"
                            onClick={() =>
                              setDeleteTarget({ kind: "node", id: node.id })
                            }
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </>
                )}
              </div>

              {/* Fragments area */}
              {editingNodeId !== node.id && (
                <div className={isCollapsed ? "hidden" : "block"}>
                  <div className="px-4 pb-3 pt-0">
                    {nodeFragments.length === 0 ? (
                      <button
                        onClick={() => setCreateFragmentNodeId(node.id)}
                        className="w-full rounded-lg border border-dashed border-stone-200 bg-stone-50/30 py-5 text-[12px] text-stone-400 hover:border-[#12753e]/30 hover:bg-[#dff3e7]/30 hover:text-[#12753e] transition-all duration-150 cursor-pointer"
                      >
                        <div className="flex flex-col items-center gap-1">
                          <Plus className="h-4 w-4 opacity-50" />
                          <span>Add a fragment</span>
                        </div>
                      </button>
                    ) : (
                      <Fragments
                        problemSpaceId={problemSpaceId}
                        nodeFragments={nodeFragments}
                      />
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
          }
        }}
      >
        <DialogContent className="bg-white border-stone-200 rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-stone-800 text-[15px]">
              Delete node
            </DialogTitle>
            <DialogDescription className="text-stone-500 text-[13px]">
              This will permanently delete the node and all fragments inside it.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="secondary"
              onClick={() => setDeleteTarget(null)}
              disabled={actionLoadingKey !== null}
              className="bg-stone-100 hover:bg-stone-200 text-stone-700 border-0 rounded-lg text-[13px]"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
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

export default ProblemSpaceNodes;
