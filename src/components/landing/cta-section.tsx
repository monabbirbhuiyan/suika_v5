"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

const CTASection = () => {
  return (
    <section className="py-24 px-6 bg-linear-to-br from-brand-green to-brand-green-700 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-20 w-64 h-64 bg-brand-red-100 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-brand-green-100 rounded-full blur-3xl" />
      </div>

      <div className="max-w-4xl mx-auto text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-4xl md:text-5xl font-light text-white mb-6">
            Your thinking deserves recognition
          </h2>

          <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto leading-relaxed">
            Stop forcing progress into task lists. Start honoring the messy,
            non-linear work of making sense of complexity.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href={"/sign-up"}>
              <Button
                size="lg"
                className="bg-white text-brand-green hover:bg-brand-green-100 rounded-full px-8 group"
              >
                Try Suika now
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              className="rounded-full bg-brand-red/15 px-8 border-brand-red/40 text-white hover:bg-brand-red hover:cursor-pointer"
            >
              Read the manifesto
            </Button>
          </div>

          <motion.p
            className="text-sm text-green-100 mt-8"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
          >
            No credit card required • No time limits • No pressure
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
