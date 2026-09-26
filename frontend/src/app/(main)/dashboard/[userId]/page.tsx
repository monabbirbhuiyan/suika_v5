"use client";

import Link from "next/link";
import React, { useEffect, useState, use } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Brain,
  CheckCircle2,
  ChevronRight,
  Clock,
  Compass,
  Layers,
  Plus,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";

type FragmentType =
  | "QUESTION"
  | "IDEA"
  | "OBSERVATION"
  | "CONSTRAINS"
  | "CONCLUSION";

interface ProblemSpaceData {
  id: string;
  title: string;
  description?: string;
  progress?: number;
  updated_at?: string;
  created_at?: string;
  fragments?: { type: FragmentType }[];
}

const fragmentGroups: {
  label: string;
  types: FragmentType[];
  color: string;
}[] = [
  { label: "Claims", types: ["IDEA", "CONCLUSION"], color: "bg-[#005b96]" },
  {
    label: "Evidence",
    types: ["OBSERVATION", "CONSTRAINS"],
    color: "bg-[#dc8b30]",
  },
  { label: "Questions", types: ["QUESTION"], color: "bg-primary" },
];

const safePercent = (value: number) => {
  return Math.max(0, Math.min(100, Math.round(value)));
};

export default function DashboardPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const resolvedParams = use(params);
  const userId = resolvedParams.userId;

  const [spaces, setSpaces] = useState<ProblemSpaceData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        // Direct call to FastAPI backend
        const res = await fetch(
          `http://127.0.0.1:8000/api/problem-spaces/user/${userId}`,
        );
        if (!res.ok) {
          // If the endpoint isn't created yet or empty, fallback gracefully
          setSpaces([]);
          return;
        }
        const data = await res.json();
        setSpaces(Array.isArray(data) ? data : data.problem_spaces || []);
      } catch (err) {
        console.error("Failed to fetch dashboard data from FastAPI:", err);
        setSpaces([]);
      } finally {
        setLoading(false);
      }
    }

    if (userId) {
      loadDashboardData();
    }
  }, [userId]);

  const sortedSpaces = [...spaces].sort((a, b) => {
    const timeA = new Date(
      a.updated_at || a.created_at || Date.now(),
    ).getTime();
    const timeB = new Date(
      b.updated_at || b.created_at || Date.now(),
    ).getTime();
    return timeB - timeA;
  });

  const totalProblemSpaces = spaces.length;
  const totalFragments = spaces.reduce(
    (sum, space) => sum + (space.fragments?.length ?? 0),
    0,
  );
  const averageClarity =
    totalProblemSpaces === 0
      ? 0
      : Math.round(
          spaces.reduce((sum, space) => sum + (space.progress ?? 0), 0) /
            totalProblemSpaces,
        );

  const now = Date.now();
  const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
  const twoWeeksMs = 14 * 24 * 60 * 60 * 1000;

  const activeThisWeek = spaces.filter((space) => {
    const spaceDate = new Date(
      space.updated_at || space.created_at || now,
    ).getTime();
    return now - spaceDate <= oneWeekMs;
  }).length;

  const stalledSpaces = spaces.filter((space) => {
    const stale =
      now - new Date(space.updated_at || space.created_at || now).getTime() >
      twoWeeksMs;
    const lowClarity = (space.progress ?? 0) < 45;
    return stale && lowClarity;
  });

  const thrivingSpaces = spaces.filter((space) => (space.progress ?? 0) >= 70);
  const buildingSpaces = spaces.filter(
    (space) => (space.progress ?? 0) >= 40 && (space.progress ?? 0) < 70,
  );
  const earlySpaces = spaces.filter((space) => (space.progress ?? 0) < 40);

  const fragmentCounts = spaces.reduce(
    (acc, space) => {
      (space.fragments ?? []).forEach((fragment) => {
        if (fragment.type in acc) {
          acc[fragment.type] += 1;
        }
      });
      return acc;
    },
    {
      QUESTION: 0,
      IDEA: 0,
      OBSERVATION: 0,
      CONSTRAINS: 0,
      CONCLUSION: 0,
    } satisfies Record<FragmentType, number>,
  );

  const topSpaces = [...spaces]
    .sort((a, b) => (b.progress ?? 0) - (a.progress ?? 0))
    .slice(0, 6);

  const recentSpaces = sortedSpaces.slice(0, 5);

  const claimFragments = fragmentCounts.IDEA + fragmentCounts.CONCLUSION;
  const evidenceFragments =
    fragmentCounts.OBSERVATION + fragmentCounts.CONSTRAINS;
  const evidenceCoverage =
    claimFragments === 0
      ? 100
      : safePercent((evidenceFragments / claimFragments) * 100);

  const questionToConclusionCoverage =
    fragmentCounts.QUESTION === 0
      ? 0
      : safePercent(
          (fragmentCounts.CONCLUSION / fragmentCounts.QUESTION) * 100,
        );

  const engagementRate =
    totalProblemSpaces === 0
      ? 0
      : safePercent((activeThisWeek / totalProblemSpaces) * 100);

  const lastUpdatedSpace = sortedSpaces[0] ?? null;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 px-4 py-4 md:px-5 md:py-5 text-foreground">
      {/* Hero Banner */}
      <Card className="overflow-hidden border-primary/20 bg-linear-to-r from-card via-background to-primary/5">
        <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5 md:p-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                Clarity Command Center
              </p>
            </div>
            <h1 className="font-serif text-2xl md:text-3xl font-semibold">
              Dashboard
            </h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Track momentum, spot bottlenecks, and verify legal reasoning
              pathways directly from the FastAPI neural solver.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="rounded-full px-3 py-1 text-xs border-primary/30 bg-background text-primary"
            >
              {engagementRate}% active this week
            </Badge>
            <Button className="rounded-full">
              <Link href={`/problem-spaces/${userId}`}>
                Problem Spaces
                <ArrowRight className="h-4 w-4 ml-1.5" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Problem Spaces
              </p>
              <Layers className="h-3.5 w-3.5 text-muted-foreground/50" />
            </div>
            <p className="mt-2 text-3xl font-semibold">
              {loading ? "..." : totalProblemSpaces}
            </p>
            <p className="text-xs text-muted-foreground">
              {activeThisWeek} active this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Average Clarity
              </p>
              <Target className="h-3.5 w-3.5 text-muted-foreground/50" />
            </div>
            <p className="mt-2 text-3xl font-semibold">{averageClarity}%</p>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-primary/10">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${averageClarity}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Fragments
              </p>
              <Brain className="h-3.5 w-3.5 text-muted-foreground/50" />
            </div>
            <p className="mt-2 text-3xl font-semibold">
              {loading ? "..." : totalFragments}
            </p>
            <p className="text-xs text-muted-foreground">
              Active fragments in memory
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Health
              </p>
              <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground/50" />
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <p className="text-3xl font-semibold text-emerald-600">
                {thrivingSpaces.length}
              </p>
              <span className="text-sm text-muted-foreground">
                / {buildingSpaces.length} / {earlySpaces.length}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Thriving / Building / Early
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Main Content Grid */}
      <section className="grid grid-cols-1 gap-3 xl:grid-cols-12">
        <Card className="xl:col-span-5">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <TrendingUp className="h-4 w-4 text-primary" />
              Clarity Leaderboard
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-2.5">
            {spaces.length === 0 ? (
              <div className="py-6 text-center">
                <Layers className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  No problem spaces yet.
                </p>
                <Button variant="link" className="mt-1">
                  <Link href={`/problem-spaces/${userId}`}>
                    Create your first space
                  </Link>
                </Button>
              </div>
            ) : (
              topSpaces.map((space) => {
                const pct = Math.max(0, Math.min(100, space.progress ?? 0));
                return (
                  <div key={space.id} className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <Link
                        href={`/problem-spaces/${userId}/${space.id}`}
                        className="truncate text-sm font-medium hover:underline"
                      >
                        {space.title}
                      </Link>
                      <span className="text-xs font-medium text-muted-foreground tabular-nums shrink-0">
                        {pct}%
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <div className="xl:col-span-7 space-y-3">
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Clock className="h-4 w-4 text-primary" />
                Recent Problem Spaces
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {recentSpaces.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No activity yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {recentSpaces.map((space) => (
                    <Link
                      key={space.id}
                      href={`/problem-spaces/${userId}/${space.id}`}
                      className="flex items-center justify-between gap-2 rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {space.title}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {space.created_at
                            ? new Date(space.created_at).toLocaleDateString()
                            : "Active"}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
