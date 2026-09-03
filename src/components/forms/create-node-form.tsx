"use client";

import { createNode } from "@/action/fragments";
import { CreateNodeFormValues, createNodeSchema } from "@/lib/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import { Button } from "../ui/button";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  problemSpaceId: string;
};

const CreateNodeForm = ({ open, onOpenChange, problemSpaceId }: Props) => {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const nodeForm = useForm<CreateNodeFormValues>({
    resolver: zodResolver(createNodeSchema),
    defaultValues: {
      title: "",
    },
  });

  const onSubmit = async (data: CreateNodeFormValues) => {
    setLoading(true);
    setError(null);

    try {
      const response = await createNode(problemSpaceId, data);
      if (!response) {
        setError("Unable to create node.");
        toast.error("Unable to create node.");
        return;
      }

      toast.success("Node created successfully!");
      nodeForm.reset({ title: "" });
      onOpenChange(false);
      router.refresh();
    } catch {
      setError("Failed to create node. Please try again.");
      toast.error("Failed to create node. Please try again.");
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
              className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2"
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="rounded-2xl bg-white border border-stone-200 shadow-xl p-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-[15px] font-semibold text-stone-800">
                    New Node
                  </h2>
                  <button
                    onClick={() => onOpenChange(false)}
                    className="text-stone-300 hover:text-stone-500 transition-colors rounded-lg p-1 hover:bg-stone-50"
                    aria-label="Close dialog"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <Form {...nodeForm}>
                  <form onSubmit={nodeForm.handleSubmit(onSubmit)}>
                    <FormField
                      control={nodeForm.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[13px] text-stone-600">
                            Node Name
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              className="h-10 bg-stone-50 border-stone-200 focus-visible:ring-stone-300 text-[14px] rounded-lg"
                              placeholder="e.g. Damages, Liability, Jurisdiction..."
                            />
                          </FormControl>
                          <FormMessage className="text-[12px]" />
                        </FormItem>
                      )}
                    />

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
                        {loading ? "Creating..." : "Create Node"}
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

export default CreateNodeForm;
