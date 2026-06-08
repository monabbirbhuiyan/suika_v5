"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MdDescription, MdTitle } from "react-icons/md";
import { toast } from "sonner";
import { updateProblemSpace } from "@/action/problem-space";
import { ProblemSpaceFormValues, problemSpaceSchema } from "@/lib/schemas";
import { Form, FormControl, FormField, FormItem, FormLabel } from "../ui/form";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  problemSpaceId: string;
  initialTitle: string;
  initialDescription?: string | null;
  userId: string;
};

const EditProblemSpaceForm = ({
  open,
  onOpenChange,
  problemSpaceId,
  initialTitle,
  initialDescription,
  userId,
}: Props) => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const form = useForm<ProblemSpaceFormValues>({
    resolver: zodResolver(problemSpaceSchema),
    defaultValues: {
      title: initialTitle,
      description: initialDescription ?? "",
    },
  });

  React.useEffect(() => {
    if (!open) {
      return;
    }

    form.reset({
      title: initialTitle,
      description: initialDescription ?? "",
    });
  }, [form, initialDescription, initialTitle, open]);

  const onSubmit = async (data: ProblemSpaceFormValues) => {
    setIsSubmitting(true);

    try {
      const response = await updateProblemSpace(problemSpaceId, {
        title: data.title,
        description: data.description,
      });

      if (!response) {
        toast.error("Unable to update problem space.");
        return;
      }

      toast.success("Problem space updated.");
      onOpenChange(false);
      router.refresh();
    } catch {
      toast.error("Failed to update problem space. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/problem-spaces/${problemSpaceId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        throw new Error("Failed to delete problem space");
      }
      toast.success("Problem space deleted.");
      onOpenChange(false);
      router.push(`/problem-spaces/${userId}`);
      router.refresh();
    } catch {
      toast.error("Failed to delete problem space. Please try again.");
    } finally {
      setIsDeleting(false);
      setDeleteConfirmationOpen(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {open ? (
          <motion.div
            className="fixed inset-0 z-50 bg-foreground/20 backdrop-blur-sm"
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
              <div className="rounded-2xl border border-border bg-background p-6 shadow-xl">
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="font-serif text-xl text-foreground">
                    Edit Problem Space
                  </h2>
                  <button
                    onClick={() => onOpenChange(false)}
                    className="rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground"
                    aria-label="Close dialog"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)}>
                    <div className="flex flex-col gap-5">
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Title</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <MdTitle className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
                                <Input
                                  {...field}
                                  className="pl-10 transition-all duration-200 focus:scale-[1.01]"
                                />
                              </div>
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <MdDescription className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
                                <Input
                                  {...field}
                                  value={field.value ?? ""}
                                  className="pl-10 transition-all duration-200 focus:scale-[1.01]"
                                />
                              </div>
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="mt-6 flex items-center justify-between">
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={() => setDeleteConfirmationOpen(true)}
                        className="rounded-full px-5 py-2 text-sm font-medium transition-colors"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </Button>
                      <div className="flex gap-3">
                        <Button
                          type="button"
                          onClick={() => onOpenChange(false)}
                          className="rounded-full bg-card px-5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          disabled={isSubmitting}
                          className="rounded-full bg-sage px-6 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {isSubmitting ? "Saving..." : "Save Changes"}
                        </Button>
                      </div>
                    </div>
                  </form>
                </Form>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <Dialog open={deleteConfirmationOpen} onOpenChange={setDeleteConfirmationOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Problem Space</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this problem space? This action cannot be undone and will permanently remove all associated fragments, nodes, and connections.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmationOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EditProblemSpaceForm;
