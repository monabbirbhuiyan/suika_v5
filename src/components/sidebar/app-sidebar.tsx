import React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroupLabel,
  SidebarHeader,
} from "../ui/sidebar";
import Image from "next/image";
import Navmain from "./nav-main";

type Props = {
  userId: string | null;
};

const AppSidebar = (props: Props) => {
  return (
    <>
      <Sidebar className="z-30" collapsible="icon">
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
              <span className="text-3xl font-light">Suika</span>
            </SidebarGroupLabel>
          </div>
        </SidebarHeader>

        <SidebarContent>
          <Navmain userId={props.userId} />
        </SidebarContent>
      </Sidebar>
    </>
  );
};

export default AppSidebar;
