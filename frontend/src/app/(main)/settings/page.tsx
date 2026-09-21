import { getUserId } from "@/action/get-user-id";
import { redirect } from "next/navigation";

const SettingsControllerPage = async () => {
  const userId = await getUserId();

  if (!userId) {
    redirect("/sign-in");
  }

  redirect(`/settings/${userId}`);
};

export default SettingsControllerPage;
