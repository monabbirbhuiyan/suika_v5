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
      className="py-24 px-6 bg-linear-to-b from-white to-brand-surface"
    >
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl md:text-5xl font-light text-brand-ink mb-4">
            Pricing built for every stage of legal work
          </h2>
          <p className="text-lg text-[#58766a] max-w-2xl mx-auto">
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
                  <span className="inline-block px-4 py-1 rounded-full bg-brand-red text-white text-xs font-medium">
                    Most popular
                  </span>
                </div>
              )}

              <div
                className={`h-full rounded-2xl p-8 border transition-all duration-300 ${
                  plan.highlighted
                    ? "bg-brand-green text-white border-brand-green shadow-xl scale-105"
                    : "bg-white border-(--brand-green)/15 hover:border-(--brand-green)/35 hover:shadow-lg"
                }`}
              >
                <div className="mb-6">
                  <h3
                    className={`text-2xl font-medium mb-2 ${
                      plan.highlighted ? "text-white" : "text-brand-ink"
                    }`}
                  >
                    {plan.name}
                  </h3>
                  <p
                    className={`text-sm ${
                      plan.highlighted ? "text-green-100" : "text-[#5a756b]"
                    }`}
                  >
                    {plan.description}
                  </p>
                </div>

                <div className="mb-8">
                  <div className="flex items-baseline gap-2">
                    <span
                      className={`text-5xl font-light ${
                        plan.highlighted ? "text-white" : "text-brand-ink"
                      }`}
                    >
                      {plan.price}
                    </span>
                    <span
                      className={`text-sm ${
                        plan.highlighted ? "text-green-100" : "text-[#5a756b]"
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
                          plan.highlighted
                            ? "text-brand-red-100"
                            : "text-brand-green"
                        }`}
                      />
                      <span
                        className={`text-sm ${
                          plan.highlighted ? "text-green-50" : "text-[#4d645a]"
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
                        ? "bg-white text-brand-green hover:bg-green-50"
                        : "bg-brand-green text-white hover:bg-brand-green-700"
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
          className="text-center text-sm text-[#6f857b] mt-12"
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
