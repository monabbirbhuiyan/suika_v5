import Link from "next/link";
import React from "react";
import { getProblemSpaces } from "@/action/problem-space";
import { getServerSession } from "@/action/get-session";
import JournalCard from "@/components/journal/journal-card";
import { JournalProvider } from "@/components/journal/journal-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertTriangle,
  ArrowRight,
  Compass,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";

type FragmentType =
  | "QUESTION"
  | "IDEA"
  | "OBSERVATION"
  | "CONSTRAINS"
  | "CONCLUSION"
  | "LEGAL_ELEMENT"
  | "BINDING_AUTHORITY"
  | "PERSUASIVE_AUTHORITY"
  | "PROCEDURAL_FACT"
  | "EVIDENTIARY_FACT";

const fragmentTypeLabels: Record<FragmentType, string> = {
  QUESTION: "Questions",
  IDEA: "Ideas",
  OBSERVATION: "Observations",
  CONSTRAINS: "Constraints",
  CONCLUSION: "Conclusions",
  LEGAL_ELEMENT: "Legal Elements",
  BINDING_AUTHORITY: "Binding Authorities",
  PERSUASIVE_AUTHORITY: "Persuasive Authorities",
  PROCEDURAL_FACT: "Procedural Facts",
  EVIDENTIARY_FACT: "Evidentiary Facts",
};

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

  const activeThisWeek = spaces.filter((space) => {
    return now - new Date(space.updatedAt).getTime() <= oneWeekMs;
  }).length;

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
      LEGAL_ELEMENT: 0,
      BINDING_AUTHORITY: 0,
      PERSUASIVE_AUTHORITY: 0,
      PROCEDURAL_FACT: 0,
      EVIDENTIARY_FACT: 0,
    } satisfies Record<FragmentType, number>,
  );

  const topSpaces = [...spaces]
    .sort((a, b) => (b.progress ?? 0) - (a.progress ?? 0))
    .slice(0, 8);

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
              A compact view of momentum, bottlenecks, and decision quality
              across your problem spaces.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="rounded-full px-3 py-1 text-xs border-(--brand-green)/30 bg-white text-brand-green"
            >
              {engagementRate}% weekly engagement
            </Badge>
            <Button
              asChild
              className="rounded-full bg-brand-green hover:bg-brand-green-700 text-white"
            >
              <Link href={`/problem-spaces/${user?.id}`}>
                Open Problem Spaces
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-8">
        <Card className="xl:col-span-2 border-(--brand-green)/15 bg-white/95">
          <CardContent className="p-4">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
              Problem Spaces
            </p>
            <p className="mt-2 text-3xl font-semibold text-brand-ink">
              {totalProblemSpaces}
            </p>
            <p className="text-xs text-muted-foreground">Total active spaces</p>
          </CardContent>
        </Card>

        <Card className="xl:col-span-2 border-(--brand-green)/15 bg-white/95">
          <CardContent className="p-4">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
              Average Clarity
            </p>
            <p className="mt-2 text-3xl font-semibold text-brand-ink">
              {averageClarity}%
            </p>
            <p className="text-xs text-muted-foreground">Across all spaces</p>
          </CardContent>
        </Card>

        <Card className="xl:col-span-2 border-(--brand-green)/15 bg-white/95">
          <CardContent className="p-4">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
              Total Fragments
            </p>
            <p className="mt-2 text-3xl font-semibold text-brand-ink">
              {totalFragments}
            </p>
            <p className="text-xs text-muted-foreground">
              Thought units captured
            </p>
          </CardContent>
        </Card>

        <Card className="xl:col-span-2 border-(--brand-green)/15 bg-white/95">
          <CardContent className="p-4">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
              Active This Week
            </p>
            <p className="mt-2 text-3xl font-semibold text-brand-ink">
              {activeThisWeek}
            </p>
            <p className="text-xs text-muted-foreground">
              Updated in last 7 days
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-3 xl:grid-cols-12">
        <Card className="xl:col-span-5 border-(--brand-green)/15 bg-white/95">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-brand-green" />
              Clarity Leaderboard
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {spaces.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No problem spaces yet. Create one to start your clarity trend.
              </p>
            ) : (
              topSpaces.map((space) => (
                <div key={space.id} className="space-y-1">
                  <div className="flex items-center justify-between gap-3">
                    <Link
                      href={`/problem-spaces/${user?.id}/${space.id}`}
                      className="truncate text-sm font-medium text-brand-ink hover:text-brand-green hover:underline"
                    >
                      {space.title}
                    </Link>
                    <Badge
                      variant="secondary"
                      className="rounded-full text-[10px]"
                    >
                      {space.progress}%
                    </Badge>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-(--brand-green)/10">
                    <div
                      className="h-full rounded-full bg-brand-green"
                      style={{
                        width: `${Math.max(0, Math.min(100, space.progress ?? 0))}%`,
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="xl:col-span-3 border-(--brand-green)/15 bg-white/95">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="h-4 w-4 text-brand-green" />
              Health Bands
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="rounded-lg border border-emerald-300/50 bg-emerald-50/40 p-3 dark:bg-emerald-900/10">
              <p className="text-xs text-muted-foreground">
                Thriving (70-100%)
              </p>
              <p className="text-2xl font-semibold text-foreground">
                {thrivingSpaces.length}
              </p>
            </div>
            <div className="rounded-lg border border-amber-300/50 bg-amber-50/40 p-3 dark:bg-amber-900/10">
              <p className="text-xs text-muted-foreground">Building (40-69%)</p>
              <p className="text-2xl font-semibold text-foreground">
                {buildingSpaces.length}
              </p>
            </div>
            <div className="rounded-lg border border-rose-300/50 bg-rose-50/40 p-3 dark:bg-rose-900/10">
              <p className="text-xs text-muted-foreground">Early (&lt; 40%)</p>
              <p className="text-2xl font-semibold text-foreground">
                {earlySpaces.length}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="xl:col-span-4 border-(--brand-green)/15 bg-white/95">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Compass className="h-4 w-4 text-brand-green" />
              Decision Quality Signals
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  Evidence vs Claim Coverage
                </span>
                <span className="font-medium text-foreground">
                  {evidenceCoverage}%
                </span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-(--brand-green)/10">
                <div
                  className="h-full rounded-full bg-brand-green"
                  style={{ width: `${evidenceCoverage}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  Question -&gt; Conclusion Coverage
                </span>
                <span className="font-medium text-foreground">
                  {questionToConclusionCoverage}%
                </span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-(--brand-green)/10">
                <div
                  className="h-full rounded-full bg-brand-green-700"
                  style={{ width: `${questionToConclusionCoverage}%` }}
                />
              </div>
            </div>

            <div className="rounded-lg border border-(--brand-green)/15 bg-brand-green-100/30 p-3 text-xs text-[#5a766c]">
              Claims: {claimFragments} · Evidence: {evidenceFragments} ·
              Questions: {fragmentCounts.QUESTION} · Conclusions:{" "}
              {fragmentCounts.CONCLUSION}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-3 xl:grid-cols-12">
        <div className="xl:col-span-5">
          <JournalProvider userId={user?.id ?? "anonymous"}>
            <JournalCard userId={user?.id ?? "anonymous"} compact />
          </JournalProvider>
        </div>

        <Card className="xl:col-span-4 border-(--brand-green)/15 bg-white/95">
          <CardHeader className="pb-3">
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {recentSpaces.length === 0 ? (
              <p className="text-sm text-muted-foreground">No activity yet.</p>
            ) : (
              <div className="space-y-3">
                {recentSpaces.map((space) => (
                  <div
                    key={space.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-(--brand-green)/15 bg-white px-3 py-2"
                  >
                    <div className="min-w-0">
                      <Link
                        href={`/problem-spaces/${user?.id}/${space.id}`}
                        className="block truncate text-sm font-medium text-brand-ink hover:text-brand-green hover:underline"
                      >
                        {space.title}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        Updated {new Date(space.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="secondary" className="rounded-full">
                      {space.progress}% clarity
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="xl:col-span-3 border-(--brand-green)/15 bg-white/95">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4 text-brand-red" />
              Needs Attention
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {stalledSpaces.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No stalled spaces right now. Your momentum looks healthy.
              </p>
            ) : (
              stalledSpaces.slice(0, 5).map((space) => (
                <div
                  key={space.id}
                  className="rounded-lg border border-(--brand-red)/20 bg-brand-red-100/35 px-3 py-2"
                >
                  <Link
                    href={`/problem-spaces/${user?.id}/${space.id}`}
                    className="block truncate text-sm font-medium text-brand-ink hover:text-brand-red hover:underline"
                  >
                    {space.title}
                  </Link>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {space.progress}% clarity · last update{" "}
                    {new Date(space.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-3 xl:grid-cols-3">
        <Card className="border-(--brand-green)/15 bg-white/95">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Fragment Mix</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(Object.keys(fragmentCounts) as FragmentType[]).map((type) => {
              const count = fragmentCounts[type];
              const pct =
                totalFragments === 0
                  ? 0
                  : Math.round((count / totalFragments) * 100);

              return (
                <div key={type} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-foreground">
                      {fragmentTypeLabels[type]}
                    </span>
                    <span className="text-muted-foreground">
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-(--brand-green)/10">
                    <div
                      className="h-full rounded-full bg-brand-green"
                      style={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="xl:col-span-2 border-(--brand-green)/15 bg-white/95">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Focus Suggestions</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3 text-sm text-muted-foreground md:grid-cols-3">
            {totalProblemSpaces === 0 ? (
              <p className="md:col-span-3">
                Create a problem space and add a few question fragments to
                receive personalized focus insights.
              </p>
            ) : (
              <>
                <p className="rounded-lg border border-(--brand-green)/15 bg-brand-green-100/30 p-3">
                  {stalledSpaces.length > 0
                    ? `${stalledSpaces.length} problem space(s) appear stalled (low clarity and no updates in 14+ days). Revisit them or archive them.`
                    : "Great momentum. No stalled spaces detected in the last 14 days."}
                </p>
                <p className="rounded-lg border border-(--brand-green)/15 bg-brand-green-100/30 p-3">
                  {fragmentCounts.QUESTION === 0
                    ? "You currently have no question fragments. Add explicit questions to sharpen AI recommendations and conclusions."
                    : `You have ${fragmentCounts.QUESTION} question fragment(s). Keep pairing questions with observations and constraints for better clarity.`}
                </p>
                <p className="rounded-lg border border-(--brand-green)/15 bg-brand-green-100/30 p-3">
                  {averageClarity < 40
                    ? "Average clarity is still early-stage. Focus on one high-priority space and push it past 60% this week."
                    : "Average clarity is healthy. Continue refining your top spaces with concrete evidence and decision fragments."}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </section>

      {lastUpdatedSpace ? (
        <Card className="border-dashed border-(--brand-green)/25 bg-white/90">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Most Recent Update
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
                Continue Working
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
};

export default DashboardPage;
