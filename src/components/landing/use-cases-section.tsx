import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Lightbulb,
  GitBranch,
  Target,
  Sparkles,
  Network,
  Zap,
} from "lucide-react";

type Props = {};

const UseCasesSection = (props: Props) => {
  return (
    <section className="relative z-10 container mx-auto px-4 py-24">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Perfect for exploratory work
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Suika shines when you&apos;re figuring things out, not executing
          predefined plans
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
        <Card className="border-border bg-card/50 backdrop-blur-sm">
          <CardContent className="p-6 space-y-4">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Lightbulb className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold">Product Strategy</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Explore market opportunities, customer needs, and constraints.
              Connect insights as you interview users and discover patterns.
            </p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card/50 backdrop-blur-sm">
          <CardContent className="p-6 space-y-4">
            <div className="h-12 w-12 rounded-lg bg-secondary/10 flex items-center justify-center">
              <GitBranch className="h-6 w-6 text-secondary" />
            </div>
            <h3 className="text-lg font-semibold">Research Projects</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Track research questions, emerging hypotheses, and contradictory
              findings. See which questions remain and which have been resolved.
            </p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card/50 backdrop-blur-sm">
          <CardContent className="p-6 space-y-4">
            <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center">
              <Target className="h-6 w-6 text-accent" />
            </div>
            <h3 className="text-lg font-semibold">Career Decisions</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Map out options, constraints, and observations about different
              paths. Visualize how each consideration relates to others.
            </p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card/50 backdrop-blur-sm">
          <CardContent className="p-6 space-y-4">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold">Content Planning</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Develop article ideas, connect related concepts, and track open
              questions. See which themes have enough depth to write about.
            </p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card/50 backdrop-blur-sm">
          <CardContent className="p-6 space-y-4">
            <div className="h-12 w-12 rounded-lg bg-secondary/10 flex items-center justify-center">
              <Network className="h-6 w-6 text-secondary" />
            </div>
            <h3 className="text-lg font-semibold">Problem Solving</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Break down complex problems into questions, constraints, and
              potential solutions. Track how insights connect to resolve
              uncertainty.
            </p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card/50 backdrop-blur-sm">
          <CardContent className="p-6 space-y-4">
            <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center">
              <Zap className="h-6 w-6 text-accent" />
            </div>
            <h3 className="text-lg font-semibold">Learning Topics</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Capture questions while learning, connect them to insights as you
              discover answers. Watch your understanding grow visually.
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default UseCasesSection;
