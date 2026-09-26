"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Database,
  ExternalLink,
  Filter,
  RefreshCw,
  Search,
  Server,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  XCircle,
  Scale,
  BookOpen,
  FileText,
  Landmark,
} from "lucide-react";
import { motion } from "framer-motion";

import { toast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

type Props = {
  userId: string;
};

type CanLIIDataset = {
  id: string;
  canliiId: string;
  title: string;
  citation: string | null;
  court: string | null;
  jurisdiction: string | null;
  documentType: string;
  decisionDate: string | null;
  url: string | null;
  content: string | null;
  indexedAt: string;
  lastSyncedAt: string | null;
  syncStatus: string;
  syncError: string | null;
};

type SyncLog = {
  id: string;
  status: string;
  startedAt: string;
  completedAt: string | null;
  totalFetched: number;
  totalSaved: number;
  totalFailed: number;
  errorMessage: string | null;
  triggeredBy: string | null;
};

type Pagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

const documentTypeLabels: Record<string, string> = {
  CASE_LAW: "Case Law",
  LEGISLATION: "Legislation",
  REGULATION: "Regulation",
  TRIBUNAL_DECISION: "Tribunal Decision",
  SECONDARY_SOURCE: "Secondary Source",
};

const documentTypeIcons: Record<string, React.ElementType> = {
  CASE_LAW: Scale,
  LEGISLATION: BookOpen,
  REGULATION: FileText,
  TRIBUNAL_DECISION: Landmark,
  SECONDARY_SOURCE: FileText,
};

const documentTypeColors: Record<string, string> = {
  CASE_LAW: "border-[#005b96] bg-[#005b96]/10 text-[#005b96]",
  LEGISLATION: "border-[#6d28d9] bg-[#6d28d9]/10 text-[#6d28d9]",
  REGULATION: "border-[#7c3aed] bg-[#7c3aed]/10 text-[#7c3aed]",
  TRIBUNAL_DECISION: "border-[#dc8b30] bg-[#dc8b30]/10 text-[#dc8b30]",
  SECONDARY_SOURCE: "border-[#52bf90] bg-[#52bf90]/10 text-[#52bf90]",
};

const syncStatusConfig: Record<
  string,
  { label: string; icon: React.ElementType; className: string }
> = {
  COMPLETED: {
    label: "Synced",
    icon: CheckCircle2,
    className: "border-emerald-300 bg-emerald-50 text-emerald-700",
  },
  IN_PROGRESS: {
    label: "Syncing",
    icon: RefreshCw,
    className: "border-amber-300 bg-amber-50 text-amber-700",
  },
  PENDING: {
    label: "Pending",
    icon: Clock,
    className: "border-slate-300 bg-slate-50 text-slate-600",
  },
  FAILED: {
    label: "Failed",
    icon: XCircle,
    className: "border-rose-300 bg-rose-50 text-rose-700",
  },
};

const jurisdictionLabels: Record<string, string> = {
  on: "Ontario",
  ca: "Canada (Federal)",
};

function DatasetRowSkeleton() {
  return (
    <tr>
      <td className="px-4 py-3">
        <Skeleton className="h-4 w-4 rounded" />
      </td>
      <td className="px-4 py-3">
        <Skeleton className="h-4 w-48" />
      </td>
      <td className="px-4 py-3">
        <Skeleton className="h-4 w-32" />
      </td>
      <td className="px-4 py-3">
        <Skeleton className="h-5 w-16 rounded-full" />
      </td>
      <td className="px-4 py-3">
        <Skeleton className="h-5 w-16 rounded-full" />
      </td>
      <td className="px-4 py-3">
        <Skeleton className="h-4 w-20" />
      </td>
    </tr>
  );
}

function SyncLogRow({ log }: { log: SyncLog }) {
  const config = syncStatusConfig[log.status] || syncStatusConfig.PENDING;
  const StatusIcon = config.icon;

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-brand-green/10 bg-white px-3 py-2">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <StatusIcon className="h-3.5 w-3.5 shrink-0" />
          <span className="text-xs font-medium text-foreground">
            {config.label}
          </span>
          <span className="text-[10px] text-muted-foreground">
            {new Date(log.startedAt).toLocaleString()}
          </span>
        </div>
        {log.errorMessage && (
          <p className="mt-1 text-[10px] text-rose-600 truncate">
            {log.errorMessage}
          </p>
        )}
      </div>
      <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
        <span>{log.totalFetched} fetched</span>
        <span>{log.totalSaved} saved</span>
        <span>{log.totalFailed} failed</span>
      </div>
    </div>
  );
}

