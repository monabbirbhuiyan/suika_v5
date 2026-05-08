"use client";

import { User } from "@/generated/prisma";
import {
  AlertTriangle,
  Download,
  RefreshCw,
  Shield,
  Database,
  Lock,
  Trash2,
} from "lucide-react";
import React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

type Props = {
  user: User;
  onSave: (section: string) => Promise<void>;
};

type PrivacyPrefs = {
  profileSearchable: boolean;
  allowUsageAnalytics: boolean;
  allowAiTraining: boolean;
  allowPersonalizedInsights: boolean;
  dataRetentionPolicy: string;
};

const DEFAULTS: PrivacyPrefs = {
  profileSearchable: false,
  allowUsageAnalytics: false,
  allowAiTraining: false,
  allowPersonalizedInsights: true,
  dataRetentionPolicy: "forever",
};

const RETENTION_OPTIONS = [
  {
    value: "forever",
    label: "Keep forever",
    description: "Never auto-delete your journal and problem-space data.",
  },
  {
    value: "365d",
    label: "12 months",
    description: "Automatically remove data older than one year.",
  },
  {
    value: "180d",
    label: "6 months",
    description: "Automatically remove data older than six months.",
  },
  {
    value: "90d",
    label: "3 months",
    description: "Automatically remove data older than three months.",
  },
  {
    value: "30d",
    label: "30 days",
    description: "Automatically remove data older than 30 days.",
  },
] as const;

