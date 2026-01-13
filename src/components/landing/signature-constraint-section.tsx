import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";

type Props = {};

const SignatureConstraintSection = (props: Props) => {
  return (
    <section className="relative z-10 container mx-auto px-4 py-24">
      <Card className="border-primary/20 bg-linear-to-br from-primary/5 to-secondary/5 backdrop-blur-sm max-w-3xl mx-auto">
        <CardContent className="p-12 text-center space-y-6">
          <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
            <CheckCircle2 className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-3xl font-bold">The graph is read-only</h2>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto">
            You can&apos;t drag nodes around. The system positions fragments to
            reflect your understanding. This constraint forces you to focus on
            meaning, not layout.
          </p>
        </CardContent>
      </Card>
    </section>
  );
};

export default SignatureConstraintSection;
