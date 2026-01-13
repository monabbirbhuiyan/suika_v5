import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "What makes Suika different from note-taking apps?",
    answer:
      "Most note apps focus on organization and retrieval. Suika focuses on reducing uncertainty. Instead of filing things away, you're actively connecting ideas and tracking which questions remain unanswered. The graph visualization shows you where clarity exists and where it doesn't.",
  },
  {
    question: "Why can't I move nodes in the graph?",
    answer:
      "The read-only graph is intentional. When you can drag nodes around, you end up spending time on layout instead of meaning. By forcing the graph to auto-layout based on semantic connections, Suika keeps you focused on what matters: reducing uncertainty through understanding relationships.",
  },
  {
    question: "How is the clarity score calculated?",
    answer:
      "The clarity score considers multiple factors: how many questions have been resolved, the density of semantic connections, whether contradictions exist, and how well-supported your insights are. It increases as you answer questions and decreases when you add new ones—reflecting real progress.",
  },
  {
    question: "Can I collaborate with others?",
    answer:
      "Currently, Suika is designed for individual exploratory work. We believe the early stages of thinking through problems benefit from personal reflection. However, Pro users can export their spaces to share insights with collaborators.",
  },
  {
    question: "What happens to my data?",
    answer:
      "Your fragments and connections are stored securely and privately. We never train AI models on your data or share it with third parties. You maintain full ownership and can export or delete your data at any time.",
  },
  {
    question: "Is there a limit to how many fragments I can create?",
    answer:
      "Free accounts can create unlimited fragments across 3 problem spaces. Pro accounts have unlimited spaces. We believe the value comes from quality connections, not quantity, but we don't want to artificially limit your thinking.",
  },
];

const FAQSection = () => {
  return (
    <section className="relative z-10 container mx-auto px-4 py-24 bg-muted/30">
      <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
        Frequently asked questions
      </h2>
      <div className="max-w-3xl mx-auto">
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="text-left hover:no-underline">
                <span className="font-semibold text-base">{faq.question}</span>
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-muted-foreground leading-relaxed">
                  {faq.answer}
                </p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};
export default FAQSection;
