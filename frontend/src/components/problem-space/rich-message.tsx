"use client";

import React from "react";
import {
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Scale,
  Lightbulb,
  Shield,
  Swords,
} from "lucide-react";

type Section = {
  title: string;
  icon: React.ReactNode;
  items: string[];
  variant: "green" | "red" | "blue" | "amber" | "purple" | "default";
};

const sectionPatterns: Array<{
  match: RegExp;
  icon: React.ReactNode;
  variant: Section["variant"];
}> = [
  {
    match: /argument|strength|strong/i,
    icon: <Swords className="h-3 w-3" />,
    variant: "green",
  },
  {
    match: /rebuttal|counter/i,
    icon: <Shield className="h-3 w-3" />,
    variant: "blue",
  },
  {
    match: /risk|obstacle|weakness|concern/i,
    icon: <AlertCircle className="h-3 w-3" />,
    variant: "red",
  },
  {
    match: /next step|recommendation|action/i,
    icon: <ArrowRight className="h-3 w-3" />,
    variant: "blue",
  },
  {
    match: /key factor|strength|advantage/i,
    icon: <CheckCircle2 className="h-3 w-3" />,
    variant: "green",
  },
  {
    match: /law|authority|statute|regulation/i,
    icon: <Scale className="h-3 w-3" />,
    variant: "purple",
  },
  {
    match: /strateg|approach|plan/i,
    icon: <Lightbulb className="h-3 w-3" />,
    variant: "amber",
  },
];

const variantClasses: Record<
  Section["variant"],
  { bg: string; border: string; icon: string; badge: string }
> = {
  green: {
    bg: "bg-[#dff3e7]/50",
    border: "border-[#12753e]/20",
    icon: "text-[#12753e]",
    badge: "bg-[#dff3e7] text-[#12753e]",
  },
  red: {
    bg: "bg-red-50/50",
    border: "border-red-200/60",
    icon: "text-red-600",
    badge: "bg-red-100 text-red-700",
  },
  blue: {
    bg: "bg-blue-50/50",
    border: "border-blue-200/60",
    icon: "text-blue-600",
    badge: "bg-blue-100 text-blue-700",
  },
  amber: {
    bg: "bg-amber-50/50",
    border: "border-amber-200/60",
    icon: "text-amber-600",
    badge: "bg-amber-100 text-amber-700",
  },
  purple: {
    bg: "bg-purple-50/50",
    border: "border-purple-200/60",
    icon: "text-purple-600",
    badge: "bg-purple-100 text-purple-700",
  },
  default: {
    bg: "bg-stone-50/50",
    border: "border-stone-200/60",
    icon: "text-stone-600",
    badge: "bg-stone-100 text-stone-700",
  },
};

function parseSections(text: string): Section[] {
  const lines = text.split("\n");
  const sections: Section[] = [];
  let current: Section | null = null;

  const detectSection = (line: string) => {
    const trimmed = line
      .replace(/^[-*]\s*/, "")
      .replace(/^\d+\.\s*/, "")
      .trim();
    for (const pattern of sectionPatterns) {
      if (pattern.match.test(trimmed)) {
        return {
          title: trimmed.replace(/[:.]+$/, "").slice(0, 60),
          icon: pattern.icon,
          variant: pattern.variant,
        };
      }
    }
    return null;
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Check for section headers (lines ending with : or starting with ##)
    const isHeader =
      (/^#{1,3}\s/.test(trimmed) || /^[A-Z][^:]*:\s*$/.test(trimmed)) &&
      trimmed.length < 80;

    if (isHeader) {
      if (current) sections.push(current);
      const title = trimmed
        .replace(/^#{1,3}\s*/, "")
        .replace(/[:.]+$/, "")
        .trim();
      const detected = detectSection(title);
      current = {
        title,
        icon: detected?.icon ?? <CheckCircle2 className="h-3 w-3" />,
        items: [],
        variant: detected?.variant ?? "default",
      };
      continue;
    }

    // Bullet or numbered list items
    const itemMatch =
      trimmed.match(/^[-*]\s+(.+)/) || trimmed.match(/^\d+[.)]\s+(.+)/);
    if (itemMatch) {
      const itemText = itemMatch[1].trim();
      if (current) {
        current.items.push(itemText);
      } else {
        // Detect section from item content
        const detected = detectSection(itemText);
        if (detected) {
          current = {
            title: detected.title,
            icon: detected.icon,
            items: [itemText],
            variant: detected.variant,
          };
        } else {
          sections.push({
            title: "",
            icon: <CheckCircle2 className="h-3 w-3" />,
            items: [itemText],
            variant: "default",
          });
        }
      }
      continue;
    }

    // Regular text - add to current section or create paragraph section
    if (current) {
      current.items.push(trimmed);
    } else {
      const lastSection = sections[sections.length - 1];
      if (
        lastSection &&
        lastSection.title === "" &&
        lastSection.items.length > 0
      ) {
        lastSection.items.push(trimmed);
      } else {
        sections.push({
          title: "",
          icon: <CheckCircle2 className="h-3 w-3" />,
          items: [trimmed],
          variant: "default",
        });
      }
    }
  }

  if (current) sections.push(current);
  return sections;
}

function InlineBold({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={i} className="font-semibold text-stone-800">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

function SectionCard({ section, index }: { section: Section; index: number }) {
  const [expanded, setExpanded] = React.useState(true);
  const vc = variantClasses[section.variant];

  if (section.items.length === 0) return null;

  // Single-item sections render inline
  if (section.items.length === 1 && !section.title) {
    return (
      <div className="py-1">
        <p className="text-[13px] text-stone-600 leading-relaxed">
          <InlineBold text={section.items[0]} />
        </p>
      </div>
    );
  }

  return (
    <div className={`rounded-lg border ${vc.border} ${vc.bg} overflow-hidden`}>
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className={vc.icon}>{section.icon}</span>
          <span className="text-[12px] font-semibold text-stone-700 truncate">
            {section.title || `Section ${index + 1}`}
          </span>
          <span
            className={`inline-flex items-center justify-center h-4 min-w-4 px-1 rounded text-[10px] font-bold ${vc.badge}`}
          >
            {section.items.length}
          </span>
        </div>
        {expanded ? (
          <ChevronUp className="h-3.5 w-3.5 shrink-0 text-stone-400" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-stone-400" />
        )}
      </button>
      {expanded && (
        <div className="px-3 pb-2.5">
          <ul className="space-y-1.5">
            {section.items.map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                {section.items.length > 1 && (
                  <span className="mt-0.5 inline-flex h-4 min-w-4shrink-0 items-center justify-center rounded bg-white/70 px-1 text-[10px] font-bold text-stone-500">
                    {i + 1}
                  </span>
                )}
                <p className="text-[12.5px] text-stone-600 leading-relaxed">
                  <InlineBold text={item} />
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function RichMessage({ content }: { content: string }) {
  const sections = React.useMemo(() => parseSections(content), [content]);

  if (sections.length === 0) {
    return (
      <p className="whitespace-pre-wrap text-[13px] text-stone-600 leading-relaxed">
        {content}
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {sections.map((section, i) => (
        <SectionCard
          key={`${section.title}-${i}`}
          section={section}
          index={i}
        />
      ))}
    </div>
  );
}
