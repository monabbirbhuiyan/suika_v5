import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

const CTASection = () => {
  return (
    <section className="relative z-10 container mx-auto px-4 py-24">
      <Card className="border-primary/20 bg-linear-to-br from-primary/10 via-secondary/10 to-accent/10 backdrop-blur-sm max-w-4xl mx-auto">
        <CardContent className="p-12 text-center space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold">
            Ready to see your thinking?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Stop forcing structure too early. Start capturing fragments, connect
            them semantically, and watch your understanding emerge naturally.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href="/signup">
              <Button size="lg" className="bg-primary hover:bg-primary/90 px-8">
                Try demo - it&apos;s free
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="#how">
              <Button
                size="lg"
                variant="outline"
                className="px-8 bg-transparent"
              >
                Watch demo video
              </Button>
            </Link>
          </div>
          <p className="text-sm text-muted-foreground pt-4">
            No credit card required • 3 problem spaces free forever
          </p>
        </CardContent>
      </Card>
    </section>
  );
};

export default CTASection;
