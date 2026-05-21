import { getUserId } from "@/action/get-user-id";
import { redirect } from "next/navigation";

const JournalControllerPage = async () => {
  const userId = await getUserId();

  if (!userId) {
    redirect("/sign-in");
  }

  redirect(`/journal/${userId}`);
};

export default JournalControllerPage;
