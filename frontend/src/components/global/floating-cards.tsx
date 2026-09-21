"use client";

import { motion } from "framer-motion";

const cards = [
  {
    text: "Why do I feel stuck?",
    color: "border-soft-blue",
    x: "10%",
    y: "15%",
    delay: 0,
  },
  {
    text: "Maybe I need rest",
    color: "border-gentle-coral",
    x: "70%",
    y: "10%",
    delay: 1.5,
  },
  {
    text: "This connects to...",
    color: "border-mint",
    x: "25%",
    y: "65%",
    delay: 0.8,
  },
  {
    text: "I should talk to them",
    color: "border-sage",
    x: "65%",
    y: "55%",
    delay: 2.2,
  },
  {
    text: "What matters most?",
    color: "border-soft-blue",
    x: "45%",
    y: "80%",
    delay: 1.0,
  },
  {
    text: "A breakthrough!",
    color: "border-mint",
    x: "85%",
    y: "40%",
    delay: 0.5,
  },
];

export function FloatingCards() {
  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none"
      aria-hidden="true"
    >
      {cards.map((card, i) => (
        <motion.div
          key={i}
          className={`absolute rounded-lg border-2 ${card.color} bg-background/60 backdrop-blur-sm px-4 py-3 shadow-sm`}
          style={{ left: card.x, top: card.y }}
          initial={{ opacity: 0, y: 20 }}
          animate={{
            opacity: [0.3, 0.6, 0.3],
            y: [0, -18, 0],
            rotate: [0, i % 2 === 0 ? 2 : -2, 0],
          }}
          transition={{
            duration: 6 + i * 0.5,
            repeat: Infinity,
            delay: card.delay,
            ease: "easeInOut",
          }}
        >
          <p className="text-sm text-foreground/60 font-sans whitespace-nowrap">
            {card.text}
          </p>
        </motion.div>
      ))}
    </div>
  );
}
