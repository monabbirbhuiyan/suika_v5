"use client";

import React, { useCallback } from "react";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "../ui/sidebar";
import { usePathname } from "next/navigation";
import { MdDashboard } from "react-icons/md";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { motion } from "framer-motion";
import { IoIosSettings } from "react-icons/io";
import { HiMiniCubeTransparent } from "react-icons/hi2";
import { MdAutoStories } from "react-icons/md";

type Props = {
  userId: string | null;
};

const Navmain = ({ userId }: Props) => {
  const { setOpenMobile } = useSidebar();
  const pathname = usePathname();
  const [loadingLink, setLoadingLink] = React.useState<string | null>(null);

  const handleLinkClick = useCallback(
    (href: string) => {
      setLoadingLink(href);
      setOpenMobile(false);

      // Clear loading state after navigation
      setTimeout(() => {
        setLoadingLink(null);
      }, 1000);
    },
    [setOpenMobile],
  );

  const items = [
    {
      label: "Dashboard",
      href: `/${userId}/dashboard`,
      icon: MdDashboard,
    },

    {
      label: "Problem Spaces",
      href: `/${userId}/problem-spaces`,
      icon: HiMiniCubeTransparent,
    },

    {
      label: "Journal",
      href: `/${userId}/journal`,
      icon: MdAutoStories,
    },

    {
      label: "Settings",
      href: `/${userId}/settings`,
      icon: IoIosSettings,
    },
  ];
  return (
    <>
      <SidebarGroup>
        <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">
          <span className="text-sm font-light text-muted-foreground uppercase tracking-wide">
            Menu
          </span>
        </SidebarGroupLabel>
        <SidebarMenu className="space-y-1">
          {/* Main Navigation items */}
          {items.map((item) => {
            let isActive;
            return (
              <SidebarMenuItem key={item.label}>
                <SidebarMenuButton
                  asChild
                  tooltip={item.label}
                  isActive={isActive}
                  className={cn(
                    "h-12 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0 transition-all",
                    isActive &&
                      "bg-linear-to-r from-blue-50 to-purple-50 border-l-2 border-blue-500 font-semibold",
                  )}
                >
                  <Link
                    href={item.href}
                    onClick={() => handleLinkClick(item.href)}
                  >
                    <item.icon
                      className={cn(
                        "h-5 w-5 group-data-[collapsible=icon]:h-6 group-data-[collapsible=icon]:w-6 transition-colors",
                        loadingLink === item.href && "animate-pulse",
                        isActive && "text-blue-600 dark:text-blue-400",
                      )}
                    />
                    <span
                      className={cn(
                        "group-data-[collapsible=icon]:hidden text-base",
                        isActive && "text-blue-600 dark:text-blue-400",
                      )}
                    >
                      {item.label}
                    </span>
                    {loadingLink === item.href && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute right-2 w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin group-data-[collapsible=icon]:hidden"
                      />
                    )}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroup>
    </>
  );
};

export default Navmain;
