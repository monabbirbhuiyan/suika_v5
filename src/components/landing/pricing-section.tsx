import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";

type Props = {};

const PricingSection = (props: Props) => {
  return (
    <section
      id="pricing"
      className="relative z-10 container mx-auto px-4 py-24"
    >
      <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
        Simple pricing
      </h2>
      <p className="text-center text-muted-foreground mb-12 text-lg">
        Try it free, upgrade when you&apos;re ready
      </p>
      <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
        <Card className="border-border bg-card/50 backdrop-blur-sm">
          <CardContent className="p-8 space-y-6">
            <div>
              <h3 className="text-2xl font-bold mb-2">Free</h3>
              <p className="text-muted-foreground">Perfect for exploration</p>
            </div>
            <div className="text-4xl font-bold">
              $0<span className="text-lg text-muted-foreground">/month</span>
            </div>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span className="text-sm">Up to 3 problem spaces</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span className="text-sm">Unlimited fragments</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span className="text-sm">Basic clarity graph</span>
              </li>
            </ul>
            <Button variant="outline" className="w-full bg-transparent">
              Get started
            </Button>
          </CardContent>
        </Card>
        <Card className="border-primary/50 bg-linear-to-br from-primary/10 to-secondary/10 backdrop-blur-sm relative">
          <div className="absolute -top-3 right-4 px-3 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded-full">
            Popular
          </div>
          <CardContent className="p-8 space-y-6">
            <div>
              <h3 className="text-2xl font-bold mb-2">Pro</h3>
              <p className="text-muted-foreground">For serious thinkers</p>
            </div>
            <div className="text-4xl font-bold">
              $12<span className="text-lg text-muted-foreground">/month</span>
            </div>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span className="text-sm">Unlimited problem spaces</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span className="text-sm">Advanced clarity graph</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span className="text-sm">
                  Session mode with AI suggestions
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span className="text-sm">Export and share</span>
              </li>
            </ul>
            <Button className="w-full bg-primary hover:bg-primary/90">
              Upgrade to Pro
            </Button>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default PricingSection;
