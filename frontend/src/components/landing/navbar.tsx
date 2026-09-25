"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "../ui/button";
import { Menu, X } from "lucide-react";
import { authClient } from "@/lib/auth-client";

type UserType = {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

type Props = {
  user?: UserType | null;
};

const Navbar = ({ user: initialUser = null }: Props) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserType | null>(initialUser);

  useEffect(() => {
    if (initialUser) {
      setCurrentUser(initialUser);
    }
  }, [initialUser]);

  useEffect(() => {
    if (currentUser) return;

    async function recoverSession() {
      try {
        const { data } = await authClient.getSession();
        if (data?.user) {
          setCurrentUser(data.user as UserType);
        }
      } catch {
        // Silently fail if session recovery is not active
      }
    }

    recoverSession();
  }, [currentUser]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navlinks = [
    { label: "Features", href: "#features" },
    { label: "Pricing", href: "#pricing" },
    { label: "Philosophy", href: "#philosophy" },
  ];

  const dashboardUrl = currentUser
    ? `/dashboard/${currentUser.id}`
    : "/sign-up";
  const ctaLabel = currentUser ? "Go to Dashboard" : "Get Started";

  return (
    <motion.nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-brand-surface/85 backdrop-blur-lg shadow-sm border-b border-(--brand-green)/15"
          : "bg-transparent"
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex flex-row gap-2 items-center">
            <Image
              src="/assets/logo.svg"
              alt="Suika Logo"
              width={30}
              height={30}
              priority
              className="h-[30px] w-[30px]"
            />
            <span className="text-2xl font-light tracking-wide text-brand-ink">
              SUIKA
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navlinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm text-[#557367] hover:text-brand-green transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:block">
            <Link href={dashboardUrl}>
              <Button className="bg-brand-green hover:bg-brand-green-700 text-white rounded-full px-6 cursor-pointer">
                {ctaLabel}
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            className="md:hidden text-brand-ink cursor-pointer p-1"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden mt-4 pt-4 border-t border-(--brand-green)/20 overflow-hidden"
            >
              <div className="flex flex-col gap-4">
                {navlinks.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    className="text-sm text-[#557367] hover:text-brand-green transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {link.label}
                  </a>
                ))}

                <Link
                  href={dashboardUrl}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Button className="w-full bg-brand-green hover:bg-brand-green-700 text-white rounded-full cursor-pointer">
                    {ctaLabel}
                  </Button>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
};

export default Navbar;
