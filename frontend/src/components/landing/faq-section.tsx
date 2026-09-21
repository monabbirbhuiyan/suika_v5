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
    q: "What kind of matters can I manage?",
    a: "Any matter you need to visualize—litigation, contracts, appeals, administrative law, and precedent research. Solo practitioners and firms of all sizes benefit from visual mapping of relationships, facts, and legal arguments.",
  },
  {
    q: "How secure is my client data?",
    a: "Encrypted at rest and in transit. We use SOC 2 Type II compliance standards and never train AI on your data. Enterprise plans include detailed compliance logging and role-based access controls.",
  },
  {
    q: "Can I export matter visualizations for clients?",
    a: "Yes. Export visualizations to share with clients and co-counsel, providing clear progress reports without exposing internal work.",
  },
  {
    q: "How does this differ from legal research tools?",
    a: "Research tools help you find cases. Suika helps you organize and visualize how cases and statutes connect to your matter—it's your strategic command center.",
  },
  {
    q: "Can I collaborate with co-counsel?",
    a: "Yes, on our Team plan. Share matters with co-counsel, set role-based permissions, and track changes—all within your workspace.",
  },
  {
    q: "Do you offer training or onboarding?",
    a: "We provide documentation and video guides for all users. Team plan customers receive dedicated onboarding to help your firm integrate Suika into your workflow.",
  },
];

const FAQSection = () => {
  return (
    <section className="py-24 px-6 bg-white">
      <div className="max-w-2xl mx-auto">
        <motion.h2
          className="font-light text-3xl md:text-4xl text-center text-brand-ink mb-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          Questions & Answers
        </motion.h2>
        <motion.p
          className="text-center text-[#577368] max-w-lg mx-auto mb-12 leading-relaxed"
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
                className="border-(--brand-green)/18"
              >
                <AccordionTrigger className="text-left text-brand-ink hover:text-brand-green font-sans text-base py-5">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-[#4c6359] text-sm leading-relaxed pb-5">
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
