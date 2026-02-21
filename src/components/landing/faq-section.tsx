"use client";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { motion } from "framer-motion";

const faqs = [
  {
    q: "What exactly is a Problem Space?",
    a: "A Problem Space is a container for a specific challenge, decision, or question you're exploring. It holds all your thoughts (Fragments), their relationships (the Clarity Graph), and any AI suggestions. Think of it as a dedicated thinking room.",
  },
  {
    q: "How is this different from a notes app?",
    a: "Notes apps store information. Suika helps you think. By connecting your thoughts visually and surfacing contradictions and patterns, Suika transforms scattered ideas into structured understanding.",
  },
  {
    q: "Does the AI make decisions for me?",
    a: "Never. Our AI is designed to be a gentle mirror, not an oracle. It suggests connections between your own thoughts and highlights patterns you might have missed. The understanding always comes from you.",
  },
  {
    q: "Is my data private?",
    a: "Absolutely. Your thoughts are encrypted at rest and in transit. We never train AI models on your personal data. You can export or delete everything at any time.",
  },
  {
    q: "Can I use Suika for professional work?",
    a: "Yes. Many users use Suika for complex project decisions, research synthesis, strategic planning, and team alignment. The Life Architect plan includes collaboration features.",
  },
  {
    q: "What happens when I reach clarity?",
    a: "You'll know. Suika tracks resolution status across your fragments. When contradictions resolve and patterns emerge, you can archive the Problem Space as a completed journey of understanding.",
  },
];

const FAQSection = () => {
  return (
    <section className="py-24 px-6 bg-card/50">
      <div className="max-w-2xl mx-auto">
        <motion.h2
          className="font-light text-3xl md:text-4xl text-center text-foreground mb-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          Questions & Answers
        </motion.h2>
        <motion.p
          className="text-center text-muted-foreground max-w-lg mx-auto mb-12 leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          Everything you might wonder before beginning.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`item-${i}`}
                className="border-border/60"
              >
                <AccordionTrigger className="text-left text-foreground hover:text-foreground/80 font-sans text-base py-5">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-sm leading-relaxed pb-5">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
};
export default FAQSection;
