"use client";
import React from "react";
import { motion } from "framer-motion";
import { beliefs } from "@/lib/constant";

const PhilosophySection = () => {
  return (
    <section
      id="philosophy"
      className="py-24 px-6 bg-linear-to-b from-white via-brand-red-100/20 to-brand-surface"
    >
      <div className="max-w-4xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl md:text-5xl font-light text-brand-ink mb-4">
            What we believe
          </h2>
          <p className="text-lg text-[#59766a]">
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
              className="relative pl-6 border-l-2 border-(--brand-green)/25 hover:border-(--brand-red)/55 transition-colors duration-300"
            >
              <h3 className="text-xl font-medium text-brand-ink mb-3">
                {belief.title}
              </h3>
              <p className="text-[#4d645a] leading-relaxed">
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
          <blockquote className="text-2xl font-light text-[#385248] italic max-w-2xl mx-auto leading-relaxed">
            "The goal isn't to become more productive. It's to become more
            clear."
          </blockquote>
        </motion.div>
      </div>
    </section>
  );
};

export default PhilosophySection;
