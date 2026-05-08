import React from "react";
import { Heart, Network } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

const Footer = () => {
  const links = {
    Product: [
      { label: "Features", href: "#features" },
      { label: "Pricing", href: "#pricing" },
      { label: "Demo", href: "/dashboard" },
    ],
    Company: [
      { label: "About", href: "#" },
      { label: "Philosophy", href: "#" },
      { label: "Blog", href: "#" },
    ],
    Resources: [
      { label: "Documentation", href: "#" },
      { label: "Support", href: "#" },
      { label: "Community", href: "#" },
    ],
    Legal: [
      { label: "Privacy", href: "#" },
      { label: "Terms", href: "#" },
    ],
  };

  return (
    <footer className="bg-brand-surface border-t border-(--brand-green)/15 px-6 py-12">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex flex-row items-center gap-2 mb-2">
              <Image
                src={"/assets/logo.svg"}
                alt="Suika Logo"
                width={25}
                height={25}
              />
              <h3 className="text-2xl font-light text-brand-ink">SUIKA</h3>
            </div>
            <p className="text-sm text-[#5b766c] leading-relaxed">
              Making the invisible work of thinking visible.
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(links).map(([category, items]) => (
            <div key={category}>
              <h4 className="font-medium text-[#355046] mb-3 text-sm">
                {category}
              </h4>
              <ul className="space-y-2">
                {items.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-[#5f7a70] hover:text-brand-green transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-(--brand-green)/15 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-[#6f877d]">
            ©{new Date().getFullYear()} SUIKA. Built with care for thinkers.
          </p>

          <div className="flex items-center gap-2 text-sm text-[#6f877d]">
            <span>Made for humans who think</span>
            <Heart className="w-4 h-4 text-brand-red" />
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
