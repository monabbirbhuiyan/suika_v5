"use client";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "../ui/button";
import { Menu, X } from "lucide-react";
import { User } from "@/generated/prisma";
import { authClient } from "@/lib/auth-client";

type Props = {
  user: User | null;
};

const Navbar = ({ user }: Props) => {
  const [isScrolled, setIsScrolled] = React.useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  useEffect(() => {
    console.log("Navbar user:", user);
  }, [user]);

  // Client-side recovery: if the page rendered without a user but
  // the user previously chose "remember me", attempt to fetch
  // session client-side and show the authenticated button.
  const [clientUser, setClientUser] = React.useState<User | null | undefined>(
    user,
  );

  useEffect(() => {
    if (clientUser) return; // already have user

    let remember = false;
    try {
      remember = localStorage.getItem("suika_remember") === "true";
    } catch (e) {
      remember = false;
    }

    if (!remember) return;

    async function recover() {
      try {
        // try common authClient session getters (library may expose one)
        // try `getSession`, then `session` as a fallback
        // any method that returns { data: { user } } or { user } is handled
        let sess: any = null;
        if (typeof (authClient as any).getSession === "function") {
          sess = await (authClient as any).getSession();
        } else if (typeof (authClient as any).session === "function") {
          sess = await (authClient as any).session();
        }

        const foundUser = sess?.data?.user ?? sess?.user ?? null;
        if (foundUser) setClientUser(foundUser as User);
      } catch (e) {
        // ignore failures silently
      }
    }

    recover();
  }, [clientUser]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const navlinks = [
    { label: "Features", href: "#features" },
    { label: "Pricing", href: "#pricing" },
    { label: "Philosophy", href: "#philosophy" },
  ];

  return (
    <motion.nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? "bg-white/80 backdrop-blur-lg shadow-sm" : "bg-transparent"}`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}

          <Link
            href="/"
            className="flex flex-row gap-2 items-center justify-between"
          >
            <Image src="/assets/logo.svg" alt="Suika" width={30} height={30} />
            <span className="text-2xl font-light text-[#2D2D2D]">SUIKA</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navlinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm text-[#6A6A6A] hover:text-[#2D2D2D] transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* CTA */}
          <div className="hidden md:block">
            <Link href="/sign-up">
              <Button className="bg-[#2D2D2D] hover:bg-[#3D3D3D] text-white rounded-full px-6 hover:cursor-pointer">
                Get Started
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Toogle */}
          <button
            className="md:hidden text-[#2D2D2D]"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden mt-4 pt-4 border-t border-gray-100"
          >
            <div className="flex flex-col gap-4">
              {navlinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-sm text-[#6A6A6A] hover:text-[#2D2D2D] transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.label}
                </a>
              ))}

              <Link
                href={
                  clientUser || user
                    ? `/dashboard/${(clientUser || user)!.id}`
                    : "/sign-up"
                }
              >
                <Button className="w-full bg-[#2D2D2D] hover:bg-[#3D3D3D] text-white rounded-full">
                  {clientUser || user ? "Dashboard" : "Get Started"}
                </Button>
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </motion.nav>
  );
};

export default Navbar;
