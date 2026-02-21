import { getServerSession } from "@/action/get-session";
import SettingsView from "@/components/settings/settings-view";
import React from "react";

type Props = {};

const SettingsPage = async (props: Props) => {
  const session = await getServerSession();
  const user = session?.user;
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-light text-foreground">Settings</h1>
        <p className="text-muted-foreground">
          Your space, your rules. Adjust everything to feel right.
        </p>
      </div>
      <SettingsView user={user as any} />
    </div>
  );
};

export default SettingsPage;
