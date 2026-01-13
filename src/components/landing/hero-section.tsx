"use client";
import React from "react";
import { HeroHighlight } from "../global/hero-highlight";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  GitBranch,
  Lightbulb,
  Network,
  Sparkles,
  Target,
  TrendingDown,
  Zap,
} from "lucide-react";
import Link from "next/link";

const HeroSection = () => {
  return (
    <HeroHighlight
      containerClassName="min-h-screen w-full"
      className="w-full min-h-screen"
    >
      <section
        id="hero"
        className="relative min-h-screen flex items-center overflow-hidden w-full"
      >
        <div className="max-w-7xl mx-auto px-6 py-24 w-full">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-medium rounded-md mb-8"
              >
                FOR EXPLORATORY WORK
                <div className="flex items-center gap-2 ml-2">
                  <Sparkles className="w-4 h-4" />
                  <GitBranch className="w-4 h-4" />
                  <Network className="w-4 h-4" />
                </div>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1 }}
                className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 leading-[1.1]"
              >
                See progress
                <br />
                <span className="bg-linear-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                  while you&apos;re still
                </span>
                <br />
                figuring things out
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-lg text-muted-foreground mb-8 max-w-lg leading-relaxed"
              >
                A tool for reducing uncertainty. Create fragments of thought,
                connect them semantically, and watch your understanding
                emerge—without forcing structure too early.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="flex flex-col sm:flex-row items-start sm:items-center gap-4"
              >
                <Link href="/signup">
                  <button className="px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors inline-flex items-center gap-2">
                    Try demo
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </Link>
                <Link href="#how">
                  <button className="px-6 py-3 bg-secondary text-secondary-foreground font-semibold rounded-lg border border-border hover:bg-secondary/80 transition-colors">
                    How it works
                  </button>
                </Link>
              </motion.div>
            </motion.div>

            <div className="relative lg:h-150 hidden lg:block">
              {/* Clarity Score Card */}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="absolute top-0 right-0 w-72 bg-card rounded-xl shadow-lg border border-border p-4 z-10"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-semibold text-card-foreground">
                    Clarity Progress
                  </span>
                  <div className="px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded">
                    Active
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      Questions Resolved
                    </span>
                    <span className="text-sm font-bold text-primary">
                      12/18
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      Fragments Connected
                    </span>
                    <span className="text-sm font-bold text-card-foreground">
                      47
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      Clarity Score
                    </span>
                    <span className="text-sm font-bold text-secondary">
                      78%
                    </span>
                  </div>
                  <div className="mt-3 pt-3 border-t border-border">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                      <TrendingDown className="w-3 h-3" />
                      <span>Uncertainty Reduced</span>
                    </div>
                    <div className="text-lg font-bold text-card-foreground">
                      -34%
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Fragment Activity Card */}
              <motion.div
                initial={{ opacity: 0, x: -40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="absolute top-20 left-0 w-80 bg-card rounded-xl shadow-lg border border-border p-5"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-sm text-card-foreground">
                    Problem Space
                  </h3>
                  <div className="px-2 py-1 bg-secondary/10 text-secondary text-xs font-medium rounded">
                    In Progress
                  </div>
                </div>
                <div className="space-y-3">
                  {[
                    {
                      metric: "Questions",
                      value: "18",
                      change: "+3",
                      positive: true,
                    },
                    {
                      metric: "Insights",
                      value: "12",
                      change: "+5",
                      positive: true,
                    },
                    {
                      metric: "Constraints",
                      value: "8",
                      change: "+1",
                      positive: true,
                    },
                    {
                      metric: "Observations",
                      value: "9",
                      change: "+2",
                      positive: true,
                    },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-xs"
                    >
                      <span className="text-muted-foreground">
                        {item.metric}
                      </span>
                      <div className="text-right">
                        <div className="font-bold text-card-foreground">
                          {item.value}
                        </div>
                        <div
                          className={`text-xs ${
                            item.positive ? "text-primary" : "text-destructive"
                          }`}
                        >
                          {item.change}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Graph Layout Card */}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.8 }}
                className="absolute bottom-0 left-12 w-64 bg-card rounded-xl shadow-lg border border-border p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-linear-to-br from-primary to-secondary rounded-lg flex items-center justify-center text-primary-foreground font-bold">
                      <Network className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-card-foreground">
                        Auto Layout
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Read-only graph
                      </div>
                    </div>
                  </div>
                </div>
                <div className="border-t border-border pt-3">
                  <div className="text-xs font-semibold mb-2 text-card-foreground">
                    Connections Made
                  </div>
                  <div className="text-xs text-muted-foreground mb-1">
                    Last 7 days
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-card-foreground">
                      87
                    </span>
                    <span className="text-xs text-primary font-medium">
                      +23%
                    </span>
                  </div>
                </div>
              </motion.div>

              {/* Semantic Relationships Card */}
              <motion.div
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 1 }}
                className="absolute top-72 right-4 w-72 bg-card rounded-xl shadow-lg border border-border p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-card-foreground">
                    Recent Connections
                  </span>
                  <GitBranch className="w-4 h-4 text-secondary" />
                </div>
                <div className="space-y-3">
                  {[
                    {
                      task: "Clarifies question",
                      status: "Complete",
                      time: "2 min ago",
                    },
                    {
                      task: "Resolves constraint",
                      status: "Processing",
                      time: "5 min ago",
                    },
                    {
                      task: "Contradicts insight",
                      status: "Complete",
                      time: "8 min ago",
                    },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center ${
                          item.status === "Complete"
                            ? "bg-primary/10"
                            : "bg-secondary/10"
                        }`}
                      >
                        {item.status === "Complete" ? (
                          <CheckCircle2 className="w-4 h-4 text-primary" />
                        ) : (
                          <Zap className="w-4 h-4 text-secondary" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate text-card-foreground">
                          {item.task}
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs ${
                              item.status === "Complete"
                                ? "text-primary"
                                : "text-secondary"
                            }`}
                          >
                            {item.status}
                          </span>
                          <span className="text-xs text-muted-foreground/50">
                            •
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {item.time}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Small Floating Badges */}
              <motion.div
                initial={{ opacity: 0, y: -40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className="absolute top-32 right-20 bg-card rounded-lg shadow-lg border border-border px-4 py-2 flex items-center gap-2"
              >
                <Lightbulb className="w-4 h-4 text-secondary" />
                <span className="text-sm font-medium text-card-foreground">
                  New Insight
                </span>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.7 }}
                className="absolute bottom-32 right-0 bg-card rounded-lg shadow-lg border border-border px-3 py-2"
              >
                <div className="flex items-center gap-2 text-xs">
                  <TrendingDown className="w-4 h-4 text-primary" />
                  <span className="font-medium text-card-foreground">
                    Clarity Increase
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  +12% today
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.9 }}
                className="absolute bottom-44 left-0 bg-card rounded-xl shadow-lg border border-border p-3 w-52"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="text-xs font-semibold text-card-foreground">
                    Next Steps
                  </div>
                  <Target className="w-3 h-3 text-accent" />
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full" />
                    <span className="text-muted-foreground">
                      Resolve 6 questions
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-secondary rounded-full" />
                    <span className="text-muted-foreground">
                      Connect 4 insights
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-accent rounded-full" />
                    <span className="text-muted-foreground">
                      Review constraints
                    </span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>
    </HeroHighlight>
  );
};

export default HeroSection;