const DatasetsClient = ({ userId }: Props) => {
  const [datasets, setDatasets] = useState<CanLIIDataset[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
  });
  const [dbStats, setDbStats] = useState<{
    total: number;
    byType: Record<string, number>;
    synced: number;
    failed: number;
  }>({ total: 0, byType: {}, synced: 0, failed: 0 });
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [jurisdictionFilter, setJurisdictionFilter] = useState("all");
  const [documentTypeFilter, setDocumentTypeFilter] = useState("all");
  const [syncStatusFilter, setSyncStatusFilter] = useState("all");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPagination((prev) => ({ ...prev, page: 1 }));
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchDatasets = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", pagination.page.toString());
      params.set("pageSize", pagination.pageSize.toString());
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (jurisdictionFilter && jurisdictionFilter !== "all")
        params.set("jurisdiction", jurisdictionFilter);
      if (documentTypeFilter && documentTypeFilter !== "all")
        params.set("documentType", documentTypeFilter);
      if (syncStatusFilter && syncStatusFilter !== "all")
        params.set("syncStatus", syncStatusFilter);

      const response = await fetch(
        `http://127.0.0.1:8000/api/datasets/canlii?${params.toString()}`,
      );
      if (!response.ok) throw new Error("Failed to fetch datasets");

      const data = await response.json();
      setDatasets(data.datasets || []);
      setPagination(
        data.pagination || { page: 1, pageSize: 20, total: 0, totalPages: 0 },
      );
      if (data.stats) setDbStats(data.stats);
    } catch (err) {
      console.error("FastAPI Datasets error:", err);
      toast.add({
        type: "error",
        description: "Failed to load datasets via Python backend.",
        priority: "high",
      });
    } finally {
      setLoading(false);
    }
  }, [
    pagination.page,
    pagination.pageSize,
    debouncedSearch,
    jurisdictionFilter,
    documentTypeFilter,
    syncStatusFilter,
  ]);

  useEffect(() => {
    void fetchDatasets();
  }, [fetchDatasets]);

  const fetchSyncLogs = useCallback(async () => {
    setLogsLoading(true);
    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/datasets/canlii/sync",
      );
      if (!response.ok) throw new Error("Failed to fetch sync logs");
      const data = await response.json();
      setSyncLogs(data.logs || []);
    } catch {
      toast.add({
        type: "error",
        description: "Failed to load sync history.",
      });
    } finally {
      setLogsLoading(false);
    }
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/datasets/canlii/sync",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: userId }),
        },
      );

      if (!response.ok) {
        const errPayload = await response.json().catch(() => ({}));
        throw new Error(errPayload.detail || "Failed to start sync");
      }

      toast.add({
        type: "success",
        description: "CanLII sync initiated on backend.",
      });

      void fetchSyncLogs();
      void fetchDatasets();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Sync failed";
      toast.add({
        type: "error",
        description: msg,
        priority: "high",
      });
    } finally {
      setSyncing(false);
    }
  };

  const hasActiveFilters =
    jurisdictionFilter !== "all" ||
    documentTypeFilter !== "all" ||
    syncStatusFilter !== "all" ||
    debouncedSearch.length > 0;

  return (
    <div className="space-y-4">
      {/* Hero Banner */}
      <Card className="overflow-hidden border-brand-green/20 bg-linear-to-r from-white via-brand-surface to-brand-green/10">
        <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5 md:p-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-brand-green" />
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-green">
                Legal Database
              </p>
            </div>
            <h1 className="font-serif text-2xl text-brand-ink md:text-3xl">
              Datasets
            </h1>
            <p className="max-w-2xl text-sm text-[#56746a]">
              Browse and manage your CanLII legal datasets from Ontario and
              Canada (Federal). Search, filter, and sync documents directly into
              Postgres.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Sheet>
              <SheetTrigger
                className="inline-flex items-center justify-center rounded-full border border-brand-green/25 px-3 py-1.5 text-sm text-brand-green hover:bg-brand-green/10 transition-colors"
                onClick={() => void fetchSyncLogs()}
              >
                <Server className="h-3.5 w-3.5 mr-1.5" />
                Sync History
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-md">
                <SheetHeader>
                  <SheetTitle>Sync History</SheetTitle>
                  <SheetDescription>
                    Recent CanLII sync operations for your account.
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-4 space-y-2 px-4">
                  {logsLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))
                  ) : syncLogs.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                      No sync history yet.
                    </p>
                  ) : (
                    syncLogs.map((log) => <SyncLogRow key={log.id} log={log} />)
                  )}
                </div>
              </SheetContent>
            </Sheet>

            <Button
              size="sm"
              className="rounded-full bg-brand-green hover:bg-brand-green/90 text-white"
              onClick={handleSync}
              disabled={syncing}
            >
              <RefreshCw
                className={`h-3.5 w-3.5 mr-1.5 ${syncing ? "animate-spin" : ""}`}
              />
              {syncing ? "Syncing..." : "Sync Now"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Card className="border-brand-green/15 bg-white/95">
          <CardContent className="p-4">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
              Total Documents
            </p>
            <p className="mt-2 text-3xl font-semibold text-brand-ink">
              {dbStats.total}
            </p>
            <p className="text-xs text-muted-foreground">In database</p>
          </CardContent>
        </Card>

        <Card className="border-brand-green/15 bg-white/95">
          <CardContent className="p-4">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
              Case Law
            </p>
            <p className="mt-2 text-3xl font-semibold text-[#005b96]">
              {dbStats.byType["CASE_LAW"] || 0}
            </p>
            <p className="text-xs text-muted-foreground">Court decisions</p>
          </CardContent>
        </Card>

        <Card className="border-brand-green/15 bg-white/95">
          <CardContent className="p-4">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
              Legislation
            </p>
            <p className="mt-2 text-3xl font-semibold text-[#6d28d9]">
              {dbStats.byType["LEGISLATION"] || 0}
            </p>
            <p className="text-xs text-muted-foreground">Statutes</p>
          </CardContent>
        </Card>

        <Card className="border-brand-green/15 bg-white/95">
          <CardContent className="p-4">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
              Regulations
            </p>
            <p className="mt-2 text-3xl font-semibold text-[#7c3aed]">
              {dbStats.byType["REGULATION"] || 0}
            </p>
            <p className="text-xs text-muted-foreground">Rules &amp; regs</p>
          </CardContent>
        </Card>

        <Card className="border-brand-green/15 bg-white/95">
          <CardContent className="p-4">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
              Synced / Failed
            </p>
            <div className="mt-2 flex items-baseline gap-2">
              <p className="text-3xl font-semibold text-emerald-600">
                {dbStats.synced}
              </p>
              {dbStats.failed > 0 && (
                <p className="text-lg font-medium text-rose-500">
                  / {dbStats.failed}
                </p>
              )}
            </div>
            <p className="text-xs text-muted-foreground">Sync status</p>
          </CardContent>
        </Card>
      </section>

      {/* Filters */}
      <Card className="border-brand-green/15 bg-white/95">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-50">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by title, citation, or court..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select
              value={jurisdictionFilter}
              onValueChange={(val) => setJurisdictionFilter(val ?? "all")}
            >
              <SelectTrigger className="w-40">
                <Filter className="h-3.5 w-3.5 mr-1.5" />
                <SelectValue placeholder="Jurisdiction" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Jurisdictions</SelectItem>
                <SelectItem value="on">Ontario</SelectItem>
                <SelectItem value="ca">Canada (Federal)</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={jurisdictionFilter}
              onValueChange={(val) => setJurisdictionFilter(val ?? "all")}
            >
              <SelectTrigger className="w-42.5">
                <SelectValue placeholder="Document Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {Object.entries(documentTypeLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={jurisdictionFilter}
              onValueChange={(val) => setJurisdictionFilter(val ?? "all")}
            >
              <SelectTrigger className="w-37.5">
                <SelectValue placeholder="Sync Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {Object.entries(syncStatusConfig).map(([value, { label }]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setJurisdictionFilter("all");
                  setDocumentTypeFilter("all");
                  setSyncStatusFilter("all");
                }}
                className="text-xs text-muted-foreground"
              >
                Clear filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Datasets Table */}
      <Card className="border-brand-green/15 bg-white/95 overflow-hidden">
        {loading ? (
          <div className="p-4">
            <table className="w-full">
              <tbody>
                {Array.from({ length: 8 }).map((_, i) => (
                  <DatasetRowSkeleton key={i} />
                ))}
              </tbody>
            </table>
          </div>
        ) : datasets.length === 0 ? (
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Database className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-sm font-medium text-foreground">
              No datasets found
            </p>
            <p className="mt-1 text-xs text-muted-foreground max-w-sm">
              {hasActiveFilters
                ? "Try adjusting your filters or search query to find what you're looking for."
                : 'Click "Sync Now" to fetch Ontario and Federal documents from CanLII.'}
            </p>
          </CardContent>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-brand-green/10 bg-brand-surface/50">
                  <th className="px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    Type
                  </th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    Title
                  </th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    Citation
                  </th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    Status
                  </th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    Sync
                  </th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    Indexed
                  </th>
                  <th className="px-4 py-2.5 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {datasets.map((dataset, index) => {
                  const syncConfig =
                    syncStatusConfig[dataset.syncStatus] ||
                    syncStatusConfig.PENDING;
                  const SyncStatusIcon = syncConfig.icon;
                  const docTypeColor =
                    documentTypeColors[dataset.documentType] ||
                    "border-slate-300 bg-slate-50 text-slate-600";
                  const DocTypeIcon =
                    documentTypeIcons[dataset.documentType] || FileText;

                  return (
                    <motion.tr
                      key={dataset.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.15, delay: index * 0.02 }}
                      className="border-b border-brand-green/5 hover:bg-brand-surface/30 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-medium ${docTypeColor}`}
                        >
                          <DocTypeIcon className="h-2.5 w-2.5" />
                          {documentTypeLabels[dataset.documentType] ||
                            dataset.documentType}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="min-w-0 max-w-xs">
                          <p className="text-sm font-medium text-brand-ink truncate">
                            {dataset.title}
                          </p>
                          <div className="mt-0.5 flex items-center gap-2">
                            {dataset.jurisdiction && (
                              <span className="text-[10px] text-muted-foreground">
                                {jurisdictionLabels[dataset.jurisdiction] ||
                                  dataset.jurisdiction}
                              </span>
                            )}
                            {dataset.court && (
                              <>
                                <span className="text-[10px] text-muted-foreground/40">
                                  ·
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                  {dataset.court}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs text-muted-foreground truncate max-w-50">
                          {dataset.citation || "—"}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <div
                          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${syncConfig.className}`}
                        >
                          <SyncStatusIcon className="h-2.5 w-2.5" />
                          {syncConfig.label}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs text-muted-foreground">
                          {dataset.lastSyncedAt
                            ? new Date(
                                dataset.lastSyncedAt,
                              ).toLocaleDateString()
                            : "—"}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs text-muted-foreground">
                          {new Date(dataset.indexedAt).toLocaleDateString()}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        {dataset.url && (
                          <a
                            href={dataset.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-brand-green transition-colors"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between rounded-lg border border-brand-green/10 bg-white px-4 py-3">
          <p className="text-xs text-muted-foreground">
            Showing {(pagination.page - 1) * pagination.pageSize + 1}–
            {Math.min(pagination.page * pagination.pageSize, pagination.total)}{" "}
            of {pagination.total} documents
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              disabled={pagination.page <= 1}
              onClick={() =>
                setPagination((prev) => ({
                  ...prev,
                  page: prev.page - 1,
                }))
              }
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            {Array.from(
              { length: Math.min(5, pagination.totalPages) },
              (_, i) => {
                const start = Math.max(
                  1,
                  Math.min(pagination.page - 2, pagination.totalPages - 4),
                );
                const pageNum = start + i;
                if (pageNum > pagination.totalPages) return null;
                return (
                  <Button
                    key={pageNum}
                    variant={
                      pageNum === pagination.page ? "default" : "outline"
                    }
                    size="icon"
                    className="h-7 w-7 text-xs"
                    onClick={() =>
                      setPagination((prev) => ({
                        ...prev,
                        page: pageNum,
                      }))
                    }
                  >
                    {pageNum}
                  </Button>
                );
              },
            )}
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() =>
                setPagination((prev) => ({
                  ...prev,
                  page: prev.page + 1,
                }))
              }
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DatasetsClient;
