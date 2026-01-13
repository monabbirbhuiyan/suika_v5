import Image from "next/image";
import Link from "next/link";
import React from "react";
import { Button } from "../ui/button";

const Navbar = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Image
            src={"/assets/logo.svg"}
            height={30}
            width={30}
            alt="Suika Logo"
          />
          <span className="text-xl font-semibold">Suika.</span>
        </div>
        <nav className="hidden md:flex items-center gap-6">
          <Link
            href="#why"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Why Suika
          </Link>
          <Link
            href="#why"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            How It Works
          </Link>
          <Link
            href="#pricing"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Pricing
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/signin">
            <Button variant="ghost" size="sm">
              Sign in
            </Button>
          </Link>
          <Link href="/signup">
            <Button size="sm" className="bg-primary hover:bg-primary/90">
              Try demo
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
