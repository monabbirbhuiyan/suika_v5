import { getServerSession } from "@/action/get-session";
import { getProblemSpaces } from "@/action/problem-space";
import ProblemSpaceContainer from "@/components/problem-space/problem-space-container";
import React from "react";

type Props = {};

const ProbelmSpacePage = async (props: Props) => {
  const problemSpace = await getProblemSpaces();
  const session = await getServerSession();
  const user = session?.user ?? null;

  return (
    <div>
      <ProblemSpaceContainer problemSpace={problemSpace?.problemSpaces || []} />
    </div>
  );
};

export default ProbelmSpacePage;
