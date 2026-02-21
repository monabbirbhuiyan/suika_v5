import { getProblemSpaces } from "@/action/problem-space";
import ProblemSpaceContainer from "@/components/problem-space/problem-space-container";
import React from "react";

type Props = {};

const ProbelmSpacePage = async (props: Props) => {
  const problemSpace = await getProblemSpaces();
  return (
    <div>
      <ProblemSpaceContainer problemSpace={problemSpace?.problemSpaces || []} />
    </div>
  );
};

export default ProbelmSpacePage;
