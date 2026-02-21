"use client";

import { User } from "@/generated/prisma";
import { Bell, CreditCard, Palette, Shield, User2 } from "lucide-react";
import React from "react";
import ProfileTab from "./profile-tab";
import NotificationsTab from "./notification-tab";
import PrivacyTab from "./privacy-tab";
import AppearanceTab from "./appearance-tab";
import BillingTab from "./billings-tab";
import { motion } from "framer-motion";

const tabs = [
  { id: "profile", label: "Profile", icon: User2, Component: ProfileTab },
  {
    id: "notifications",
    label: "Notifications",
    icon: Bell,
    Component: NotificationsTab,
  },
  {
    id: "privacy",
    label: "Privacy & Data",
    icon: Shield,
    Component: PrivacyTab,
  },
  {
    id: "appearance",
    label: "Appearance",
    icon: Palette,
    Component: AppearanceTab,
  },
  { id: "billing", label: "Billing", icon: CreditCard, Component: BillingTab },
];

type Props = {
  user: User;
};

const SettingsView = (props: Props) => {
  const [activeTab, setActiveTab] = React.useState("profile");
  const [isSaving, setIsSaving] = React.useState(false);
  const [savedSection, setSavedSection] = React.useState<string | null>(null);
  const activeTabData = tabs.find((tab) => tab.id === activeTab);
  const ActiveComponent = (activeTabData?.Component ||
    ProfileTab) as React.ComponentType<{
    user: User;
    onSave: (section: string) => Promise<void>;
  }>;

  const handleSave = async (section: string) => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
    setSavedSection(section);
    setTimeout(() => setSavedSection(null), 2000);
  };

  return (
    <div className="mt-8 flex gap-8">
      {/* Tab Naviagation */}
      <nav className="flex flex-col gap-1 w-48 shrink-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm text-accent transition-colors w-full text-left ${
              activeTab === tab.id
                ? "bg-sage/15 text-sage font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-card"
            }`}
          >
            {tab.icon && <tab.icon className="w-4 h-4" />}
            {tab.label}
          </button>
        ))}
      </nav>

      {/* tab content */}
      <motion.div
        key={activeTab}
        className="flex-1 min-w-0"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <ActiveComponent user={props.user} onSave={handleSave} />
      </motion.div>
    </div>
  );
};

export default SettingsView;
