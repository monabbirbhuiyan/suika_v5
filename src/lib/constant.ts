import { Box, GitBranch, Sparkles, Brain, CheckCircle, Layers } from 'lucide-react';

export const features = [
  {
    icon: Box,
    title: 'Fragments, not tasks',
    description: 'Capture evolving units of understanding with questions, ideas, observations, constraints, and conclusions all in one place.',
    color: '#7C9EB2'
  },
  {
    icon: GitBranch,
    title: 'Clarity Graph',
    description: 'Watch connections emerge between your thoughts. A read-only reflection of your understanding, not a canvas to manipulate.',
    color: '#6BA3A3'
  },
  {
    icon: Sparkles,
    title: 'AI-suggested connections',
    description: 'Discover semantic relationships between fragments. Accept, edit, or reject suggestions that honor your thinking.',
    color: '#9088B8'
  },
  {
    icon: Brain,
    title: 'Session Mode',
    description: 'A gentle thinking companion. Choose your energy level and receive non-judgmental prompts to guide exploration.',
    color: '#C4A574'
  },
  {
    icon: CheckCircle,
    title: 'Resolution, not completion',
    description: '"Resolved" means clear enough for now, not finished forever. Return to fragments as your understanding evolves.',
    color: '#8BA888'
  },
  {
    icon: Layers,
    title: 'No forced structure',
    description: 'Questions don\'t need answers. Ideas don\'t need validation. Contradictions can coexist. Your thinking, your pace.',
    color: '#B8908F'
  }
];

export const beliefs = [
  {
    title: 'Understanding is progress',
    description: 'Making sense of complexity is valuable work, even when nothing "ships." The moment clarity emerges is the moment value is created.'
  },
  {
    title: 'Thinking is non-linear',
    description: 'You don\'t move from A to B to C. You spiral, backtrack, leap forward, and circle back. Good tools should mirror this reality, not fight it.'
  },
  {
    title: 'Contradictions are temporary companions',
    description: 'The best insights often come from holding opposing ideas without rushing to resolve them. Tension can be productive.'
  },
  {
    title: 'Resolution ≠ Completion',
    description: 'Something can be "clear enough for now" and still evolve later. Finality is a myth in knowledge work.'
  },
  {
    title: 'No task deserves to exist before its time',
    description: 'Forcing vague uncertainty into concrete tasks is cognitive violence. Sometimes the work is to clarify what the work even is.'
  }
];


export const plans = [
  {
    name: 'Explorer',
    price: 'Free',
    period: 'forever',
    description: 'For personal sensemaking',
    features: [
      '3 problem spaces',
      'Unlimited fragments',
      'Basic clarity graph',
      'AI suggestions',
      'Session mode'
    ],
    cta: 'Start exploring',
    highlighted: false
  },
  {
    name: 'Thinker',
    price: '$12',
    period: 'per month',
    description: 'For serious cognitive work',
    features: [
      'Unlimited problem spaces',
      'Unlimited fragments',
      'Advanced clarity graph',
      'Priority AI suggestions',
      'Session mode with history',
      'Export & sharing',
      'Version history'
    ],
    cta: 'Try the demo',
    highlighted: true
  },
  {
    name: 'Team',
    price: '$39',
    period: 'per month',
    description: 'For shared understanding',
    features: [
      'Everything in Thinker',
      'Shared problem spaces',
      'Collaborative fragments',
      'Team clarity graphs',
      'Async comments',
      'Integration API'
    ],
    cta: 'Coming soon',
    highlighted: false,
    comingSoon: true
  }
];