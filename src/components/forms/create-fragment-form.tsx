"use client";

import {
  FragmentFormValues,
  fragmentSchema,
  fragmentTypes,
  singleInstanceFragmentTypes,
} from "@/lib/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { GraphNode } from "@/generated/prisma";
import { Fragment } from "@/generated/prisma";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Textarea } from "../ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Button } from "../ui/button";
import { createFragment } from "@/action/fragments";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  problemSpaceId: string;
  nodes: Pick<GraphNode, "id" | "title">[];
  fragments: Pick<Fragment, "id" | "nodeId" | "type">[];
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
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const fragmentForm = useForm<FragmentFormValues>({
    resolver: zodResolver(fragmentSchema),
    defaultValues: {
      content: "",
      nodeId: "",
      type: "QUESTION",
    },
  });

  React.useEffect(() => {
    if (!open) {
      return;
    }

    if (lockNodeSelection && initialNodeId) {
      fragmentForm.setValue("nodeId", initialNodeId);
    }
  }, [open, initialNodeId, lockNodeSelection, fragmentForm]);

  const watchedNodeId = fragmentForm.watch("nodeId");
  const selectedNodeId = lockNodeSelection
    ? (initialNodeId ?? "")
    : watchedNodeId;

  const disabledTypeSet = React.useMemo(() => {
    if (!selectedNodeId) {
      return new Set<(typeof fragmentTypes)[number]>();
    }

    const disabled = new Set<(typeof fragmentTypes)[number]>();

    fragments.forEach((fragment) => {
      if (
        fragment.nodeId === selectedNodeId &&
        singleInstanceFragmentTypeSet.has(fragment.type)
      ) {
        disabled.add(fragment.type);
      }
    });

    return disabled;
  }, [fragments, selectedNodeId]);

  React.useEffect(() => {
    const currentType = fragmentForm.getValues("type");

    if (!disabledTypeSet.has(currentType)) {
      return;
    }

    const fallbackType = fragmentTypes.find(
      (type) => !disabledTypeSet.has(type),
    );

    if (fallbackType) {
      fragmentForm.setValue("type", fallbackType);
    }
  }, [disabledTypeSet, fragmentForm]);

  const formatTypeLabel = (value: (typeof fragmentTypes)[number]) => {
    const labels: Record<string, string> = {
      QUESTION: "Question",
      IDEA: "Idea",
      OBSERVATION: "Observation",
      CONSTRAINS: "Constraint",
      CONCLUSION: "Conclusion",
    };
    return (
      labels[value] ??
      value.charAt(0) + value.slice(1).toLowerCase().replace("_", " ")
    );
  };

  const onSubmit = async (data: FragmentFormValues) => {
    setLoading(true);
    setError(null);

    try {
      const nodeId = lockNodeSelection ? initialNodeId || "" : data.nodeId;

      if (!nodeId) {
        setError("Node is required.");
        toast.error("Node is required.");
        return;
      }

      if (
        singleInstanceFragmentTypeSet.has(data.type) &&
        fragments.some(
          (fragment) =>
            fragment.nodeId === nodeId && fragment.type === data.type,
        )
      ) {
        const formattedType =
          data.type.charAt(0) + data.type.slice(1).toLowerCase();
        setError(`Only one ${formattedType} is allowed per node.`);
        toast.error(`Only one ${formattedType} is allowed per node.`);
        return;
      }

      const response = await createFragment(problemSpaceId, {
        ...data,
        nodeId,
      });
      if (!response) {
        setError("Unable to create fragment.");
        toast.error("Unable to create fragment.");
        return;
      }

      toast.success("Fragment created successfully!");
      fragmentForm.reset({
        content: "",
        nodeId: lockNodeSelection && initialNodeId ? initialNodeId : "",
        type: "QUESTION",
      });
      onOpenChange(false);
      router.refresh();
    } catch {
      setError("Failed to create fragment. Please try again.");
      toast.error("Failed to create fragment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 bg-stone-900/20 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => onOpenChange(false)}
          >
            <motion.div
              className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2"
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
                    onClick={() => onOpenChange(false)}
                    className="text-stone-300 hover:text-stone-500 transition-colors rounded-lg p-1 hover:bg-stone-50"
                    aria-label="Close dialog"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <Form {...fragmentForm}>
                  <form onSubmit={fragmentForm.handleSubmit(onSubmit)}>
                    <div className="flex flex-col gap-4">
                      <FormField
                        control={fragmentForm.control}
                        name="type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[13px] text-stone-600">
                              Type
                            </FormLabel>
                            <FormControl>
                              <div className="grid grid-cols-2 gap-1.5">
                                {fragmentTypes.map((type) => {
                                  const isActive = field.value === type;
                                  const isDisabled = disabledTypeSet.has(type);
                                  return (
                                    <Button
                                      key={type}
                                      type="button"
                                      variant="outline"
                                      className={`justify-start border text-[11px] h-8 transition-all duration-150 hover:cursor-pointer ${typeButtonStyles[type]} ${
                                        isActive
                                          ? "ring-2 ring-offset-1 ring-stone-300 opacity-100"
                                          : isDisabled
                                            ? "opacity-20"
                                            : "opacity-50 hover:opacity-80"
                                      } px-3 rounded-lg`}
                                      onClick={() => {
                                        if (!isDisabled) {
                                          field.onChange(type);
                                        }
                                      }}
                                      disabled={isDisabled}
                                    >
                                      {formatTypeLabel(type)}
                                    </Button>
                                  );
                                })}
                              </div>
                            </FormControl>
                            <FormMessage className="text-[12px]" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={fragmentForm.control}
                        name="content"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[13px] text-stone-600">
                              Content
                            </FormLabel>
                            <FormControl>
                              <Textarea
                                {...field}
                                className="min-h-24 text-[14px] bg-stone-50 border-stone-200 focus-visible:ring-stone-300 rounded-lg leading-relaxed resize-none"
                                placeholder="Write your fragment..."
                              />
                            </FormControl>
                            <FormMessage className="text-[12px]" />
                          </FormItem>
                        )}
                      />

                      {!lockNodeSelection ? (
                        <FormField
                          control={fragmentForm.control}
                          name="nodeId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-[13px] text-stone-600">
                                Node
                              </FormLabel>
                              <FormControl>
                                <Select
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
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
                              </FormControl>
                              <FormMessage className="text-[12px]" />
                            </FormItem>
                          )}
                        />
                      ) : null}
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
                </Form>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CreateFragmentForm;
