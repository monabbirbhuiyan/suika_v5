"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";

import { CreateNodeFormValues, createNodeSchema } from "@/lib/schemas";
import { toast } from "@/components/ui/toast";
import { Input } from "../ui/input";
import { Button } from "../ui/button";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  problemSpaceId: string;
};

const CreateNodeForm = ({ open, onOpenChange, problemSpaceId }: Props) => {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateNodeFormValues>({
    resolver: zodResolver(createNodeSchema),
    defaultValues: {
      title: "",
    },
  });

  const onSubmit = async (data: CreateNodeFormValues) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("http://127.0.0.1:8000/api/nodes/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problem_space_id: problemSpaceId,
          label: data.title,
          content: JSON.stringify({ raw: data.title }),
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }

      toast.add({
        type: "success",
        description: "Node created successfully.",
      });

      reset({ title: "" });
      onOpenChange(false);
      router.refresh();
    } catch (err) {
      console.error("FastAPI node creation error:", err);
      setError("Failed to create node. Please try again.");
      toast.add({
        type: "error",
        description: "Failed to create node via Python backend.",
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
            className="w-full max-w-sm"
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
                  type="button"
                  onClick={() => onOpenChange(false)}
                  className="text-stone-300 hover:text-stone-500 transition-colors rounded-lg p-1 hover:bg-stone-50"
                  aria-label="Close dialog"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)}>
                <div>
                  <label
                    htmlFor="node-title"
                    className="text-[13px] font-medium text-stone-600 block mb-1.5"
                  >
                    Node Name
                  </label>
                  <Input
                    id="node-title"
                    {...register("title")}
                    className="h-10 bg-stone-50 border-stone-200 focus-visible:ring-stone-300 text-[14px] rounded-lg"
                    placeholder="e.g. Damages, Liability, Limitation Period..."
                  />
                  {errors.title?.message && (
                    <p className="text-[12px] text-red-500 mt-1 font-medium">
                      {String(errors.title.message)}
                    </p>
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
                    {loading ? "Creating..." : "Create Node"}
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

export default CreateNodeForm;
