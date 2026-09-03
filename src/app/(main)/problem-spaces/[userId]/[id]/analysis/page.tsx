import { getServerSession } from "@/action/get-session";
import { getProblemSpaceById } from "@/action/problem-space";
import AnalysisPageClient from "@/components/problem-space/analysis-page-client";
import { notFound } from "next/navigation";

import React from "react";

type Props = {
  params: Promise<{
    userId: string;
    id: string;
  }>;
};

const AnalysisPage = async (props: Props) => {
  const { userId, id } = await props.params;
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
    <AnalysisPageClient
      problemSpaceId={problemSpace.id}
      userId={userId}
      problemSpaceTitle={problemSpace.title}
    />
  );
};

export default AnalysisPage;
