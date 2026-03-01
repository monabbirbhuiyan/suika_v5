"use client";
import React from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Box, Plus, Sparkles } from "lucide-react";
import Link from "next/link";
import { Button } from "../ui/button";
import { ProblemSpace, User } from "@/generated/prisma";
import CreateNewProblemSpaceForm from "../forms/create-problem-space-form";

type Props = {
  problemSpace: ProblemSpace[];
};

const ProblemSpaceContainer = ({ problemSpace }: Props) => {
  const [createOpen, setCreateOpen] = React.useState(false);
  const spaces = problemSpace || [];

  return (
    <div className="p-8 max-w-5xl w-full mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-3xl text-foreground">
              Problem Spaces
            </h1>
            <p className="mt-2 text-muted-foreground text-sm leading-relaxed">
              Each space holds a question you are working through. Open one to
              continue, or start fresh.
            </p>
          </div>
          <Button
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium text-background hover:opacity-90 transition-opacity shrink-0"
          >
            <Plus className="h-4 w-4" />
            Create Problem Space
          </Button>
        </div>
      </motion.div>

      {spaces.length > 0 ? (
        <motion.div
          className="grid grid-cols-2 gap-4 mt-8"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {spaces.map((space) => (
            <Link
              key={space.id}
              href={`problem-spaces/${space.id}`}
              className="rounded-xl bg-card p-6 text-left hover:ring-1 hover:ring-sage/30 transition-all group block"
            >
              <div className="flex items-start justify-between">
                <h3 className="font-sans font-medium text-foreground group-hover:text-sage transition-colors">
                  {space.title}
                </h3>
                {/* <span
                  className={`text-xs px-2.5 py-1 rounded-full bg-opacity-15 ${space.sentimentColor}`}
                >
                  {space.sentiment}
                </span> */}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {/* {space.fragments} fragments &middot; Updated {space.updated} */}
              </p>
              <div className="mt-4 h-1.5 bg-border/60 rounded-full overflow-hidden">
                <div
                  className="h-full bg-sage/60 rounded-full transition-all"
                  style={{ width: `${space.progress}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">
                {space.progress}% clarity
              </p>
            </Link>
          ))}

          {/* New space CTA card */}
          <button
            onClick={() => setCreateOpen(true)}
            className="rounded-xl border-2 border-dashed border-border p-6 flex flex-col items-center justify-center gap-3 text-muted-foreground hover:text-sage hover:border-sage/40 transition-all group min-h-40"
          >
            <div className="rounded-full bg-card p-3 group-hover:bg-sage/15 transition-colors">
              <Plus className="h-5 w-5" />
            </div>
            <span className="text-sm font-medium">New Problem Space</span>
          </button>
        </motion.div>
      ) : (
        /* Empty state */
        <motion.div
          className="mt-16 flex flex-col items-center text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="rounded-full bg-card p-5">
            <Box className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="font-serif text-xl text-foreground mt-6">
            No problem spaces yet
          </h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-sm leading-relaxed">
            A problem space is a container for a question you are working
            through. Create your first one to begin making sense of something.
          </p>
          <button
            onClick={() => setCreateOpen(true)}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-sage px-6 py-3 text-sm font-medium text-background hover:opacity-90 transition-opacity"
          >
            <Plus className="h-4 w-4" />
            Create your first Problem Space
          </button>
        </motion.div>
      )}

      <CreateNewProblemSpaceForm
        open={createOpen}
        onOpenChange={setCreateOpen}
      />
    </div>
  );
};

export default ProblemSpaceContainer;
