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
import { TbDatabase } from "react-icons/tb";

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
      href: `/dashboard/${userId}`,
      icon: MdDashboard,
    },

    {
      label: "Problem Spaces",
      href: `/problem-spaces/${userId}`,
      icon: HiMiniCubeTransparent,
    },

    {
      label: "Datasets",
      href: `/datasets/${userId}`,
      icon: TbDatabase,
    },

    {
      label: "Settings",
      href: `/settings/${userId}`,
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
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <SidebarMenuItem key={item.label}>
                <SidebarMenuButton
                  tooltip={item.label}
                  isActive={isActive}
                  className={cn(
                    "h-12 text-brand-ink hover:bg-brand-green-100/45 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0 transition-all",
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
                        isActive && "text-brand-green",
                      )}
                    />
                    <span
                      className={cn(
                        "group-data-[collapsible=icon]:hidden text-base font-medium",
                        isActive && "text-brand-green",
                      )}
                    >
                      {item.label}
                    </span>
                    {loadingLink === item.href && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute right-2 w-4 h-4 border-2 border-brand-green border-t-transparent rounded-full animate-spin group-data-[collapsible=icon]:hidden"
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
