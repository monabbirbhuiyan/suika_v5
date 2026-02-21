"use client";
import React from "react";
import { motion } from "framer-motion";
import { beliefs } from "@/lib/constant";

const PhilosophySection = () => {
  return (
    <section id="philosophy" className="py-24 px-6 bg-white">
      <div className="max-w-4xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl md:text-5xl font-light text-[#2D2D2D] mb-4">
            What we believe
          </h2>
          <p className="text-lg text-[#8A8A8A]">
            The principles that shaped Suika
          </p>
        </motion.div>

        <div className="space-y-12">
          {beliefs.map((belief, index) => (
            <motion.div
              key={belief.title}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="relative pl-6 border-l-2 border-[#E8E8E8] hover:border-[#9088B8] transition-colors duration-300"
            >
              <h3 className="text-xl font-medium text-[#2D2D2D] mb-3">
                {belief.title}
              </h3>
              <p className="text-[#6A6A6A] leading-relaxed">
                {belief.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Quote */}
        <motion.div
          className="mt-20 text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
        >
          <blockquote className="text-2xl font-light text-[#4A4A4A] italic max-w-2xl mx-auto leading-relaxed">
            "The goal isn't to become more productive. It's to become more
            clear."
          </blockquote>
        </motion.div>
      </div>
    </section>
  );
};

export default PhilosophySection;
