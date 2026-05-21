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
import {} from "../ui/select";
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
      nodeForm.reset({
        title: "",
      });
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
                    Create Node
                  </h2>
                  <button
                    onClick={() => onOpenChange(false)}
                    className="text-muted-foreground hover:text-foreground transition-colors rounded-md p-1"
                    aria-label="Close dialog"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <Form {...nodeForm}>
                  <form onSubmit={nodeForm.handleSubmit(onSubmit)}>
                    <div className="flex flex-col gap-4">
                      <FormField
                        control={nodeForm.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Node Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
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
