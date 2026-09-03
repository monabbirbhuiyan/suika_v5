"use client";

import React from "react";
import { toast } from "sonner";
import { Bell, Mail, Smartphone, RefreshCw } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

type Prefs = {
  emailWeeklySummary: boolean;
  emailProblemSpaceActivity: boolean;
  emailProductUpdates: boolean;
  emailSecurityAlerts: boolean;
  inAppProblemProgress: boolean;
  inAppMilestones: boolean;
  digestFrequency: string;
};

const DEFAULTS: Prefs = {
  emailWeeklySummary: true,
  emailProblemSpaceActivity: false,
  emailProductUpdates: true,
  emailSecurityAlerts: true,
  inAppProblemProgress: true,
  inAppMilestones: true,
  digestFrequency: "weekly",
};

type SectionItem = {
  key: keyof Omit<Prefs, "digestFrequency">;
  label: string;
  description: string;
};

const EMAIL_ITEMS: SectionItem[] = [
  {
    key: "emailWeeklySummary",
    label: "Weekly summary",
    description: "A digest of your week's thinking across problem spaces.",
  },
  {
    key: "emailProblemSpaceActivity",
    label: "Problem space activity",
    description: "Emails when new AI insights are generated for your spaces.",
  },
  {
    key: "emailProductUpdates",
    label: "Product updates",
    description: "Announcements about new features and improvements.",
  },
  {
    key: "emailSecurityAlerts",
    label: "Security alerts",
    description: "Important alerts about your account security. Recommended.",
  },
];

const INAPP_ITEMS: SectionItem[] = [
  {
    key: "inAppProblemProgress",
    label: "Problem space progress",
    description: "Updates when clarity progress changes in your spaces.",
  },
  {
    key: "inAppMilestones",
    label: "Milestones",
    description: "Celebrate when you hit thinking milestones.",
  },
];

const FREQUENCY_OPTIONS = [
  { value: "daily", label: "Daily", description: "One digest per day" },
  { value: "weekly", label: "Weekly", description: "One digest per week" },
  { value: "never", label: "Never", description: "No digest emails" },
] as const;

const ToggleRow = ({
  item,
  checked,
  onChange,
  disabled,
}: {
  item: SectionItem;
  checked: boolean;
  onChange: (val: boolean) => void;
  disabled: boolean;
}) => (
  <div className="flex items-start justify-between gap-4 py-3 border-b border-(--brand-green)/10 last:border-0">
    <div className="flex-1 min-w-0">
      <Label
        htmlFor={item.key}
        className="text-sm font-medium text-brand-ink cursor-pointer"
      >
        {item.label}
      </Label>
      <p className="mt-0.5 text-xs text-[#5f7a70]">{item.description}</p>
    </div>
    <Switch
      id={item.key}
      checked={checked}
      onCheckedChange={onChange}
      disabled={disabled}
      className="data-[state=checked]:bg-brand-green shrink-0 mt-0.5"
    />
  </div>
);

const SectionCard = ({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  children: React.ReactNode;
}) => (
  <div className="rounded-xl border border-(--brand-green)/15 bg-white p-5">
    <div className="flex items-start gap-3 mb-4">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-(--brand-green)/10">
        <Icon className="h-4 w-4 text-brand-green" />
      </div>
      <div>
        <h3 className="text-sm font-semibold text-brand-ink">{title}</h3>
        <p className="text-xs text-[#5f7a70] mt-0.5">{description}</p>
      </div>
    </div>
    {children}
  </div>
);

const NotificationsTab = () => {
  const [prefs, setPrefs] = React.useState<Prefs>(DEFAULTS);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/settings/notifications");
        if (!res.ok) throw new Error();
        const data = (await res.json()) as { prefs: Prefs };
        setPrefs(data.prefs);
      } catch {
        toast.error("Failed to load notification preferences.");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const patch = async (update: Partial<Prefs>) => {
    setSaving(true);
    const prev = prefs;
    setPrefs({ ...prefs, ...update });
    try {
      const res = await fetch("/api/settings/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(update),
      });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { prefs: Prefs };
      setPrefs(data.prefs);
      toast.success("Preferences saved.");
    } catch {
      setPrefs(prev);
      toast.error("Failed to save preferences.");
    } finally {
      setSaving(false);
    }
  };

  const toggle = (key: keyof Omit<Prefs, "digestFrequency">) => {
    void patch({ [key]: !prefs[key] });
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-(--brand-green)/15 bg-white p-6 flex items-center gap-3 text-sm text-[#5f7a70]">
        <RefreshCw className="h-4 w-4 animate-spin text-brand-green" />
        Loading preferences…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <SectionCard
        icon={Mail}
        title="Email notifications"
        description="Control which emails Suika sends to your inbox."
      >
        {EMAIL_ITEMS.map((item) => (
          <ToggleRow
            key={item.key}
            item={item}
            checked={prefs[item.key]}
            onChange={() => toggle(item.key)}
            disabled={saving || item.key === "emailSecurityAlerts"}
          />
        ))}
      </SectionCard>

      <SectionCard
        icon={Smartphone}
        title="In-app notifications"
        description="Manage alerts shown while you're using the app."
      >
        {INAPP_ITEMS.map((item) => (
          <ToggleRow
            key={item.key}
            item={item}
            checked={prefs[item.key]}
            onChange={() => toggle(item.key)}
            disabled={saving}
          />
        ))}
      </SectionCard>

      <SectionCard
        icon={Bell}
        title="Digest frequency"
        description="How often you want to receive summary emails."
      >
        <div className="flex gap-3 flex-wrap pt-1">
          {FREQUENCY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              disabled={saving}
              onClick={() => void patch({ digestFrequency: opt.value })}
              className={`flex-1 min-w-28 rounded-lg border px-4 py-3 text-left transition-all ${
                prefs.digestFrequency === opt.value
                  ? "border-brand-green bg-(--brand-green)/8 text-brand-ink"
                  : "border-(--brand-green)/15 bg-white text-[#5f7a70] hover:border-(--brand-green)/40"
              }`}
            >
              <p
                className={`text-sm font-medium ${prefs.digestFrequency === opt.value ? "text-brand-green" : ""}`}
              >
                {opt.label}
              </p>
              <p className="text-xs text-[#5f7a70] mt-0.5">{opt.description}</p>
            </button>
          ))}
        </div>
      </SectionCard>

      <p className="text-xs text-[#5f7a70] px-1">
        Security alert emails are always enabled and cannot be turned off to
        keep your account safe.
      </p>
    </div>
  );
};

export default NotificationsTab;
