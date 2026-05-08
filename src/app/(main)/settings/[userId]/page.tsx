import { getServerSession } from "@/action/get-session";
import SettingsView from "@/components/settings/settings-view";
import React from "react";

type Props = {};

const SettingsPage = async (props: Props) => {
  const session = await getServerSession();
  const user = session?.user;
  return (
    <div className="max-w-6xl mx-auto rounded-2xl border border-(--brand-green)/15 bg-white/85 p-5 md:p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-light text-brand-ink">Settings</h1>
        <p className="text-[#5b766c]">
          Your space, your rules. Adjust everything to feel right.
        </p>
      </div>
      <SettingsView user={user as any} />
    </div>
  );
};

export default SettingsPage;
