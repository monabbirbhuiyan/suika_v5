import Link from "next/link";
import React from "react";
import { getProblemSpaces } from "@/action/problem-space";
import { getServerSession } from "@/action/get-session";
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

const fragmentTypeLabels: Record<FragmentType, string> = {
  QUESTION: "Questions",
  IDEA: "Ideas",
  OBSERVATION: "Observations",
  CONSTRAINS: "Constraints",
  CONCLUSION: "Conclusions",
};

const fragmentGroups: { label: string; types: FragmentType[]; color: string }[] = [
  { label: "Claims", types: ["IDEA", "CONCLUSION"], color: "bg-[#005b96]" },
  { label: "Evidence", types: ["OBSERVATION", "CONSTRAINS"], color: "bg-[#dc8b30]" },
  { label: "Questions", types: ["QUESTION"], color: "bg-primary" },
];

const sortByUpdatedAtDesc = <T extends { updatedAt: Date }>(items: T[]) => {
  return [...items].sort(
    (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime(),
  );
};

const safePercent = (value: number) => {
  return Math.max(0, Math.min(100, Math.round(value)));
};

const DashboardPage = async () => {
  const [session, data] = await Promise.all([
    getServerSession(),
    getProblemSpaces(),
  ]);

  const user = session?.user;
  const spaces = data?.problemSpaces ?? [];
  const sortedSpaces = sortByUpdatedAtDesc(spaces);

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

  const activeThisWeek = spaces.filter(
    (space) => now - new Date(space.updatedAt).getTime() <= oneWeekMs,
  ).length;

  const stalledSpaces = spaces.filter((space) => {
    const stale = now - new Date(space.updatedAt).getTime() > twoWeeksMs;
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
    <div className="mx-auto w-full max-w-350 space-y-4 px-4 py-4 md:px-5 md:py-5 text-brand-ink">
      {/* Hero Banner */}
      <Card className="overflow-hidden border-(--brand-green)/20 bg-linear-to-r from-white via-brand-surface to-brand-green-100/45">
        <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5 md:p-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-brand-green" />
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-green">
                Clarity Command Center
              </p>
            </div>
            <h1 className="font-serif text-2xl text-brand-ink md:text-3xl">
              {user?.name
                ? `${user.name.split(" ")[0]}'s Dashboard`
                : "Dashboard"}
            </h1>
            <p className="max-w-2xl text-sm text-[#56746a]">
              Track momentum, spot bottlenecks, and measure decision quality
              across all your problem spaces.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="rounded-full px-3 py-1 text-xs border-(--brand-green)/30 bg-white text-brand-green"
            >
              {engagementRate}% active this week
            </Badge>
            <Button
              asChild
              className="rounded-full bg-brand-green hover:bg-brand-green-700 text-white"
            >
              <Link href={`/problem-spaces/${user?.id}`}>
                Problem Spaces
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card className="border-(--brand-green)/15 bg-white/95">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Problem Spaces
              </p>
              <Layers className="h-3.5 w-3.5 text-muted-foreground/50" />
            </div>
            <p className="mt-2 text-3xl font-semibold text-brand-ink">
              {totalProblemSpaces}
            </p>
            <p className="text-xs text-muted-foreground">
              {activeThisWeek} active this week
            </p>
          </CardContent>
        </Card>

        <Card className="border-(--brand-green)/15 bg-white/95">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Average Clarity
              </p>
              <Target className="h-3.5 w-3.5 text-muted-foreground/50" />
            </div>
            <p className="mt-2 text-3xl font-semibold text-brand-ink">
              {averageClarity}%
            </p>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-(--brand-green)/10">
              <div
                className="h-full rounded-full bg-brand-green transition-all"
                style={{ width: `${averageClarity}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-(--brand-green)/15 bg-white/95">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Fragments
              </p>
              <Brain className="h-3.5 w-3.5 text-muted-foreground/50" />
            </div>
            <p className="mt-2 text-3xl font-semibold text-brand-ink">
              {totalFragments}
            </p>
            <p className="text-xs text-muted-foreground">
              Thought units captured
            </p>
          </CardContent>
        </Card>

        <Card className="border-(--brand-green)/15 bg-white/95">
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
        {/* Clarity Leaderboard */}
        <Card className="xl:col-span-5 border-(--brand-green)/15 bg-white/95">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <TrendingUp className="h-4 w-4 text-brand-green" />
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
                <Button asChild variant="link" className="mt-1 text-brand-green">
                  <Link href={`/problem-spaces/${user?.id}`}>
                    Create your first space
                  </Link>
                </Button>
              </div>
            ) : (
              topSpaces.map((space) => {
                const pct = Math.max(0, Math.min(100, space.progress ?? 0));
                const barColor =
                  pct >= 70
                    ? "bg-emerald-500"
                    : pct >= 40
                      ? "bg-amber-500"
                      : "bg-rose-400";
                return (
                  <div key={space.id} className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <Link
                        href={`/problem-spaces/${user?.id}/${space.id}`}
                        className="truncate text-sm font-medium text-brand-ink hover:text-brand-green hover:underline"
                      >
                        {space.title}
                      </Link>
                      <span className="text-xs font-medium text-muted-foreground tabular-nums shrink-0">
                        {pct}%
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-(--brand-green)/10">
                      <div
                        className={`h-full rounded-full ${barColor} transition-all`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Right Column: Health + Attention */}
        <div className="xl:col-span-7 space-y-3">
          {/* Health Bands */}
          <Card className="border-(--brand-green)/15 bg-white/95">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Target className="h-4 w-4 text-brand-green" />
                Health Bands
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3 text-center">
                  <p className="text-2xl font-semibold text-emerald-700">
                    {thrivingSpaces.length}
                  </p>
                  <p className="text-[10px] font-medium uppercase tracking-wide text-emerald-600/80">
                    Thriving
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">70–100%</p>
                </div>
                <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3 text-center">
                  <p className="text-2xl font-semibold text-amber-700">
                    {buildingSpaces.length}
                  </p>
                  <p className="text-[10px] font-medium uppercase tracking-wide text-amber-600/80">
                    Building
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">40–69%</p>
                </div>
                <div className="rounded-lg border border-rose-200 bg-rose-50/50 p-3 text-center">
                  <p className="text-2xl font-semibold text-rose-600">
                    {earlySpaces.length}
                  </p>
                  <p className="text-[10px] font-medium uppercase tracking-wide text-rose-500/80">
                    Early
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">&lt; 40%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity + Needs Attention side by side */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Card className="border-(--brand-green)/15 bg-white/95">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="flex items-center gap-2 text-sm font-medium">
                  <Clock className="h-4 w-4 text-brand-green" />
                  Recent Activity
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
                        href={`/problem-spaces/${user?.id}/${space.id}`}
                        className="flex items-center justify-between gap-2 rounded-lg border border-(--brand-green)/10 bg-brand-surface/30 px-3 py-2 hover:bg-brand-surface/60 transition-colors"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-brand-ink">
                            {space.title}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {new Date(space.updatedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-xs font-medium text-muted-foreground">
                            {space.progress}%
                          </span>
                          <ChevronRight className="h-3 w-3 text-muted-foreground/50" />
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-(--brand-green)/15 bg-white/95">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="flex items-center gap-2 text-sm font-medium">
                  <AlertTriangle className="h-4 w-4 text-brand-red" />
                  Needs Attention
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                {stalledSpaces.length === 0 ? (
                  <div className="py-4 text-center">
                    <CheckCircle2 className="h-6 w-6 text-emerald-400 mx-auto mb-1.5" />
                    <p className="text-sm text-muted-foreground">
                      All clear. No stalled spaces.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {stalledSpaces.slice(0, 4).map((space) => (
                      <Link
                        key={space.id}
                        href={`/problem-spaces/${user?.id}/${space.id}`}
                        className="block rounded-lg border border-(--brand-red)/15 bg-brand-red-100/25 px-3 py-2 hover:bg-brand-red-100/40 transition-colors"
                      >
                        <p className="truncate text-sm font-medium text-brand-ink">
                          {space.title}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {space.progress}% · updated{" "}
                          {new Date(space.updatedAt).toLocaleDateString()}
                        </p>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Bottom Row: Decision Quality + Fragment Mix */}
      <section className="grid grid-cols-1 gap-3 xl:grid-cols-3">
        <Card className="xl:col-span-2 border-(--brand-green)/15 bg-white/95">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Compass className="h-4 w-4 text-brand-green" />
              Decision Quality
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-muted-foreground">
                    Evidence vs Claim Coverage
                  </span>
                  <span className="font-medium text-foreground">
                    {evidenceCoverage}%
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-(--brand-green)/10">
                  <div
                    className="h-full rounded-full bg-brand-green transition-all"
                    style={{ width: `${evidenceCoverage}%` }}
                  />
                </div>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  {evidenceFragments} evidence / {claimFragments} claims
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-muted-foreground">
                    Question → Conclusion
                  </span>
                  <span className="font-medium text-foreground">
                    {questionToConclusionCoverage}%
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-(--brand-green)/10">
                  <div
                    className="h-full rounded-full bg-brand-green-700 transition-all"
                    style={{ width: `${questionToConclusionCoverage}%` }}
                  />
                </div>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  {fragmentCounts.CONCLUSION} conclusions / {fragmentCounts.QUESTION} questions
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-(--brand-green)/15 bg-white/95">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <BookOpen className="h-4 w-4 text-brand-green" />
              Fragment Mix
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-2.5">
            {fragmentGroups.map((group) => {
              const count = group.types.reduce(
                (sum, t) => sum + fragmentCounts[t],
                0,
              );
              const pct =
                totalFragments === 0
                  ? 0
                  : Math.round((count / totalFragments) * 100);
              return (
                <div key={group.label} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-foreground">{group.label}</span>
                    <span className="text-muted-foreground">
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-(--brand-green)/10">
                    <div
                      className={`h-full rounded-full ${group.color} transition-all`}
                      style={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </section>

      {/* Continue Working / Empty State */}
      {lastUpdatedSpace ? (
        <Card className="border-dashed border-(--brand-green)/25 bg-white/90">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Continue where you left off
              </p>
              <p className="text-sm font-medium text-brand-ink">
                {lastUpdatedSpace.title}
              </p>
              <p className="text-xs text-muted-foreground">
                Updated {new Date(lastUpdatedSpace.updatedAt).toLocaleString()}
              </p>
            </div>
            <Button
              asChild
              variant="outline"
              className="rounded-full border-(--brand-green)/25 text-brand-green hover:bg-brand-green-100/45"
            >
              <Link href={`/problem-spaces/${user?.id}/${lastUpdatedSpace.id}`}>
                Continue
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed border-(--brand-green)/25 bg-white/90">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Get started
              </p>
              <p className="text-sm font-medium text-brand-ink">
                Create your first problem space to begin tracking clarity.
              </p>
            </div>
            <Button
              asChild
              className="rounded-full bg-brand-green hover:bg-brand-green-700 text-white"
            >
              <Link href={`/problem-spaces/${user?.id}`}>
                <Plus className="h-4 w-4 mr-1.5" />
                New Space
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DashboardPage;
