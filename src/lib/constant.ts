import {
  Box,
  GitBranch,
  Sparkles,
  Brain,
  CheckCircle,
  Layers,
} from "lucide-react";

export const features = [
  {
    icon: Box,
    title: "Matter Documents, not tasks",
    description:
      "Organize facts, exhibits, and legal arguments as evolving units of evidence with questions, observations, constraints, and conclusions all in one place.",
    color: "#7C9EB2",
  },
  {
    icon: GitBranch,
    title: "Case Relationships Map",
    description:
      "Watch connections emerge between precedents and your case facts. A visual reflection of your strategy, not a canvas to manipulate.",
    color: "#6BA3A3",
  },
  {
    icon: Sparkles,
    title: "AI-suggested precedents",
    description:
      "Discover semantic relationships between your case and relevant legal arguments. Accept, edit, or reject suggestions that honor your analysis.",
    color: "#9088B8",
  },
  {
    icon: Brain,
    title: "Strategic Review Mode",
    description:
      "A focused analysis companion. Review your case strategy step-by-step and receive guided prompts to strengthen weak arguments.",
    color: "#C4A574",
  },
  {
    icon: CheckCircle,
    title: "Resolution, not verdict",
    description:
      '"Clear enough for trial" means strategic clarity now, not forever. Return to matter details as facts and law evolve.',
    color: "#8BA888",
  },
  {
    icon: Layers,
    title: "No forced discovery",
    description:
      "Arguments don't need resolution. Tensions can coexist. Precedents can be explored without forcing conclusions. Your strategy, your pace.",
    color: "#B8908F",
  },
];

export const beliefs = [
  {
    title: "Clarity on Strategy is Progress",
    description:
      "Understanding the matter visually reduces risk and improves case outcomes.",
  },
  {
    title: "Legal Analysis is Non-Linear",
    description:
      "Arguments jump between precedents and evidence. Our tool mirrors this complexity, not against it.",
  },
  {
    title: "A Unified Legal Brain",
    description:
      "One central environment for facts, precedents, exhibits, and strategy—where everything connects.",
  },
  {
    title: "Preserve Every Precedent",
    description:
      "Every relevant legal argument deserves a visual home where its connection to broader strategy is understood.",
  },
];

export const plans = [
  {
    name: "Free Tier",
    price: "$0",
    period: "/month",
    description: "Risk-free exploration for first-time users.",
    features: [
      "Basic problem spaces",
      "Limited fragments and connections",
      "Basic AI assistance with low usage",
      "Approximately 1-5 free case law searches per month",
      "Designed to introduce Suika's legal thinking workflow",
    ],
    cta: "Start for free",
    highlighted: false,
  },
  {
    name: "Student Tier",
    price: "$9.99",
    period: "/month",
    description: "For assignments, briefs, and regular academic use.",
    features: [
      "Full problem space access",
      "Timelines, issue breakdowns, and argument mapping",
      "Moderate AI usage",
      "Up to 10 case law searches per month",
      "Built for students without overwhelming cost",
    ],
    cta: "Choose student",
    highlighted: true,
  },
  {
    name: "Pro Tier",
    price: "$24.99",
    period: "/month",
    description: "Advanced workflow support for complex legal work.",
    features: [
      "Higher AI usage limits",
      "Advanced structuring tools",
      "Faster and more frequent AI suggestions",
      "Up to 30 case law searches per month",
      "Focused on efficiency for larger workloads",
    ],
    cta: "Choose pro",
    highlighted: false,
  },
  {
    name: "Team Tier",
    price: "$39",
    period: "per user/month",
    description: "Shared legal workflows for small teams.",
    features: [
      "Shared problem spaces",
      "Collaborative workflows",
      "Higher AI limits across users",
      "Shared pool of 50-100 case law searches per month",
      "Controlled collaboration for case building",
    ],
    cta: "Choose team",
    highlighted: false,
  },
  {
    name: "Legal",
    price: "~$99",
    period: "/month",
    description: "BYO legal database for smaller firms and sole practitioners.",
    features: [
      "All advanced features",
      "Highest AI usage limits",
      "Unlimited case law searches with user-provided access",
      "Integration with Westlaw or Quicklaw subscriptions",
      "Built for real-case professional workflows",
    ],
    cta: "Talk to us",
    highlighted: false,
  },
  {
    name: "Legal+",
    price: "$150-$300+",
    period: "per user/month",
    description: "Enterprise-grade legal research and workflow support.",
    features: [
      "All features from previous tiers",
      "Unlimited case law searches with company-provided access",
      "Direct integration with licensed databases",
      "Enterprise-level performance and support",
      "Designed for large law firms",
    ],
    cta: "Contact sales",
    highlighted: false,
  },
];
