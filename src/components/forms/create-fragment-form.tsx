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
  QUESTION: "border-primary bg-primary/10 text-primary",
  IDEA: "border-[#005b96] bg-[#005b96]/10 text-[#005b96]",
  OBSERVATION: "border-[#dc8b30] bg-[#dc8b30]/10 text-[#dc8b30]",
  CONSTRAINS: "border-destructive bg-destructive/10 text-destructive",
  CONCLUSION: "border-[#52bf90] bg-[#52bf90]/10 text-[#52bf90]",
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

  const formatTypeLabel = (value: (typeof fragmentTypes)[number]) =>
    value.charAt(0) + value.slice(1).toLowerCase();

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
            className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => onOpenChange(false)}
          >
            <motion.div
              className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2"
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="rounded-2xl bg-background border border-border shadow-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-serif text-xl text-foreground">
                    Create Fragment
                  </h2>
                  <button
                    onClick={() => onOpenChange(false)}
                    className="text-muted-foreground hover:text-foreground transition-colors rounded-md p-1"
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
                            <FormLabel>Type</FormLabel>
                            <FormControl>
                              <div className="grid grid-cols-2 gap-2">
                                {fragmentTypes.map((type) => {
                                  const isActive = field.value === type;
                                  const isDisabled = disabledTypeSet.has(type);
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
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={fragmentForm.control}
                        name="content"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Content</FormLabel>
                            <FormControl>
                              <Textarea
                                {...field}
                                className="min-h-24"
                                placeholder="Write your fragment..."
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {!lockNodeSelection ? (
                        <FormField
                          control={fragmentForm.control}
                          name="nodeId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Node</FormLabel>
                              <FormControl>
                                <Select
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                  value={field.value}
                                >
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select a node" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {nodes.map((node) => (
                                      <SelectItem key={node.id} value={node.id}>
                                        {node.title}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      ) : null}
                    </div>

                    {error ? (
                      <p className="text-sm text-destructive mt-4">{error}</p>
                    ) : null}

                    <div className="flex items-center justify-end gap-3 mt-6">
                      <Button
                        type="button"
                        onClick={() => onOpenChange(false)}
                        variant="secondary"
                        className="rounded-full px-5"
                        disabled={loading}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        className="rounded-full px-6"
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
