"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { motion } from "framer-motion";
import { plans } from "@/lib/constant";
import Link from "next/link";

type Props = {};

const PricingSection = (props: Props) => {
  return (
    <section
      id="pricing"
      className="py-24 px-6 bg-linear-to-b from-white to-[#FAFAF8]"
    >
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl md:text-5xl font-light text-[#2D2D2D] mb-4">
            Pricing built for every stage of legal work
          </h2>
          <p className="text-lg text-[#8A8A8A] max-w-2xl mx-auto">
            From students testing ideas to firms running full legal workflows.
            Clear limits where needed, deeper capability when the work expands.
          </p>
        </motion.div>

        <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3 max-w-7xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="relative"
            >
              {plan.highlighted && (
                <div className="absolute -top-4 left-0 right-0 text-center">
                  <span className="inline-block px-4 py-1 rounded-full bg-[#2D2D2D] text-white text-xs font-medium">
                    Most popular
                  </span>
                </div>
              )}

              <div
                className={`h-full rounded-2xl p-8 border transition-all duration-300 ${
                  plan.highlighted
                    ? "bg-[#2D2D2D] text-white border-[#2D2D2D] shadow-xl scale-105"
                    : "bg-white border-gray-100 hover:border-gray-200 hover:shadow-lg"
                }`}
              >
                <div className="mb-6">
                  <h3
                    className={`text-2xl font-medium mb-2 ${
                      plan.highlighted ? "text-white" : "text-[#2D2D2D]"
                    }`}
                  >
                    {plan.name}
                  </h3>
                  <p
                    className={`text-sm ${
                      plan.highlighted ? "text-gray-300" : "text-[#8A8A8A]"
                    }`}
                  >
                    {plan.description}
                  </p>
                </div>

                <div className="mb-8">
                  <div className="flex items-baseline gap-2">
                    <span
                      className={`text-5xl font-light ${
                        plan.highlighted ? "text-white" : "text-[#2D2D2D]"
                      }`}
                    >
                      {plan.price}
                    </span>
                    <span
                      className={`text-sm ${
                        plan.highlighted ? "text-gray-300" : "text-[#8A8A8A]"
                      }`}
                    >
                      {plan.period}
                    </span>
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Check
                        className={`w-5 h-5 shrink-0 ${
                          plan.highlighted ? "text-[#8BA888]" : "text-[#8BA888]"
                        }`}
                      />
                      <span
                        className={`text-sm ${
                          plan.highlighted ? "text-gray-200" : "text-[#6A6A6A]"
                        }`}
                      >
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <Link href={"/sign-up"}>
                  <Button
                    className={`w-full rounded-full ${
                      plan.highlighted
                        ? "bg-white text-[#2D2D2D] hover:bg-gray-100"
                        : "bg-[#2D2D2D] text-white hover:bg-[#3D3D3D]"
                    }`}
                    disabled={plan.comingSoon}
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom note */}
        <motion.p
          className="text-center text-sm text-[#AAAAAA] mt-12"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
        >
          Case law access varies by tier. Free through Pro use controlled search
          allowances, while Legal and Legal+ unlock unlimited searches through
          bring-your-own or company-provided licensed database access.
        </motion.p>
      </div>
    </section>
  );
};

export default PricingSection;
