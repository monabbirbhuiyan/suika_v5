// src/app/(main)/layout.tsx
import React from "react";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { fetchFromBackend } from "@/lib/api";

import AppSidebarContainer from "@/components/sidebar/app-sidebar-container";
import MainNavbar from "@/components/global/main-navbar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

type Props = {
  children: React.ReactNode;
};

type SubscriptionResponse = {
  plan: string;
};

const MainLayout = async ({ children }: Props) => {
  // 1. Get session from Better Auth
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const user = session?.user;

  // // 2. Fetch subscription from Python backend
  // const subscription = user?.id
  //   ? await fetchFromBackend<SubscriptionResponse>(
  //       `/api/v1/users/${user.id}/subscription`,
  //     )
  //   : null;

  // const planLabel = subscription?.plan
  //   ? subscription.plan
  //       .toLowerCase()
  //       .split("_")
  //       .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
  //       .join(" ")
  //   : "Free";

  return (
    <SidebarProvider defaultOpen={false} suppressHydrationWarning>
      <AppSidebarContainer />

      <SidebarInset>
        <main
          className="w-full min-h-screen flex flex-col bg-linear-to-b from-brand-surface via-white to-brand-red-100/25"
          suppressHydrationWarning
        >
          <MainNavbar
            userName={user?.name || "User"}
            userImage={user?.image}
            // currentPlan={planLabel}
          />
          <div className="p-0 md:p-4 pt-2 flex-1">{children}</div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default MainLayout;
