import { getServerSession } from "@/action/get-session";
import { getProblemSpaceById } from "@/action/problem-space";
import ProblemSpaceIdContainer from "@/components/problem-space/problem-space-id-container";
import { notFound } from "next/navigation";

import React from "react";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

const ProblemSpaceIdPage = async (props: Props) => {
  const { id } = await props.params;
  const session = await getServerSession();
  const user = session?.user;

  if (!user) {
    return <div className="p-4">Please sign in to continue.</div>;
  }

  const problemSpace = await getProblemSpaceById(id);

  if (!problemSpace) {
    notFound();
  }

  return (
    <div>
      <ProblemSpaceIdContainer user={user as any} problemSpace={problemSpace} />
    </div>
  );
};

export default ProblemSpaceIdPage;