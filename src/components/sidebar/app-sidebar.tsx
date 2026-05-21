"use client";

import React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarTrigger,
} from "../ui/sidebar";
import Image from "next/image";
import Navmain from "./nav-main";

type Props = {
  userId: string | null;
};

const AppSidebar = (props: Props) => {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <Sidebar
      className="z-30 border-r border-(--brand-green)/15 bg-brand-surface/90"
      collapsible="icon"
    >
      <SidebarHeader className="mb-3">
        <div className="flex items-center justify-center pt-4 gap-2 group-data-[collapsible=icon]:justify-center">
          <Image
            src={"/assets/logo.svg"}
            alt="Suika Logo"
            height={30}
            width={30}
            className="group-data-[collapsible=icon]:h-7 group-data-[collapsible=icon]:w-7"
          />
          <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">
            <span className="text-3xl font-light text-brand-ink">Suika</span>
          </SidebarGroupLabel>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <Navmain userId={props.userId} />
      </SidebarContent>

      <SidebarFooter>
        <div className="flex w-full">
          <SidebarTrigger
            label="Collapse"
            className="h-10 w-full justify-start gap-2 rounded-md border border-(--brand-green)/20 bg-white px-3 text-sm text-brand-ink hover:bg-brand-green-100/45 group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
          />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
