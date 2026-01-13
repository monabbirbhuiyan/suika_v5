"use client";
import React from "react";
import { Card, CardContent } from "../ui/card";
import { Lightbulb, Network, TrendingDown } from "lucide-react";

type Props = {};

const WhySuikaSection = (props: Props) => {
  return (
    <section id="why" className="relative z-10 container mx-auto px-4 py-24">
      <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
        Why Suika
      </h2>
      <p className="text-center text-muted-foreground mb-12 text-lg max-w-2xl mx-auto">
        Progress isn&apos;t always about completing tasks. It&apos;s about
        reducing uncertainty.
      </p>
      <div className="grid md:grid-cols-3 gap-8">
        <Card className="border-border bg-card/50 backdrop-blur-sm hover:bg-card/70 transition-all">
          <CardContent className="p-8 space-y-4">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Lightbulb className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">Capture everything</h3>
            <p className="text-muted-foreground leading-relaxed">
              Questions, ideas, constraints, observations—capture them as
              fragments without worrying about organization.
            </p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card/50 backdrop-blur-sm hover:bg-card/70 transition-all">
          <CardContent className="p-8 space-y-4">
            <div className="h-12 w-12 rounded-lg bg-secondary/10 flex items-center justify-center">
              <Network className="h-6 w-6 text-secondary" />
            </div>
            <h3 className="text-xl font-semibold">Connect semantically</h3>
            <p className="text-muted-foreground leading-relaxed">
              Link fragments by how they relate: clarifies, contradicts, or
              resolves. Watch patterns emerge.
            </p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card/50 backdrop-blur-sm hover:bg-card/70 transition-all">
          <CardContent className="p-8 space-y-4">
            <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center">
              <TrendingDown className="h-6 w-6 text-accent" />
            </div>
            <h3 className="text-xl font-semibold">Track clarity</h3>
            <p className="text-muted-foreground leading-relaxed">
              Measure progress by reduced uncertainty, not completed tasks. Feel
              momentum even while exploring.
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default WhySuikaSection;
