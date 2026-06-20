import { getUserId } from "@/action/get-user-id";
import { redirect } from "next/navigation";

const DatasetsControllerPage = async () => {
  const userId = await getUserId();

  if (!userId) {
    redirect("/sign-in");
  }

  redirect(`/datasets/${userId}`);
};

export default DatasetsControllerPage;