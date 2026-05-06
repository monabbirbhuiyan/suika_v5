import { getUserId } from "@/action/get-user-id";
import { redirect } from "next/navigation";

const DashboardControllerPage = async () => {
  const userId = await getUserId();

  if (!userId) {
    redirect("/sign-in");
  }

  redirect(`/dashboard/${userId}`);
};

export default DashboardControllerPage;
