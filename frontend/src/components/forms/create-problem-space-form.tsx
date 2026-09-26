"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { MdTitle } from "react-icons/md";
import { toast } from "@/components/ui/toast";

import { ProblemSpaceFormValues, problemSpaceSchema } from "@/lib/schemas";
import { Input } from "../ui/input";
import { Button } from "../ui/button";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const CreateNewProblemSpaceForm = ({ open, onOpenChange }: Props) => {
  const router = useRouter();
  const pathname = usePathname();
  const [submitting, setSubmitting] = useState(false);

  // Extract the userId directly from the path: /problem-spaces/[userId]
  const pathSegments = pathname.split("/").filter(Boolean);
  const userIdFromPath = pathSegments[1] || "";

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProblemSpaceFormValues>({
    resolver: zodResolver(problemSpaceSchema),
    defaultValues: {
      title: "",
    },
  });

  const onSubmit = async (data: ProblemSpaceFormValues) => {
    if (!userIdFromPath) {
      toast.add({
        type: "error",
        description: "User context missing from URL.",
        priority: "high",
      });
      return;
    }

    setSubmitting(true);

    try {
      // Direct call to FastAPI backend
      const res = await fetch("http://127.0.0.1:8000/api/problem-spaces/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: data.title,
          user_id: userIdFromPath,
          description: "",
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const createdSpace = await res.json();

      toast.add({
        type: "Success",
        description: "Problem space created successfully!",
      });
      reset();
      onOpenChange(false);
      router.push(`/problem-spaces/${userIdFromPath}/${createdSpace.id}`);
      router.refresh();
    } catch (err) {
      console.error("FastAPI Space Creation Error:", err);
      toast.add({
        type: "error",
        description: "Failed to create problem space via Python backend.",
        priority: "high",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => onOpenChange(false)}
        >
          {/* Dialog Container */}
          <motion.div
            className="w-full max-w-md"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="rounded-2xl bg-background border border-border shadow-xl p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-serif text-xl font-semibold text-foreground">
                  Create Problem Space
                </h2>
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  className="text-muted-foreground hover:text-foreground transition-colors rounded-md p-1"
                  aria-label="Close dialog"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Form without ../ui/form dependency */}
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="flex flex-col gap-4">
                  <div>
                    <label
                      htmlFor="space-title"
                      className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5"
                    >
                      Title
                    </label>
                    <div className="relative group">
                      <MdTitle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors" />
                      <Input
                        id="space-title"
                        placeholder="e.g., Limitation Period Defence Evaluation"
                        {...register("title")}
                        className="pl-10"
                      />
                    </div>
                    {errors.title?.message && (
                      <p className="text-xs text-red-500 mt-1.5 font-medium">
                        {String(errors.title.message)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    className="rounded-full px-5 py-2 text-sm font-medium"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="rounded-full px-6 py-2 text-sm font-medium"
                  >
                    {submitting ? "Creating..." : "Create"}
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

export default CreateNewProblemSpaceForm;
