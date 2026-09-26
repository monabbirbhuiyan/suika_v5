"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { UserAvatar } from "./user-avatar";
import { Button } from "../ui/button";

type Props = {
  userName: string;
  userImage?: string | null;
  // currentPlan: string;
};

const quotes = [
  "Small steps compound into meaningful clarity.",
  "Progress starts when thoughts get externalized.",
  "Confusion is often the first sign of real understanding.",
  "Clarity grows where curiosity stays consistent.",
  "A better decision starts with a better question.",
  "Momentum beats perfection, every single time.",
];

const getPageMeta = (pathname: string) => {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) {
    return {
      title: "Workspace",
      subtitle: "A central place to keep your thinking organized.",
    };
  }

  const section = segments[0];

  if (section === "dashboard") {
    return {
      title: "Dashboard",
      subtitle:
        "A compact view of momentum, bottlenecks, and decision quality across your problem spaces.",
    };
  }

  if (section === "settings") {
    return {
      title: "Settings",
      subtitle: "Your space, your rules. Adjust everything to feel right.",
    };
  }

  if (section === "problem-spaces" && segments.length > 2) {
    return {
      title: "Problem Space",
      subtitle:
        "Map relationships, test assumptions, and conclude with clarity.",
    };
  }

  if (section === "problem-spaces") {
    return {
      title: "Problem Spaces",
      subtitle:
        "Each space holds a question you are working through. Open one to continue, or start fresh.",
    };
  }

  if (section === "datasets") {
    return {
      title: "Datasets",
      subtitle:
        "Manage your datasets efficiently. Open one to continue, or add a new dataset.",
    };
  }

  const title = section
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

  return {
    title,
    subtitle: "",
  };
};

const MainNavbar = ({ userName, userImage }: Props) => {
  const pathname = usePathname();
  const pageMeta = React.useMemo(() => getPageMeta(pathname), [pathname]);
  const router = useRouter();
  const [openMenu, setOpenMenu] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement | null>(null);

  // Deterministic initial state for SSR
  const [quote, setQuote] = React.useState(quotes[0]);

  React.useEffect(() => {
    // Pick client-side random quote after hydration
    const randomFallback = quotes[Math.floor(Math.random() * quotes.length)];
    setQuote(randomFallback);
  }, []);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) {
        setOpenMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await authClient.signOut();
      router.push("/sign-in");
      router.refresh();
    } catch {
      router.push("/sign-in");
    }
  };

  return (
    <header className="flex items-center justify-between gap-4 border-b border-(--brand-green)/15 bg-brand-surface/80 backdrop-blur-sm px-4 py-3">
      <div>
        <h1 className="text-2xl font-light text-brand-ink">{pageMeta.title}</h1>
        {pageMeta.subtitle ? (
          <p className="text-xs text-[#5f7a70]">{pageMeta.subtitle}</p>
        ) : null}
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center rounded-md border border-(--brand-green)/20 bg-white px-3 py-1.5 text-xs text-[#5c786e]">
          <span className="font-medium text-brand-ink mr-2">Quote</span>
          <span suppressHydrationWarning>{quote}</span>
        </div>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setOpenMenu((prev) => !prev)}
            className="rounded-full ring-offset-background transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-brand-green/40"
          >
            <UserAvatar name={userName} image={userImage} className="size-9" />
          </button>

          {openMenu ? (
            <div className="absolute right-0 mt-2 w-56 rounded-md border border-(--brand-green)/20 bg-white p-3 shadow-md z-50">
              <p className="text-xs text-[#5f7a71]">Current plan</p>
              <p className="text-sm font-medium text-brand-ink mt-0.5">
                {/* {currentPlan} */}
              </p>

              <Button
                variant="destructive"
                className="mt-3 w-full"
                onClick={handleLogout}
              >
                Logout
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
};

export default MainNavbar;
