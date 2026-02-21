import AppSidebarContainer from "@/components/sidebar/app-sidebar-container";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import React from "react";

type Props = {
  children: React.ReactNode;
};

const DashboardLayout = ({ children }: Props) => {
  return (
    <SidebarProvider>
      <AppSidebarContainer />

      <SidebarInset>
        <main
          className="w-full min-h-screen flex flex-col"
          suppressHydrationWarning
        >
          <div className="flex items-start pl-4">
            <SidebarTrigger className="mt-6  z-50" />
            {/* Navbar */}
          </div>

          <div className="p-0 md:p-4 pt-2 flex-1">{children}</div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default DashboardLayout;
