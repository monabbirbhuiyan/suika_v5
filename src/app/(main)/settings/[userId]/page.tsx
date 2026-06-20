import { getServerSession } from "@/action/get-session";
import SettingsView from "@/components/settings/settings-view";
import React from "react";

type Props = {};

const SettingsPage = async (props: Props) => {
  const session = await getServerSession();
  const user = session?.user;
  return (
    <div className="max-w-6xl mx-auto rounded-2xl border border-(--brand-green)/15 bg-white/85 p-5 md:p-6">
     
      <SettingsView user={user as any} />
    </div>
  );
};

export default SettingsPage;
