"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Bell, CreditCard, Shield, User2 } from "lucide-react";

import ProfileTab, { AppUser } from "./profile-tab";
import NotificationsTab from "./notification-tab";
import PrivacyTab from "./privacy-tab";
import BillingTab from "./billings-tab";

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
  { id: "billing", label: "Billing", icon: CreditCard, Component: BillingTab },
];

interface Props {
  user: AppUser;
}

const SettingsView = ({ user }: Props) => {
  const [activeTab, setActiveTab] = useState("profile");

  const activeTabData = tabs.find((tab) => tab.id === activeTab);
  const ActiveComponent = activeTabData?.Component || ProfileTab;

  const handleSave = async (section: string) => {
    // Optional parent acknowledgment hook
  };

  return (
    <div className="mt-8 flex gap-8">
      {/* Tab Navigation */}
      <nav className="flex flex-col gap-1 w-52 shrink-0 rounded-xl border border-border/50 bg-stone-50/50 p-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm transition-colors w-full text-left ${
                isActive
                  ? "bg-brand-green/10 text-brand-green font-medium"
                  : "text-[#5f7a70] hover:text-brand-ink hover:bg-white"
              }`}
            >
              {Icon && <Icon className="w-4 h-4" />}
              {tab.label}
            </button>
          );
        })}
      </nav>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        className="flex-1 min-w-0 rounded-xl border border-border/50 bg-white p-4 md:p-5"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <ActiveComponent user={user} onSave={handleSave} />
      </motion.div>
    </div>
  );
};

export default SettingsView;
