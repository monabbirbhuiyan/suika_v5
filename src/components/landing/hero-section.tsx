"use client";
import React from "react";
import { HeroHighlight } from "../global/hero-highlight";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  GitBranch,
  Lightbulb,
  Network,
  Sparkles,
  Target,
  TrendingDown,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { Button } from "../ui/button";
import FloatingApp from "../global/floating-app";

const HeroSection = () => {
  return (
    <section className="min-h-screen mt-20 pt-32 px-6 bg-linear-to-b from-[#FAFAF8] to-white">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Side */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-block mb-6"
            >
              <span className="px-4 py-2 rounded-full bg-[#9088B8] text-sm font-medium ">
                From Chaos to Clarity
              </span>
            </motion.div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-light text-[#2D2D2D] mb-6 leading-tight">
              Understanding
              <br />
              <span className="text-[#8A8A8A]">is Progress</span>
            </h1>

            <p className="text-lg md:text-xl text-[#6A6A6A] mb-8 leading-relaxed max-w-xl">
              For work that happens before task exist. A calm space to watch
              your thinking evolve, your questions clarify, and your
              understanding grow.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link href={"/sign-up"}>
                <Button
                  size="lg"
                  className="bg-[#2D2D2D] hover:bg-[#3D3D3D] text-white rounded-full px-8 group hover:cursor-pointer"
                >
                  Get Started
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <a href="#features">
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-full px-8 border-gray-200 hover:border-gray-300 hover:cursor-pointer"
                >
                  Learn more
                </Button>
              </a>
            </div>

            {/* Social proof / philosophy */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="mt-12 pt-8 border-t border-gray-100"
            >
              <p className="text-sm text-[#AAAAAA] italic">
                "Some work happens in the space between confusion and clarity.
                Suika makes that space visible."
              </p>
            </motion.div>
          </motion.div>

          {/* Right - Floating App Preview */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <div className="relative bg-white/40 backdrop-blur-sm rounded-3xl p-8 border border-gray-100 shadow-2xl">
              <FloatingApp />
            </div>

            {/* Decorative elements */}
            <motion.div
              className="absolute -top-6 -right-6 w-32 h-32 bg-[#7C9EB2]/10 rounded-full blur-2xl"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{ duration: 4, repeat: Infinity }}
            />
            <motion.div
              className="absolute -bottom-6 -left-6 w-40 h-40 bg-[#C4A574]/10 rounded-full blur-2xl"
              animate={{
                scale: [1.2, 1, 1.2],
                opacity: [0.5, 0.3, 0.5],
              }}
              transition={{ duration: 5, repeat: Infinity }}
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
