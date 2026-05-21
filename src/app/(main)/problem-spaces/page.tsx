import { getUserId } from "@/action/get-user-id";
import { redirect } from "next/navigation";

const ProblemSpacesControllerPage = async () => {
  const userId = await getUserId();

  if (!userId) {
    redirect("/sign-in");
  }

  redirect(`/problem-spaces/${userId}`);
};

export default ProblemSpacesControllerPage;
