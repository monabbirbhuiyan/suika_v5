"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";

import {
  FragmentFormValues,
  fragmentSchema,
  fragmentTypes,
  singleInstanceFragmentTypes,
} from "@/lib/schemas";
import { toast } from "@/components/ui/toast";
import { Textarea } from "../ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Button } from "../ui/button";

type LocalNode = {
  id: string;
  title: string;
};

type LocalFragment = {
  id: string;
  nodeId?: string;
  type: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  problemSpaceId: string;
  nodes: LocalNode[];
  fragments: LocalFragment[];
  initialNodeId?: string;
  lockNodeSelection?: boolean;
};

const typeButtonStyles: Record<(typeof fragmentTypes)[number], string> = {
  QUESTION: "border-amber-200 bg-amber-50 text-amber-700",
  IDEA: "border-sky-200 bg-sky-50 text-sky-700",
  OBSERVATION: "border-orange-200 bg-orange-50 text-orange-700",
  CONSTRAINS: "border-rose-200 bg-rose-50 text-rose-700",
  CONCLUSION: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

const singleInstanceFragmentTypeSet = new Set<string>(
  singleInstanceFragmentTypes,
);

const CreateFragmentForm = ({
  open,
  onOpenChange,
  problemSpaceId,
  nodes,
  fragments,
  initialNodeId,
  lockNodeSelection = false,
}: Props) => {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    watch,
    control,
    reset,
    formState: { errors },
  } = useForm<FragmentFormValues>({
    resolver: zodResolver(fragmentSchema),
    defaultValues: {
      content: "",
      nodeId: "",
      type: "QUESTION",
    },
  });

  useEffect(() => {
    if (!open) return;
    if (lockNodeSelection && initialNodeId) {
      setValue("nodeId", initialNodeId);
    }
  }, [open, initialNodeId, lockNodeSelection, setValue]);

  const watchedNodeId = watch("nodeId");
  const selectedNodeId = lockNodeSelection
    ? (initialNodeId ?? "")
    : watchedNodeId;

  const disabledTypeSet = useMemo(() => {
    if (!selectedNodeId) {
      return new Set<(typeof fragmentTypes)[number]>();
    }

    const disabled = new Set<(typeof fragmentTypes)[number]>();
    fragments.forEach((fragment) => {
      if (
        fragment.nodeId === selectedNodeId &&
        singleInstanceFragmentTypeSet.has(fragment.type)
      ) {
        disabled.add(fragment.type as (typeof fragmentTypes)[number]);
      }
    });

    return disabled;
  }, [fragments, selectedNodeId]);

  useEffect(() => {
    const currentType = getValues("type");
    if (!disabledTypeSet.has(currentType)) return;

    const fallbackType = fragmentTypes.find(
      (type) => !disabledTypeSet.has(type),
    );

    if (fallbackType) {
      setValue("type", fallbackType);
    }
  }, [disabledTypeSet, getValues, setValue]);

  const formatTypeLabel = (value: (typeof fragmentTypes)[number]) => {
    const labels: Record<string, string> = {
      QUESTION: "Question",
      IDEA: "Idea",
      OBSERVATION: "Observation",
      CONSTRAINS: "Constraint",
      CONCLUSION: "Conclusion",
    };
    return labels[value] ?? value;
  };

  const onSubmit = async (data: FragmentFormValues) => {
    setLoading(true);
    setError(null);

    try {
      const targetNodeId = lockNodeSelection
        ? initialNodeId || ""
        : data.nodeId;

      if (!targetNodeId) {
        setError("Node is required.");
        toast.add({
          type: "error",
          description: "A parent node is required.",
          priority: "high",
        });
        return;
      }

      if (
        singleInstanceFragmentTypeSet.has(data.type) &&
        fragments.some((f) => f.nodeId === targetNodeId && f.type === data.type)
      ) {
        const formattedType = formatTypeLabel(data.type);
        const msg = `Only one ${formattedType} is allowed per node.`;
        setError(msg);
        toast.add({ type: "error", description: msg, priority: "high" });
        return;
      }

      // Persist to FastAPI directly
      const res = await fetch("http://127.0.0.1:8000/api/nodes/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problem_space_id: problemSpaceId,
          label: formatTypeLabel(data.type),
          content: JSON.stringify({
            fragment_type: data.type.toLowerCase(),
            text: data.content,
            parent_node_id: targetNodeId,
          }),
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      toast.add({
        type: "success",
        description: "Fragment created successfully.",
      });

      reset({
        content: "",
        nodeId: lockNodeSelection && initialNodeId ? initialNodeId : "",
        type: "QUESTION",
      });
      onOpenChange(false);
      router.refresh();
    } catch (err) {
      console.error("FastAPI fragment creation error:", err);
      setError("Failed to create fragment. Please try again.");
      toast.add({
        type: "error",
        description: "Failed to create fragment via Python backend.",
        priority: "high",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 bg-stone-900/20 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => onOpenChange(false)}
        >
          <motion.div
            className="w-full max-w-md"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="rounded-2xl bg-white border border-stone-200 shadow-xl p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-[15px] font-semibold text-stone-800">
                  New Fragment
                </h2>
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  className="text-stone-300 hover:text-stone-500 transition-colors rounded-lg p-1 hover:bg-stone-50"
                  aria-label="Close dialog"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="flex flex-col gap-4">
                  {/* Fragment Type Selector */}
                  <div>
                    <label className="text-[13px] font-medium text-stone-600 block mb-1.5">
                      Type
                    </label>
                    <Controller
                      name="type"
                      control={control}
                      render={({ field }) => (
                        <div className="grid grid-cols-2 gap-1.5">
                          {fragmentTypes.map((type) => {
                            const isActive = field.value === type;
                            const isDisabled = disabledTypeSet.has(type);
                            return (
                              <Button
                                key={type}
                                type="button"
                                variant="outline"
                                className={`justify-start border text-[11px] h-8 transition-all duration-150 ${typeButtonStyles[type]} ${
                                  isActive
                                    ? "ring-2 ring-offset-1 ring-stone-300 opacity-100"
                                    : isDisabled
                                      ? "opacity-20"
                                      : "opacity-50 hover:opacity-80"
                                } px-3 rounded-lg`}
                                onClick={() => {
                                  if (!isDisabled) field.onChange(type);
                                }}
                                disabled={isDisabled}
                              >
                                {formatTypeLabel(type)}
                              </Button>
                            );
                          })}
                        </div>
                      )}
                    />
                  </div>

                  {/* Content Area */}
                  <div>
                    <label
                      htmlFor="fragment-content"
                      className="text-[13px] font-medium text-stone-600 block mb-1.5"
                    >
                      Content
                    </label>
                    <Textarea
                      id="fragment-content"
                      {...register("content")}
                      className="min-h-24 text-[14px] bg-stone-50 border-stone-200 focus-visible:ring-stone-300 rounded-lg leading-relaxed resize-none"
                      placeholder="Write your fragment..."
                    />
                    {errors.content?.message && (
                      <p className="text-[12px] text-red-500 mt-1 font-medium">
                        {String(errors.content.message)}
                      </p>
                    )}
                  </div>

                  {/* Node Selector (if not locked) */}
                  {!lockNodeSelection && (
                    <div>
                      <label className="text-[13px] font-medium text-stone-600 block mb-1.5">
                        Parent Node
                      </label>
                      <Controller
                        name="nodeId"
                        control={control}
                        render={({ field }) => (
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <SelectTrigger className="w-full h-10 bg-stone-50 border-stone-200 rounded-lg text-[14px]">
                              <SelectValue placeholder="Select a node" />
                            </SelectTrigger>
                            <SelectContent className="bg-white border-stone-200 rounded-xl">
                              {nodes.map((node) => (
                                <SelectItem
                                  key={node.id}
                                  value={node.id}
                                  className="text-[13px] rounded-lg"
                                >
                                  {node.title}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                      {errors.nodeId?.message && (
                        <p className="text-[12px] text-red-500 mt-1 font-medium">
                          {String(errors.nodeId.message)}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {error ? (
                  <p className="text-[13px] text-red-500 mt-3">{error}</p>
                ) : null}

                <div className="flex items-center justify-end gap-2 mt-5">
                  <Button
                    type="button"
                    onClick={() => onOpenChange(false)}
                    variant="ghost"
                    className="text-[13px] text-stone-500 hover:text-stone-700 h-9 rounded-lg"
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="h-9 px-5 text-[13px] bg-stone-800 hover:bg-stone-700 text-white rounded-lg"
                    disabled={loading}
                  >
                    {loading ? "Creating..." : "Create"}
                  </Button>
                </div>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CreateFragmentForm;
