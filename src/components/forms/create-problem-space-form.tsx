"use client";
import { createProblemSpace } from "@/action/problem-space";
import { ProblemSpaceFormValues, problemSpaceSchema } from "@/lib/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { MdDescription, MdTitle } from "react-icons/md";
import { Form, FormControl, FormField, FormItem, FormLabel } from "../ui/form";
import { Input } from "../ui/input";
import { Button } from "../ui/button";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const CreateNewProblemSpaceForm = ({ open, onOpenChange }: Props) => {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);

  const problemSpaceForm = useForm<ProblemSpaceFormValues>({
    resolver: zodResolver(problemSpaceSchema),
    defaultValues: {
      title: "",
      description: "",
    },
  });

  const onSubmit = async (data: ProblemSpaceFormValues) => {
    setError(null);

    try {
      const response = await createProblemSpace(data);
      if (!response) {
        toast.error("You must be logged in to create a problem space.");
        return;
      }
      toast.success("Problem space created successfully!");
      onOpenChange(false);
      router.push(`problem-spaces/${response.id}`);
    } catch (error) {
      toast.error("Failed to create problem space. Please try again.");
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => onOpenChange(false)}
          >
            {/* Dialog */}
            <motion.div
              className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2"
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="rounded-2xl bg-background border border-border shadow-xl p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-serif text-xl text-foreground">
                    Create Problem Space
                  </h2>
                  <button
                    onClick={() => onOpenChange(false)}
                    className="text-muted-foreground hover:text-foreground transition-colors rounded-md p-1"
                    aria-label="Close dialog"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Form */}
                <Form {...problemSpaceForm}>
                  <form onSubmit={problemSpaceForm.handleSubmit(onSubmit)}>
                    <div className="flex flex-col gap-5">
                      {/* Title */}
                      <FormField
                        control={problemSpaceForm.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Title</FormLabel>
                            <FormControl>
                              <div className="relative group">
                                <MdTitle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-300" />
                                <Input
                                  {...field}
                                  className="transition-all duration-200 focus:scale-[1.01] pl-10"
                                />
                              </div>
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      {/* Description */}
                      <FormField
                        control={problemSpaceForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <div className="relative group">
                                <MdDescription className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-300" />
                                <Input
                                  {...field}
                                  className="transition-all duration-200 focus:scale-[1.01] pl-10"
                                />
                              </div>
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 mt-6">
                      <Button
                        onClick={() => onOpenChange(false)}
                        className="rounded-full px-5 py-2 text-sm font-medium text-muted-foreground hover:text-foreground bg-card transition-colors"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        className="rounded-full bg-sage px-6 py-2 text-sm font-medium text-background hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Create
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

export default CreateNewProblemSpaceForm;
