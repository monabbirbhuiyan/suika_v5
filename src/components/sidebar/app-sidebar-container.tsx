import React from "react";
import AppSidebar from "./app-sidebar";
import { getUserId } from "@/action/get-user-id";

type Props = {};

const AppSidebarContainer = async (props: Props) => {
  const userId = await getUserId();
  return <AppSidebar userId={userId} />;
};

export default AppSidebarContainer;
