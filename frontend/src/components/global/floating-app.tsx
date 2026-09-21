import React from "react";
import { motion } from "framer-motion";

const FloatingApp = () => {
  const mockFragments = [
    {
      x: 20,
      y: 20,
      width: 180,
      sections: [
        { color: "#7C9EB2", width: "70%" },
        { color: "#C4A574", width: "50%" },
        { color: "#8BA888", width: "85%" },
      ],
    },
    {
      x: 240,
      y: 80,
      width: 180,
      sections: [
        { color: "#7C9EB2", width: "60%" },
        { color: "#9088B8", width: "75%" },
      ],
    },
    {
      x: 120,
      y: 200,
      width: 180,
      opacity: 0.5,
      sections: [
        { color: "#B8908F", width: "55%" },
        { color: "#9088B8", width: "90%" },
      ],
    },
  ];
  return (
    <motion.div
      className="relative w-full h-100"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.4, duration: 1 }}
    >
      <svg viewBox="0 0 450 350" className="w-full h-full">
        {/* Connection lines */}
        <motion.path
          d="M 110 100 Q 180 140 230 170"
          stroke="#6BA3A3"
          strokeWidth="1.5"
          fill="none"
          opacity="0.4"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 1, duration: 1.5 }}
        />
        <motion.path
          d="M 330 170 Q 280 220 210 260"
          stroke="#D4847C"
          strokeWidth="1.5"
          fill="none"
          strokeDasharray="4,4"
          opacity="0.4"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 1.2, duration: 1.5 }}
        />

        {/* Fragment nodes */}
        {mockFragments.map((fragment, idx) => (
          <g key={idx}>
            <motion.rect
              x={fragment.x}
              y={fragment.y}
              width={fragment.width}
              height={80}
              rx="8"
              fill="white"
              stroke="#E8E8E8"
              strokeWidth="1"
              opacity={fragment.opacity || 1}
              filter="drop-shadow(0 4px 6px rgba(0,0,0,0.05))"
              initial={{ opacity: 0, y: 20 }}
              animate={{
                opacity: fragment.opacity || 1,
                y: 0,
                scale: fragment.opacity ? [1, 0.98, 1] : [1, 1.01, 1],
              }}
              transition={{
                delay: 0.6 + idx * 0.2,
                duration: fragment.opacity ? 6 : 4,
                repeat: Infinity,
                repeatType: "reverse",
              }}
            />

            {/* Header */}
            <rect
              x={fragment.x}
              y={fragment.y}
              width={fragment.width}
              height="20"
              rx="8"
              fill="#FAFAFA"
            />
            <rect
              x={fragment.x}
              y={fragment.y + 12}
              width={fragment.width}
              height="8"
              fill="#FAFAFA"
            />

            {/* Section bars */}
            {fragment.sections.map((section, i) => (
              <g key={i}>
                <rect
                  x={fragment.x + 8}
                  y={fragment.y + 28 + i * 16}
                  width={fragment.width - 16}
                  height="12"
                  rx="3"
                  fill={`${section.color}15`}
                />
                <motion.rect
                  x={fragment.x + 8}
                  y={fragment.y + 28 + i * 16}
                  width={
                    (fragment.width - 16) * (parseInt(section.width) / 100)
                  }
                  height="12"
                  rx="3"
                  fill={`${section.color}40`}
                  initial={{ width: 0 }}
                  animate={{
                    width:
                      (fragment.width - 16) * (parseInt(section.width) / 100),
                  }}
                  transition={{ delay: 1 + idx * 0.2 + i * 0.1, duration: 0.8 }}
                />
              </g>
            ))}
          </g>
        ))}
      </svg>
    </motion.div>
  );
};

export default FloatingApp;
