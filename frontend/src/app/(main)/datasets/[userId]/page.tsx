import { getServerSession } from "@/action/get-session";
import DatasetsClient from "@/components/datasets/datasets-client";
import React from "react";

type Props = {
  params: Promise<{ userId: string }>;
};

const DatasetsPage = async ({ params }: Props) => {
  const session = await getServerSession();
  const user = session?.user;
  const { userId } = await params;

  if (!user || user.id !== userId) {
    return (
      <div className="mx-auto w-full max-w-350 space-y-4 px-4 py-4 md:px-5 md:py-5 text-brand-ink">
        <div className="rounded-xl border border-(--brand-red)/20 bg-brand-red-100/35 p-6 text-center">
          <p className="text-brand-red font-medium">Unauthorized</p>
          <p className="text-sm text-[#5f7a70] mt-2">You don't have permission to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-350 space-y-4 px-4 py-4 md:px-5 md:py-5 text-brand-ink">
      <DatasetsClient userId={userId} />
    </div>
  );
};

export default DatasetsPage;