import AppSidebarContainer from "@/components/sidebar/app-sidebar-container";
import MainNavbar from "@/components/global/main-navbar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getServerSession } from "@/action/get-session";
import prisma from "@/lib/prisma";
import React from "react";

type Props = {
  children: React.ReactNode;
};

const MainLayout = async ({ children }: Props) => {
  const session = await getServerSession();
  const user = session?.user;

  const subscription = user
    ? await prisma.subscription.findUnique({
        where: {
          userId: user.id,
        },
        select: {
          plan: true,
        },
      })
    : null;

  const planLabel = subscription?.plan
    ? subscription.plan
        .toLowerCase()
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
    : "Free";

  return (
    <SidebarProvider suppressHydrationWarning>
      <AppSidebarContainer />

      <SidebarInset>
        <main
          className="w-full min-h-screen flex flex-col bg-linear-to-b from-brand-surface via-white to-brand-red-100/25"
          suppressHydrationWarning
        >
          <MainNavbar
            userName={user?.name || "User"}
            userImage={user?.image}
            currentPlan={planLabel}
          />
          <div className="p-0 md:p-4 pt-2 flex-1 ">{children}</div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default MainLayout;
