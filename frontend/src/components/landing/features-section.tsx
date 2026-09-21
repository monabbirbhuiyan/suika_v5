"use client";
import { features } from "@/lib/constant";
import { motion } from "framer-motion";
import React from "react";

type Props = {};

const FeaturesSection = (props: Props) => {
  return (
    <section id="features" className="py-18 px-6 bg-brand-surface">
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl md:text-5xl font-light text-brand-ink mb-4">
            Built for Legal Thinking
          </h2>
          <p className="text-lg text-[#59766a] max-w-2xl mx-auto">
            Visualize case strategy, manage precedents, and collaborate with
            complete clarity on every matter.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group"
              >
                <div className="h-full bg-linear-to-br from-white to-brand-green-100/40 rounded-2xl p-6 border border-(--brand-green)/12 hover:border-(--brand-green)/35 hover:shadow-lg transition-all duration-300">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300"
                    style={{ backgroundColor: `${feature.color}20` }}
                  >
                    <Icon
                      className="w-6 h-6"
                      style={{ color: feature.color }}
                    />
                  </div>

                  <h3 className="text-xl font-medium text-brand-ink mb-3">
                    {feature.title}
                  </h3>

                  <p className="text-[#4d645a] leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