const PrivacyTab = ({ onSave }: Props) => {
  const [prefs, setPrefs] = React.useState<PrivacyPrefs>(DEFAULTS);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [exportingData, setExportingData] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = React.useState("");

  React.useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/settings/privacy");
        if (!res.ok) throw new Error();
        const data = (await res.json()) as { prefs: PrivacyPrefs };
        setPrefs(data.prefs);
      } catch {
        toast.error("Failed to load privacy preferences.");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const patch = async (update: Partial<PrivacyPrefs>) => {
    setSaving(true);
    const prev = prefs;
    setPrefs({ ...prefs, ...update });

    try {
      const res = await fetch("/api/settings/privacy", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(update),
      });

      if (!res.ok) throw new Error();

      const data = (await res.json()) as { prefs: PrivacyPrefs };
      setPrefs(data.prefs);
      await onSave("privacy");
      toast.success("Privacy settings saved.");
    } catch {
      setPrefs(prev);
      toast.error("Failed to save privacy settings.");
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async () => {
    setExportingData(true);
    try {
      const res = await fetch("/api/settings/privacy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "export" }),
      });

      if (!res.ok) throw new Error();

      const payload = (await res.json()) as { data: unknown };
      const json = JSON.stringify(payload.data, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `suika-data-export-${new Date().toISOString().slice(0, 10)}.json`;
      anchor.click();
      URL.revokeObjectURL(url);

      toast.success("Data export generated.");
    } catch {
      toast.error("Failed to export your data.");
    } finally {
      setExportingData(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== "DELETE") {
      toast.error("Type DELETE to confirm account deletion.");
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch("/api/settings/privacy", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation: "DELETE" }),
      });

      if (!res.ok) throw new Error();

      toast.success("Account deleted.");
      window.location.href = "/sign-in";
    } catch {
      toast.error("Failed to delete account.");
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-(--brand-green)/15 bg-white p-6 flex items-center gap-3 text-sm text-[#5f7a70]">
        <RefreshCw className="h-4 w-4 animate-spin text-brand-green" />
        Loading privacy controls...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-(--brand-green)/15 bg-white p-5">
        <div className="flex items-start gap-3 mb-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-(--brand-green)/10">
            <Shield className="h-4 w-4 text-brand-green" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-brand-ink">
              Privacy controls
            </h3>
            <p className="text-xs text-[#5f7a70] mt-0.5">
              Decide how your profile appears and how data is used.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4 border-b border-(--brand-green)/10 pb-4">
            <div className="min-w-0">
              <Label
                className="text-sm font-medium text-brand-ink"
                htmlFor="profileSearchable"
              >
                Profile searchable in shared spaces
              </Label>
              <p className="text-xs text-[#5f7a70] mt-0.5">
                Let collaborators find your profile by name.
              </p>
            </div>
            <Switch
              id="profileSearchable"
              checked={prefs.profileSearchable}
              disabled={saving}
              onCheckedChange={(checked) =>
                void patch({ profileSearchable: checked })
              }
              className="data-[state=checked]:bg-brand-green shrink-0"
            />
          </div>

          <div className="flex items-start justify-between gap-4 border-b border-(--brand-green)/10 pb-4">
            <div className="min-w-0">
              <Label
                className="text-sm font-medium text-brand-ink"
                htmlFor="allowUsageAnalytics"
              >
                Allow usage analytics
              </Label>
              <p className="text-xs text-[#5f7a70] mt-0.5">
                Help improve product quality with anonymous usage metrics.
              </p>
            </div>
            <Switch
              id="allowUsageAnalytics"
              checked={prefs.allowUsageAnalytics}
              disabled={saving}
              onCheckedChange={(checked) =>
                void patch({ allowUsageAnalytics: checked })
              }
              className="data-[state=checked]:bg-brand-green shrink-0"
            />
          </div>

          <div className="flex items-start justify-between gap-4 border-b border-(--brand-green)/10 pb-4">
            <div className="min-w-0">
              <Label
                className="text-sm font-medium text-brand-ink"
                htmlFor="allowAiTraining"
              >
                Allow AI model improvement from my content
              </Label>
              <p className="text-xs text-[#5f7a70] mt-0.5">
                Permit anonymized learning signals from your entries and nodes.
              </p>
            </div>
            <Switch
              id="allowAiTraining"
              checked={prefs.allowAiTraining}
              disabled={saving}
              onCheckedChange={(checked) =>
                void patch({ allowAiTraining: checked })
              }
              className="data-[state=checked]:bg-brand-green shrink-0"
            />
          </div>

          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <Label
                className="text-sm font-medium text-brand-ink"
                htmlFor="allowPersonalizedInsights"
              >
                Personalized insight ranking
              </Label>
              <p className="text-xs text-[#5f7a70] mt-0.5">
                Tailor suggested fragments and patterns using your activity.
              </p>
            </div>
            <Switch
              id="allowPersonalizedInsights"
              checked={prefs.allowPersonalizedInsights}
              disabled={saving}
              onCheckedChange={(checked) =>
                void patch({ allowPersonalizedInsights: checked })
              }
              className="data-[state=checked]:bg-brand-green shrink-0"
            />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-(--brand-green)/15 bg-white p-5">
        <div className="flex items-start gap-3 mb-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-(--brand-green)/10">
            <Database className="h-4 w-4 text-brand-green" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-brand-ink">
              Data retention
            </h3>
            <p className="text-xs text-[#5f7a70] mt-0.5">
              Set how long personal records are retained by default.
            </p>
          </div>
        </div>

        <div className="flex gap-3 flex-wrap">
          {RETENTION_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              disabled={saving}
              onClick={() => void patch({ dataRetentionPolicy: option.value })}
              className={`flex-1 min-w-36 rounded-lg border px-4 py-3 text-left transition-all ${
                prefs.dataRetentionPolicy === option.value
                  ? "border-brand-green bg-(--brand-green)/8 text-brand-ink"
                  : "border-(--brand-green)/15 bg-white text-[#5f7a70] hover:border-(--brand-green)/40"
              }`}
            >
              <p
                className={`text-sm font-medium ${
                  prefs.dataRetentionPolicy === option.value
                    ? "text-brand-green"
                    : ""
                }`}
              >
                {option.label}
              </p>
              <p className="text-xs text-[#5f7a70] mt-0.5">
                {option.description}
              </p>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-(--brand-green)/15 bg-white p-5">
        <div className="flex items-start gap-3 mb-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-(--brand-green)/10">
            <Lock className="h-4 w-4 text-brand-green" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-brand-ink">Data tools</h3>
            <p className="text-xs text-[#5f7a70] mt-0.5">
              Export your records at any time as JSON.
            </p>
          </div>
        </div>

        <Button
          type="button"
          onClick={handleExport}
          disabled={exportingData}
          className="bg-brand-green hover:bg-brand-green-700 text-white"
        >
          <Download className="h-4 w-4" />
          {exportingData ? "Preparing export..." : "Export my data"}
        </Button>
      </div>

      <div className="rounded-xl border border-(--brand-red)/25 bg-white p-5">
        <div className="flex items-start gap-3 mb-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-(--brand-red)/10">
            <AlertTriangle className="h-4 w-4 text-brand-red" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-brand-red">
              Danger zone
            </h3>
            <p className="text-xs text-[#5f7a70] mt-0.5">
              Permanently delete your account and all associated data.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Label
            htmlFor="delete-confirmation"
            className="text-sm text-brand-ink"
          >
            Type DELETE to confirm
          </Label>
          <Input
            id="delete-confirmation"
            value={deleteConfirmation}
            onChange={(event) => setDeleteConfirmation(event.target.value)}
            placeholder="DELETE"
            className="max-w-sm"
          />
          <Button
            type="button"
            variant="destructive"
            disabled={deleting || deleteConfirmation !== "DELETE"}
            onClick={handleDeleteAccount}
            className="w-fit"
          >
            <Trash2 className="h-4 w-4" />
            {deleting ? "Deleting account..." : "Delete account permanently"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PrivacyTab;
