"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowLeft, Pencil, Plus, Sparkles } from "lucide-react";

import { GraphNode, ProblemSpace, Fragment, AppUser } from "@/types/canva";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import LoadingSpinner from "../global/loading-spinner";
import { Button } from "../ui/button";
import CreateNodeForm from "../forms/create-node-form";
import ProblemSpaceNodes from "./node";
import ConcludeProblemSpacePanel from "./conclude-problem-space-panel";
import EditProblemSpaceForm from "../forms/edit-problem-space-form";

const CaseStudyForm = dynamic(() => import("../forms/case-study-form"), {
  ssr: false,
});

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
  user: AppUser;
  problemSpace: ProblemSpace & {
    fragments?: Fragment[];
    graphNodes?: GraphNode[];
  };
};

const ProblemSpaceIdContainer = ({ user, problemSpace }: Props) => {
  const [createNodeOpen, setCreateNodeOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const fragments = Array.isArray(problemSpace.fragments)
    ? problemSpace.fragments
    : [];
  const graphNodes = Array.isArray(problemSpace.graphNodes)
    ? problemSpace.graphNodes
    : [];

  const totalFragments = fragments.length;
  const totalNodes = graphNodes.length;

  return (
    <motion.div
      className="flex flex-col h-full"
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {/* Top bar */}
      <div className="border-b border-border/60 bg-background/80 backdrop-blur-sm shrink-0">
        <div className="px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href={`/problem-spaces/${user.id}`}
              className="text-muted-foreground hover:text-foreground transition-colors duration-150 rounded-lg p-1.5 -ml-1.5 hover:bg-muted flex items-center gap-1"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="text-[13px]">Back</span>
            </Link>

            <div className="h-5 w-px bg-border/60" />

            <div>
              <h1 className="text-base font-semibold leading-tight">
                {problemSpace.title}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-medium">
                  {totalNodes} node{totalNodes !== 1 ? "s" : ""}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-[11px] font-medium">
                  {totalFragments} fragment{totalFragments !== 1 ? "s" : ""}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-[11px] font-medium">
                  {problemSpace.progress ?? 0}% clarity
                </span>
              </div>
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setEditOpen(true)}
            className="text-[13px] text-muted-foreground hover:text-foreground h-8"
          >
            <Pencil className="h-3.5 w-3.5 mr-1.5" />
            Edit
          </Button>
        </div>

        <EditProblemSpaceForm
          open={editOpen}
          onOpenChange={setEditOpen}
          problemSpaceId={problemSpace.id}
          initialTitle={problemSpace.title}
          userId={user.id}
        />

        <ConcludeProblemSpacePanel
          problemSpaceId={problemSpace.id}
          userId={user.id}
        />
      </div>

      {/* Main tabs */}
      <Tabs defaultValue="Nodes" className="flex-1 min-h-0">
        <div className="px-6 bg-background border-b border-border/60 shrink-0">
          <div className="flex items-center justify-between">
            <TabsList className="h-10 bg-transparent rounded-none border-0 p-0 gap-0">
              <TabsTrigger
                value="Nodes"
                className="text-[13px] text-muted-foreground data-[state=active]:text-foreground data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none px-1 py-2.5 mr-4 transition-colors"
              >
                Nodes
              </TabsTrigger>
              <TabsTrigger
                value="clarity-graph"
                className="text-[13px] text-muted-foreground data-[state=active]:text-foreground data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none px-1 py-2.5 transition-colors"
              >
                Clarity Graph
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        <TabsContent value="Nodes" className="mt-0 p-6 overflow-auto">
          <CaseStudyForm problemSpaceId={problemSpace.id} />

          <div className="flex items-center justify-between mb-5">
            <p className="text-[13px] text-muted-foreground">
              {totalNodes} node{totalNodes !== 1 ? "s" : ""} · {totalFragments}{" "}
              fragment{totalFragments !== 1 ? "s" : ""}
            </p>
            <Button
              onClick={() => setCreateNodeOpen(true)}
              size="sm"
              variant="outline"
              className="h-8 text-[13px] rounded-lg"
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              New Node
            </Button>
            <CreateNodeForm
              open={createNodeOpen}
              onOpenChange={setCreateNodeOpen}
              problemSpaceId={problemSpace.id}
            />
          </div>

          {graphNodes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="h-16 w-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                <Sparkles className="h-6 w-6" />
              </div>
              <p className="text-[15px] font-medium text-foreground">
                Get started by importing a case study
              </p>
              <p className="text-[13px] text-muted-foreground mt-1.5 max-w-sm text-center leading-relaxed">
                Upload or paste a legal brief above and the neuro-symbolic
                engine will extract typed fragments and verify logic
                automatically.
              </p>
              <button
                onClick={() => setCreateNodeOpen(true)}
                className="text-[12px] text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2 mt-4"
              >
                or create a node manually
              </button>
            </div>
          ) : (
            <ProblemSpaceNodes
              problemSpaceId={problemSpace.id}
              graphNodes={graphNodes}
              fragments={fragments}
            />
          )}
        </TabsContent>

        <TabsContent value="clarity-graph" className="mt-0 p-6 overflow-auto">
          <ClarityGraphCanvas
            problemSpaceId={problemSpace.id}
            graphNodes={graphNodes}
            fragments={fragments}
          />
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};

export default ProblemSpaceIdContainer;
