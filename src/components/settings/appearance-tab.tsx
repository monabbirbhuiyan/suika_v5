"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { Monitor, Moon, Sun } from "lucide-react";

const themes = [
  { id: "light", label: "Light", icon: Sun },
  { id: "dark", label: "Dark", icon: Moon },
  { id: "system", label: "System", icon: Monitor },
];

const accentColors = [
  {
    id: "blue",
    color: "bg-blue-500",
    light: "oklch(0.55 0.18 260)",
    dark: "oklch(0.55 0.18 260)",
  },
  {
    id: "purple",
    color: "bg-purple-500",
    light: "oklch(0.55 0.18 300)",
    dark: "oklch(0.55 0.18 300)",
  },
  {
    id: "green",
    color: "bg-green-500",
    light: "oklch(0.55 0.18 150)",
    dark: "oklch(0.55 0.18 150)",
  },
  {
    id: "orange",
    color: "bg-orange-500",
    light: "oklch(0.65 0.18 40)",
    dark: "oklch(0.65 0.18 40)",
  },
  {
    id: "pink",
    color: "bg-pink-500",
    light: "oklch(0.65 0.18 350)",
    dark: "oklch(0.65 0.18 350)",
  },
  {
    id: "teal",
    color: "bg-teal-500",
    light: "oklch(0.55 0.18 180)",
    dark: "oklch(0.55 0.18 180)",
  },
];

const AppearanceTab = () => {
  const { theme, setTheme } = useTheme();
  const [selectedAccent, setSelectedAccent] = useState("blue");
  const [compactMode, setCompactMode] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [animations, setAnimations] = useState(true);
  const [showAISuggestions, setShowAISuggestions] = useState(true);

  useEffect(() => {
    // Load saved accent color from localStorage
    const savedAccent = localStorage.getItem("accent-color");
    if (savedAccent) {
      setSelectedAccent(savedAccent);
      applyAccentColor(savedAccent);
    } else {
      // Apply default accent color on first load
      applyAccentColor("blue");
    }
  }, []);

  useEffect(() => {
    // Reapply accent color when theme changes
    if (selectedAccent) {
      applyAccentColor(selectedAccent);
    }
  }, [theme, selectedAccent]);

  const applyAccentColor = (accentId: string) => {
    const accent = accentColors.find((a) => a.id === accentId);
    if (!accent) return;

    const root = document.documentElement;
    const isDark = document.documentElement.classList.contains("dark");

    // Update all accent-related CSS variables
    const accentValue = isDark ? accent.dark : accent.light;

    root.style.setProperty("--accent", accentValue);
    root.style.setProperty("--accent-foreground", "oklch(0.985 0 0)");

    // Also update chart colors if you want them to match the accent
    root.style.setProperty("--chart-1", accentValue);

    // Update sidebar accent to match
    root.style.setProperty("--sidebar-accent", accentValue);
  };

  const handleAccentChange = (accentId: string) => {
    setSelectedAccent(accentId);
    applyAccentColor(accentId);
    localStorage.setItem("accent-color", accentId);
  };

  return (
    <div className="space-y-6">
      <Card className="border-(--brand-green)/15 bg-white">
        <CardHeader>
          <CardTitle className="text-brand-ink">Theme</CardTitle>
          <CardDescription className="text-[#5f7a70]">
            Select your preferred color scheme
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {themes.map((themeOption) => (
              <button
                key={themeOption.id}
                type="button"
                onClick={() => setTheme(themeOption.id)}
                className={cn(
                  "flex flex-col items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors",
                  theme === themeOption.id
                    ? "border-(--brand-green)/50 bg-brand-green-100/50"
                    : "border-(--brand-green)/15 bg-brand-surface/60 hover:bg-brand-green-100/35",
                )}
              >
                <themeOption.icon className="size-6 text-muted-foreground" />
                <span className="text-sm font-medium">{themeOption.label}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-(--brand-green)/15 bg-white">
        <CardHeader>
          <CardTitle className="text-brand-ink">Accent Color</CardTitle>
          <CardDescription className="text-[#5f7a70]">
            Choose your accent color for buttons and highlights
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {accentColors.map((accent) => (
              <button
                key={accent.id}
                type="button"
                onClick={() => handleAccentChange(accent.id)}
                className={cn(
                  "size-10 rounded-full ring-2 ring-offset-2 ring-offset-background transition-all",
                  accent.color,
                  selectedAccent === accent.id
                    ? "ring-brand-ink"
                    : "ring-transparent",
                )}
                aria-label={`Select ${accent.id} accent color`}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-(--brand-green)/15 bg-white">
        <CardHeader>
          <CardTitle className="text-brand-ink">Display</CardTitle>
          <CardDescription className="text-[#5f7a70]">
            Customize your display preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Animations</Label>
              <p className="text-xs text-muted-foreground">
                Enable smooth transitions and animations
              </p>
            </div>
            <Switch checked={animations} onCheckedChange={setAnimations} />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Show AI Suggestions</Label>
              <p className="text-xs text-muted-foreground">
                Display inline AI suggestions while working
              </p>
            </div>
            <Switch
              checked={showAISuggestions}
              onCheckedChange={setShowAISuggestions}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AppearanceTab;
