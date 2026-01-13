import {
  CheckCircle2,
  GitBranch,
  Network,
  Sparkles,
  Target,
  Zap,
} from "lucide-react";
import React from "react";

type Props = {};

const FeaturesSection = (props: Props) => {
  return (
    <section className="relative z-10 container mx-auto px-4 py-24 bg-muted/80">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Powerful features for exploratory thinking
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Every feature is designed to help you reduce uncertainty and make
          meaningful progress
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
        <div className="space-y-6">
          <div className="flex gap-4">
            <div className="shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Fragment Types</h3>
              <p className="text-muted-foreground leading-relaxed">
                Organize your thoughts with four distinct fragment types:
                Questions (what you don&apos;t know), Insights (what you&apos;ve
                discovered), Constraints (what limits you), and Observations
                (what you&apos;ve noticed). Each type plays a role in reducing
                uncertainty.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="shrink-0 w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center">
              <GitBranch className="w-6 h-6 text-secondary" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">
                Semantic Relationships
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Connect fragments with meaningful relationships: Clarifies (adds
                detail), Contradicts (shows conflicts), Resolves (answers
                questions), and Supports (adds evidence). The system uses these
                to measure your understanding.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="shrink-0 w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
              <Network className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">
                Force-Directed Graph
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Your fragments are automatically positioned using physics
                simulation. Strongly connected ideas cluster together, while
                unrelated ones drift apart. You can&apos;t manually arrange
                them—the layout reflects your actual understanding.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex gap-4">
            <div className="shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Target className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Clarity Score</h3>
              <p className="text-muted-foreground leading-relaxed">
                Track your progress with a dynamic clarity score that increases
                as you resolve questions, connect insights, and address
                constraints. See uncertainty decrease in real-time as you work
                through your problem space.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="shrink-0 w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center">
              <Zap className="w-6 h-6 text-secondary" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">
                Multiple Problem Spaces
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Keep different areas of exploration separate with isolated
                problem spaces. Work on a product strategy, research project,
                and personal decision simultaneously without mixing contexts.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="shrink-0 w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Progress Tracking</h3>
              <p className="text-muted-foreground leading-relaxed">
                Monitor fragment activity, connection density, and resolution
                rates. Unlike traditional task managers, Suika measures progress
                by how much clearer things become, not by how many boxes you
                check.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
