"use client";

import React from "react";
import { Fragment, GraphNode } from "@/generated/prisma";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { deleteNode, updateNode } from "@/action/fragments";
import CreateFragmentForm from "../forms/create-fragment-form";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Input } from "../ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
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
  const [createFragmentNodeId, setCreateFragmentNodeId] = React.useState<
    string | null
  >(null);
  const [editingNodeId, setEditingNodeId] = React.useState<string | null>(null);
  const [editingNodeTitle, setEditingNodeTitle] = React.useState("");
  const [actionLoadingKey, setActionLoadingKey] = React.useState<string | null>(
    null,
  );
  const [deleteTarget, setDeleteTarget] = React.useState<DeleteTarget>(null);

  const fragmentsByNode = React.useMemo(() => {
    const grouped = new Map<string, Fragment[]>();

    fragments.forEach((fragment) => {
      const current = grouped.get(fragment.nodeId) ?? [];
      current.push(fragment);
      grouped.set(fragment.nodeId, current);
    });

    return grouped;
  }, [fragments]);

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
      toast.error("Node name is required.");
      return;
    }

    setActionLoadingKey(`node-update-${nodeId}`);
    try {
      const response = await updateNode(problemSpaceId, nodeId, {
        title: nextTitle,
      });

      if (!response) {
        toast.error("Unable to update node.");
        return;
      }

      toast.success("Node updated.");
      cancelNodeEdit();
      router.refresh();
    } catch {
      toast.error("Failed to update node.");
    } finally {
      setActionLoadingKey(null);
    }
  };

  const handleDeleteNode = async (nodeId: string) => {
    setActionLoadingKey(`node-delete-${nodeId}`);
    try {
      const response = await deleteNode(problemSpaceId, nodeId);

      if (!response) {
        toast.error("Unable to delete node.");
        return;
      }

      toast.success("Node deleted.");
      router.refresh();
    } catch {
      toast.error("Failed to delete node.");
    } finally {
      setActionLoadingKey(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) {
      return;
    }

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

      <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
        {graphNodes.map((node) => {
          const nodeFragments = fragmentsByNode.get(node.id) ?? [];

          return (
            <Card key={node.id} className="py-4 gap-3">
              <CardHeader className="px-4 pb-1">
                <div className="flex items-center justify-between gap-2">
                  {editingNodeId === node.id ? (
                    <div className="flex-1 flex items-center gap-2">
                      <Input
                        value={editingNodeTitle}
                        onChange={(event) =>
                          setEditingNodeTitle(event.target.value)
                        }
                        className="h-8"
                        placeholder="Node name"
                      />
                      <Button
                        size="sm"
                        onClick={() => handleUpdateNode(node.id)}
                        disabled={actionLoadingKey === `node-update-${node.id}`}
                      >
                        Save
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={cancelNodeEdit}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <CardTitle className="text-base">{node.title}</CardTitle>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          onClick={() => setCreateFragmentNodeId(node.id)}
                          className="inline-flex items-center gap-1.5"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Create Fragment
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => startNodeEdit(node)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() =>
                            setDeleteTarget({ kind: "node", id: node.id })
                          }
                          disabled={
                            actionLoadingKey === `node-delete-${node.id}`
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </CardHeader>

              <CardContent className="px-4">
                {nodeFragments.length === 0 ? (
                  <div className="rounded-md border border-dashed p-3 text-xs text-muted-foreground">
                    No fragments in this node yet.
                  </div>
                ) : (
                  <Fragments
                    problemSpaceId={problemSpaceId}
                    nodeFragments={nodeFragments}
                  />
                )}
              </CardContent>

              <CardFooter className="px-4 pt-0 text-[10px] text-muted-foreground">
                {nodeFragments.length} fragment
                {nodeFragments.length === 1 ? "" : "s"}
              </CardFooter>
            </Card>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete node</DialogTitle>
            <DialogDescription>
              This will permanently delete the node and all fragments inside it.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setDeleteTarget(null)}
              disabled={actionLoadingKey !== null}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
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

export default ProblemSpaceNodes;
