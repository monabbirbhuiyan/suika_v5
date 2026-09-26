"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { toast } from "@/components/ui/toast";
import { ProblemSpaceFormValues, problemSpaceSchema } from "@/lib/schemas";
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProblemSpaceFormValues>({
    resolver: zodResolver(problemSpaceSchema),
    defaultValues: {
      title: initialTitle,
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        title: initialTitle,
      });
    }
  }, [open, initialTitle, reset]);

  const onSubmit = async (data: ProblemSpaceFormValues) => {
    setIsSubmitting(true);

    try {
      const res = await fetch(
        `http://127.0.0.1:8000/api/problem-spaces/${problemSpaceId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: data.title,
          }),
        },
      );

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      toast.add({
        type: "success",
        description: "Problem space updated successfully.",
      });

      onOpenChange(false);
      router.refresh();
    } catch (err) {
      console.error("FastAPI Update Error:", err);
      toast.add({
        type: "error",
        description: "Failed to update problem space via Python backend.",
        priority: "high",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      const res = await fetch(
        `http://127.0.0.1:8000/api/problem-spaces/${problemSpaceId}`,
        {
          method: "DELETE",
        },
      );

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      toast.add({
        type: "success",
        description: "Problem space deleted.",
      });

      onOpenChange(false);
      router.push(`/problem-spaces/${userId}`);
      router.refresh();
    } catch (err) {
      console.error("FastAPI Delete Error:", err);
      toast.add({
        type: "error",
        description: "Failed to delete problem space via Python backend.",
        priority: "high",
      });
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
            className="fixed inset-0 z-50 bg-stone-900/20 backdrop-blur-sm flex items-center justify-center p-4"
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
              <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xl">
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="text-[15px] font-semibold text-stone-800">
                    Edit Problem Space
                  </h2>
                  <button
                    type="button"
                    onClick={() => onOpenChange(false)}
                    className="rounded-lg p-1 text-stone-300 transition-colors hover:text-stone-500 hover:bg-stone-50"
                    aria-label="Close dialog"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)}>
                  <div className="flex flex-col gap-4">
                    <div>
                      <label
                        htmlFor="edit-space-title"
                        className="text-[13px] font-medium text-stone-600 block mb-1.5"
                      >
                        Title
                      </label>
                      <Input
                        id="edit-space-title"
                        {...register("title")}
                        className="h-10 bg-stone-50 border-stone-200 focus-visible:ring-stone-300 text-[14px] rounded-lg"
                      />
                      {errors.title?.message && (
                        <p className="text-xs text-red-500 mt-1 font-medium">
                          {String(errors.title.message)}
                        </p>
                      )}
                    </div>
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
              type="button"
              variant="secondary"
              onClick={() => setDeleteConfirmationOpen(false)}
              disabled={isDeleting}
              className="bg-stone-100 hover:bg-stone-200 text-stone-700 border-0 rounded-lg text-[13px]"
            >
              Cancel
            </Button>
            <Button
              type="button"
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
