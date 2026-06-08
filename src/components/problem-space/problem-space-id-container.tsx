"use client";
import React from "react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import {
  AiSuggestion,
  GraphNode,
  ProblemSpace,
  Fragment,
  User,
} from "@/generated/prisma";
import Link from "next/link";
import { ArrowLeft, Pencil, Plus, Sparkles } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import LoadingSpinner from "../global/loading-spinner";
import { Button } from "../ui/button";
import CreateNodeForm from "../forms/create-node-form";
import ProblemSpaceNodes from "./node";
import AiWeavingPanel from "./ai-weaving-panel";
import ConcludeProblemSpacePanel from "./conclude-problem-space-panel";
import EditProblemSpaceForm from "../forms/edit-problem-space-form";

const ClarityGraphCanvas = dynamic(
  () => import("@/components/problem-space/clarity-graph-canvas"),
  {
    ssr: false,
    loading: () => (
      <LoadingSpinner
        variant="inline"
        label="Loading Clarity Graph..."
        className="min-h-20"
      />
    ),
  },
);

type Props = {
  user: User;
  problemSpace: ProblemSpace & {
    fragments?: Fragment[];
    graphNodes?: GraphNode[];
    suggestions?: AiSuggestion[];
  };
};

const ProblemSpaceIdContainer = ({ user, problemSpace }: Props) => {
  const [aiOpen, setAiOpen] = React.useState(true);
  const [createNodeOpen, setCreateNodeOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const fragments = Array.isArray(problemSpace.fragments)
    ? problemSpace.fragments
    : null;
  const graphNodes = Array.isArray(problemSpace.graphNodes)
    ? problemSpace.graphNodes
    : null;
  const suggestions = Array.isArray(problemSpace.suggestions)
    ? problemSpace.suggestions
    : [];

  return (
    <motion.div
      className="flex flex-col h-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="px-5 py-3 border-b border-border/40 flex items-center justify-between bg-background shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href={`/problem-spaces/${user.id}`}
            className="text-muted-foreground hover:text-foreground transition-colors rounded-md p-1 flex flex-row items-center gap-1"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>

          <div>
            <h2 className="font-serif text-lg text-foreground">
              {problemSpace.title}
            </h2>
            <p className="text-[10px] text-muted-foreground">
              {problemSpace.fragments?.length} fragements &middot;{" "}
              {problemSpace.progress} % clarity &middot; Last updated:{" "}
              {problemSpace.updatedAt.toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setEditOpen(true)}
            className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium"
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit Details
          </Button>
          <button
            onClick={() => setAiOpen(!aiOpen)}
            className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium transition-all ${
              aiOpen
                ? "bg-sage text-background"
                : "bg-card text-muted-foreground hover:text-foreground"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            AI Weaving
          </button>
        </div>
      </div>

      <EditProblemSpaceForm
        open={editOpen}
        onOpenChange={setEditOpen}
        problemSpaceId={problemSpace.id}
        initialTitle={problemSpace.title}
        initialDescription={problemSpace.description}
        userId={user.id}
      />

      {/* tabs */}
      <Tabs defaultValue="Nodes" className="flex-1 gap-0">
        {aiOpen ? (
          <div className="border-b border-border/40 bg-background px-5 py-3">
            <AiWeavingPanel
              problemSpaceId={problemSpace.id}
              suggestions={suggestions}
            />
          </div>
        ) : null}

        <ConcludeProblemSpacePanel problemSpaceId={problemSpace.id} />

        <div className="px-5 py-3 border-b border-border/40 bg-background shrink-0">
          <TabsList className="w-full flex mx-auto">
            <TabsTrigger value="Nodes">Nodes</TabsTrigger>
            <TabsTrigger value="clarity-graph">Clarity Graph</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="Nodes" className="p-5">
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setCreateNodeOpen(true)}
              variant="secondary"
              className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium"
            >
              <Plus className="h-4 w-4" />
              Create Node
            </Button>
            <CreateNodeForm
              open={createNodeOpen}
              onOpenChange={setCreateNodeOpen}
              problemSpaceId={problemSpace.id}
            />
          </div>
          {!graphNodes || graphNodes.length === 0 ? (
            <p className="mt-2 text-xs text-muted-foreground">
              Create at least one node first. Fragments are added inside nodes.
            </p>
          ) : null}
          {fragments === null ? (
            <LoadingSpinner
              variant="inline"
              label="Loading Fragements..."
              className="min-h-20"
            />
          ) : null}
          {fragments !== null && graphNodes && graphNodes.length > 0 ? (
            <ProblemSpaceNodes
              problemSpaceId={problemSpace.id}
              graphNodes={graphNodes}
              fragments={fragments}
            />
          ) : null}
        </TabsContent>

        <TabsContent value="clarity-graph" className="p-5">
          {graphNodes === null ? (
            <LoadingSpinner
              variant="inline"
              label="Loading Clarity Graph..."
              className="min-h-20"
            />
          ) : (
            <ClarityGraphCanvas
              problemSpaceId={problemSpace.id}
              graphNodes={graphNodes}
              fragments={fragments || []}
            />
          )}
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};

export default ProblemSpaceIdContainer;
