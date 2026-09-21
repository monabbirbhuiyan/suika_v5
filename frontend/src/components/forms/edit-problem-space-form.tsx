"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { updateProblemSpace } from "@/action/problem-space";
import { ProblemSpaceFormValues, problemSpaceSchema } from "@/lib/schemas";
import { Form, FormControl, FormField, FormItem, FormLabel } from "../ui/form";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  problemSpaceId: string;
  initialTitle: string;
  userId: string;
};

const EditProblemSpaceForm = ({
  open,
  onOpenChange,
  problemSpaceId,
  initialTitle,
  userId,
}: Props) => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] =
    React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const form = useForm<ProblemSpaceFormValues>({
    resolver: zodResolver(problemSpaceSchema),
    defaultValues: {
      title: initialTitle,
    },
  });

  React.useEffect(() => {
    if (!open) {
      return;
    }

    form.reset({
      title: initialTitle,
    });
  }, [form, initialTitle, open]);

  const onSubmit = async (data: ProblemSpaceFormValues) => {
    setIsSubmitting(true);

    try {
      const response = await updateProblemSpace(problemSpaceId, {
        title: data.title,
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
            className="fixed inset-0 z-50 bg-stone-900/20 backdrop-blur-sm"
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
              <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xl">
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="text-[15px] font-semibold text-stone-800">
                    Edit Problem Space
                  </h2>
                  <button
                    onClick={() => onOpenChange(false)}
                    className="rounded-lg p-1 text-stone-300 transition-colors hover:text-stone-500 hover:bg-stone-50"
                    aria-label="Close dialog"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)}>
                    <div className="flex flex-col gap-4">
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[13px] text-stone-600">
                              Title
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                className="h-10 bg-stone-50 border-stone-200 focus-visible:ring-stone-300 text-[14px] rounded-lg"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />


                    </div>

                    <div className="mt-6 flex items-center justify-between">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setDeleteConfirmationOpen(true)}
                        className="text-[13px] text-red-400 hover:text-red-600 hover:bg-red-50 h-9 rounded-lg"
                      >
                        <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                        Delete
                      </Button>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          onClick={() => onOpenChange(false)}
                          variant="ghost"
                          className="text-[13px] text-stone-500 hover:text-stone-700 h-9 rounded-lg"
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          disabled={isSubmitting}
                          className="h-9 px-5 text-[13px] bg-stone-800 hover:bg-stone-700 text-white rounded-lg disabled:opacity-40"
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

      <Dialog
        open={deleteConfirmationOpen}
        onOpenChange={setDeleteConfirmationOpen}
      >
        <DialogContent className="bg-white border-stone-200 rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-stone-800 text-[15px]">
              Delete Problem Space
            </DialogTitle>
            <DialogDescription className="text-stone-500 text-[13px]">
              Are you sure? This will permanently remove all fragments, nodes,
              and connections.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="secondary"
              onClick={() => setDeleteConfirmationOpen(false)}
              disabled={isDeleting}
              className="bg-stone-100 hover:bg-stone-200 text-stone-700 border-0 rounded-lg text-[13px]"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600 text-white rounded-lg text-[13px]"
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
