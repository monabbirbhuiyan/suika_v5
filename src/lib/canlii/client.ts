import prisma from "@/lib/prisma";
import { SyncStatus, Prisma } from "@/generated/prisma";

const CANLII_API_BASE = "https://api.canlii.org/v1";
const CANLII_API_KEY = process.env.CANLII_API_KEY;

// ─── Raw API response types ───────────────────────────────────────────────────

export interface CaseDatabase {
  databaseId: string;
  jurisdiction: string;
  name: string;
}

export interface LegislationDatabase {
  databaseId: string;
  type: string;
  jurisdiction: string;
  name: string;
}

export interface CaseMeta {
  databaseId: string;
  caseId: string;
  url: string;
  title: string;
  citation: string;
  language: string;
  docketNumber?: string;
  decisionDate: string;
  keywords?: string;
  concatenatedId?: string;
}

export interface CaseListEntry {
  databaseId: string;
  caseId: Record<string, string>;
  title: string;
  citation: string;
}

export interface LegislationMeta {
  legislationId: string;
  url: string;
  title: string;
  citation: string;
  type: string;
  language: string;
  dateScheme?: string;
  startDate?: string;
  endDate?: string;
  repealed?: string;
  content?: { partId: string; partName: string }[];
}

export interface LegislationListEntry {
  databaseId: string;
  legislationId: string;
  title: string;
  citation: string;
  type: string;
}

export interface CitatorCase {
  databaseId: string;
  caseId: Record<string, string>;
  title: string;
  citation: string;
}

export interface CitatorLegislation {
  databaseId: string;
  legislationId: string;
  title: string;
  citation: string;
}

// ─── Internal API fetch helper ────────────────────────────────────────────────

function requireApiKey(): string {
  if (!CANLII_API_KEY) {
    throw new Error("CANLII_API_KEY environment variable is not set");
  }
  return CANLII_API_KEY;
}

const REQUEST_DELAY_MS = 350;
let lastRequestTime = 0;

async function throttle(): Promise<void> {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < REQUEST_DELAY_MS) {
    await new Promise((r) => setTimeout(r, REQUEST_DELAY_MS - elapsed));
  }
  lastRequestTime = Date.now();
}

async function apiFetch<T>(path: string, retries = 2): Promise<T> {
  const key = requireApiKey();
  const separator = path.includes("?") ? "&" : "?";
  const url = `${CANLII_API_BASE}${path}${separator}api_key=${key}`;

  for (let attempt = 0; attempt <= retries; attempt++) {
    await throttle();

    try {
      const response = await fetch(url, {
        headers: { Accept: "application/json" },
      });

      if (response.status === 429) {
        const wait = (attempt + 1) * 2000;
        await new Promise((r) => setTimeout(r, wait));
        continue;
      }

      if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new Error(`CanLII API ${response.status}: ${text}`);
      }

      return (await response.json()) as T;
    } catch (err) {
      if (attempt === retries) throw err;
      await new Promise((r) => setTimeout(r, (attempt + 1) * 1000));
    }
  }

  throw new Error("Unreachable");
}

// ─── Case Law endpoints ───────────────────────────────────────────────────────

export async function listCaseDatabases(): Promise<CaseDatabase[]> {
  const data = await apiFetch<{ caseDatabases: CaseDatabase[] }>(
    "/caseBrowse/en/",
  );
  return data.caseDatabases;
}

export async function listCases(
  databaseId: string,
  options: {
    offset?: number;
    resultCount?: number;
    publishedBefore?: string;
    publishedAfter?: string;
    modifiedBefore?: string;
    modifiedAfter?: string;
    decisionDateBefore?: string;
    decisionDateAfter?: string;
  } = {},
): Promise<CaseListEntry[]> {
  const params = new URLSearchParams();
  params.set("offset", (options.offset ?? 0).toString());
  params.set("resultCount", (options.resultCount ?? 1000).toString());
  if (options.publishedBefore) params.set("publishedBefore", options.publishedBefore);
  if (options.publishedAfter) params.set("publishedAfter", options.publishedAfter);
  if (options.modifiedBefore) params.set("modifiedBefore", options.modifiedBefore);
  if (options.modifiedAfter) params.set("modifiedAfter", options.modifiedAfter);
  if (options.decisionDateBefore) params.set("decisionDateBefore", options.decisionDateBefore);
  if (options.decisionDateAfter) params.set("decisionDateAfter", options.decisionDateAfter);

  const data = await apiFetch<{ cases: CaseListEntry[] }>(
    `/caseBrowse/en/${databaseId}/?${params.toString()}`,
  );
  return data.cases;
}

export async function getCaseMetadata(
  databaseId: string,
  caseId: string,
): Promise<CaseMeta> {
  return apiFetch<CaseMeta>(`/caseBrowse/en/${databaseId}/${caseId}/`);
}

export type CitatorMetadataType = "citedCases" | "citingCases" | "citedLegislations";

export async function getCitatorData(
  databaseId: string,
  caseId: string,
  metadataType: CitatorMetadataType,
): Promise<{ citedCases?: CitatorCase[]; citingCases?: CitatorCase[]; citedLegislations?: CitatorLegislation[] }> {
  return apiFetch(`/caseCitator/en/${databaseId}/${caseId}/${metadataType}`);
}

// ─── Legislation endpoints ────────────────────────────────────────────────────

export async function listLegislationDatabases(): Promise<LegislationDatabase[]> {
  const data = await apiFetch<{ legislationDatabases: LegislationDatabase[] }>(
    "/legislationBrowse/en/",
  );
  return data.legislationDatabases;
}

export async function listLegislation(
  databaseId: string,
): Promise<LegislationListEntry[]> {
  const data = await apiFetch<{ legislations: LegislationListEntry[] }>(
    `/legislationBrowse/en/${databaseId}/`,
  );
  return data.legislations;
}

export async function getLegislationMetadata(
  databaseId: string,
  legislationId: string,
): Promise<LegislationMeta> {
  return apiFetch<LegislationMeta>(
    `/legislationBrowse/en/${databaseId}/${legislationId}/`,
  );
}

// ─── Normalized document type for DB storage ──────────────────────────────────

export type NormalizedDocType =
  | "CASE_LAW"
  | "LEGISLATION"
  | "REGULATION"
  | "TRIBUNAL_DECISION"
  | "SECONDARY_SOURCE";

export interface NormalizedDocument {
  canliiId: string;
  title: string;
  citation: string;
  court: string | null;
  jurisdiction: string | null;
  documentType: NormalizedDocType;
  decisionDate: string | null;
  url: string | null;
  content: string | null;
  metadata: Record<string, unknown>;
}

function mapCaseToNormalized(
  meta: CaseMeta,
  jurisdiction: string,
): NormalizedDocument {
  return {
    canliiId: `${meta.databaseId}/${meta.caseId}`,
    title: meta.title,
    citation: meta.citation,
    court: meta.databaseId,
    jurisdiction,
    documentType: "CASE_LAW",
    decisionDate: meta.decisionDate || null,
    url: meta.url || buildCaseUrl(jurisdiction, meta.databaseId, meta.caseId),
    content: null,
    metadata: {
      docketNumber: meta.docketNumber,
      keywords: meta.keywords,
      concatenatedId: meta.concatenatedId,
      language: meta.language,
    },
  };
}

function mapLegislationToNormalized(
  meta: LegislationMeta,
  jurisdiction: string,
  dbType: string,
): NormalizedDocument {
  const isRegulation =
    dbType === "REGULATION" ||
    meta.type === "REGULATION";

  return {
    canliiId: meta.legislationId,
    title: meta.title,
    citation: meta.citation,
    court: null,
    jurisdiction,
    documentType: isRegulation ? "REGULATION" : "LEGISLATION",
    decisionDate: meta.startDate || null,
    url: meta.url || buildLegislationUrl(jurisdiction, meta.type, meta.legislationId),
    content: null,
    metadata: {
      legislationType: meta.type,
      dateScheme: meta.dateScheme,
      endDate: meta.endDate,
      repealed: meta.repealed,
      language: meta.language,
      contentParts: meta.content,
    },
  };
}

// ─── Bulk sync helpers ────────────────────────────────────────────────────────

export interface SyncProgress {
  databasesScanned: number;
  totalCases: number;
  totalLegislation: number;
  saved: number;
  failed: number;
  errors: string[];
}

export type SyncOptions = {
  jurisdictions?: string[];
  databaseIds?: string[];
  maxCasesPerDb?: number;
  maxLegislationPerDb?: number;
  dateFrom?: string;
  dateTo?: string;
  onProgress?: (progress: SyncProgress) => void;
};

const JURISDICTION_MAP: Record<string, string> = {
  ca: "Canada",
  ab: "Alberta",
  bc: "British Columbia",
  mb: "Manitoba",
  nb: "New Brunswick",
  nl: "Newfoundland and Labrador",
  ns: "Nova Scotia",
  nt: "Northwest Territories",
  nu: "Nunavut",
  on: "Ontario",
  pe: "Prince Edward Island",
  qc: "Quebec",
  sk: "Saskatchewan",
  yt: "Yukon",
};

export function getJurisdictionName(code: string): string {
  return JURISDICTION_MAP[code.toLowerCase()] || code.toUpperCase();
}

function buildCaseUrl(jurisdiction: string, databaseId: string, caseId: string): string {
  const courtCode = databaseId.includes("-") ? databaseId.split("-")[1] : databaseId;
  const year = caseId.substring(0, 4);
  return `https://www.canlii.org/en/${jurisdiction}/${courtCode}/doc/${year}/${caseId}/${caseId}.html`;
}

function legislationTypeToPath(type: string): string {
  switch (type) {
    case "REGULATION": return "reg";
    case "ANNUAL_STATUTE": return "act";
    case "STATUTE":
    default: return "stat";
  }
}

function buildLegislationUrl(jurisdiction: string, legislationType: string, legislationId: string): string {
  const typePath = legislationTypeToPath(legislationType);
  return `https://www.canlii.org/en/${jurisdiction}/laws/${typePath}/${legislationId}/latest/${legislationId}.html`;
}

export async function syncAll(options: SyncOptions = {}): Promise<SyncProgress> {
  const progress: SyncProgress = {
    databasesScanned: 0,
    totalCases: 0,
    totalLegislation: 0,
    saved: 0,
    failed: 0,
    errors: [],
  };

  const maxCases = options.maxCasesPerDb ?? 500;
  const maxLegislation = options.maxLegislationPerDb ?? 500;

  // Sync case law databases
  try {
    const caseDatabases = await listCaseDatabases();
    const filteredCaseDbs = filterDatabases(caseDatabases, options.jurisdictions, options.databaseIds);

    for (const db of filteredCaseDbs) {
      progress.databasesScanned++;
      try {
        const cases = await listCases(db.databaseId, {
          offset: 0,
          resultCount: maxCases,
          ...(options.dateFrom && { decisionDateAfter: options.dateFrom }),
          ...(options.dateTo && { decisionDateBefore: options.dateTo }),
        });

        const docs: NormalizedDocument[] = [];
        for (const c of cases) {
          const caseId = c.caseId?.en || c.caseId?.fr || Object.values(c.caseId)[0];
          if (!caseId) {
            progress.failed++;
            continue;
          }
          docs.push({
            canliiId: `${db.databaseId}/${caseId}`,
            title: c.title,
            citation: c.citation,
            court: db.databaseId,
            jurisdiction: db.jurisdiction,
            documentType: "CASE_LAW",
            decisionDate: null,
            url: buildCaseUrl(db.jurisdiction, db.databaseId, caseId),
            content: null,
            metadata: {},
          });
        }

        await saveDocuments(docs);
        progress.totalCases += docs.length;
        progress.saved += docs.length;
      } catch (err) {
        progress.errors.push(
          `Case DB ${db.databaseId}: ${err instanceof Error ? err.message : "unknown"}`,
        );
      }

      options.onProgress?.({ ...progress });
    }
  } catch (err) {
    progress.errors.push(
      `Case databases: ${err instanceof Error ? err.message : "unknown"}`,
    );
  }

  // Sync legislation databases
  try {
    const legDatabases = await listLegislationDatabases();
    const filteredLegDbs = filterLegislationDatabases(
      legDatabases,
      options.jurisdictions,
      options.databaseIds,
    );

    for (const db of filteredLegDbs) {
      progress.databasesScanned++;
      try {
        const legislation = await listLegislation(db.databaseId);
        const sliced = legislation.slice(0, maxLegislation);

        const docs: NormalizedDocument[] = [];
        for (const leg of sliced) {
          const isRegulation = db.type === "REGULATION";
          docs.push({
            canliiId: leg.legislationId,
            title: leg.title,
            citation: leg.citation,
            court: null,
            jurisdiction: db.jurisdiction,
            documentType: isRegulation ? "REGULATION" : "LEGISLATION",
            decisionDate: null,
            url: buildLegislationUrl(db.jurisdiction, leg.type, leg.legislationId),
            content: null,
            metadata: { legislationType: leg.type, databaseType: db.type },
          });
        }

        await saveDocuments(docs);
        progress.totalLegislation += docs.length;
        progress.saved += docs.length;
      } catch (err) {
        progress.errors.push(
          `Legislation DB ${db.databaseId}: ${err instanceof Error ? err.message : "unknown"}`,
        );
      }

      options.onProgress?.({ ...progress });
    }
  } catch (err) {
    progress.errors.push(
      `Legislation databases: ${err instanceof Error ? err.message : "unknown"}`,
    );
  }

  return progress;
}

function matchesJurisdiction(
  jurisdiction: string,
  databaseId: string,
  allowedJurisdictions: Set<string>,
): boolean {
  if (allowedJurisdictions.has(jurisdiction.toLowerCase())) return true;

  const idLower = databaseId.toLowerCase();
  for (const j of allowedJurisdictions) {
    if (idLower.startsWith(j)) return true;
  }

  return false;
}

function filterDatabases(
  dbs: CaseDatabase[],
  jurisdictions?: string[],
  databaseIds?: string[],
): CaseDatabase[] {
  let result = dbs;
  if (jurisdictions?.length) {
    const set = new Set(jurisdictions.map((j) => j.toLowerCase()));
    result = result.filter((db) =>
      matchesJurisdiction(db.jurisdiction, db.databaseId, set),
    );
  }
  if (databaseIds?.length) {
    const set = new Set(databaseIds);
    result = result.filter((db) => set.has(db.databaseId));
  }
  return result;
}

function filterLegislationDatabases(
  dbs: LegislationDatabase[],
  jurisdictions?: string[],
  databaseIds?: string[],
): LegislationDatabase[] {
  let result = dbs;
  if (jurisdictions?.length) {
    const set = new Set(jurisdictions.map((j) => j.toLowerCase()));
    result = result.filter((db) =>
      matchesJurisdiction(db.jurisdiction, db.databaseId, set),
    );
  }
  if (databaseIds?.length) {
    const set = new Set(databaseIds);
    result = result.filter((db) => set.has(db.databaseId));
  }
  return result;
}

// ─── Save documents to local DB (batch upsert) ──────────────────────────────

async function saveDocuments(docs: NormalizedDocument[]): Promise<void> {
  if (docs.length === 0) return;

  const BATCH_SIZE = 50;
  for (let i = 0; i < docs.length; i += BATCH_SIZE) {
    const batch = docs.slice(i, i + BATCH_SIZE);

    await prisma.$transaction(
      batch.map((doc) =>
        prisma.canLIIDataset.upsert({
          where: { canliiId: doc.canliiId },
          create: {
            canliiId: doc.canliiId,
            title: doc.title,
            citation: doc.citation,
            court: doc.court,
            jurisdiction: doc.jurisdiction,
            documentType: doc.documentType,
            decisionDate: doc.decisionDate ? new Date(doc.decisionDate) : null,
            url: doc.url,
            content: doc.content,
            metadata: (doc.metadata as Prisma.InputJsonValue) ?? Prisma.JsonNull,
            lastSyncedAt: new Date(),
            syncStatus: SyncStatus.COMPLETED,
          },
          update: {
            title: doc.title,
            citation: doc.citation,
            court: doc.court,
            jurisdiction: doc.jurisdiction,
            documentType: doc.documentType,
            decisionDate: doc.decisionDate ? new Date(doc.decisionDate) : null,
            url: doc.url,
            content: doc.content,
            metadata: (doc.metadata as Prisma.InputJsonValue) ?? Prisma.JsonNull,
            lastSyncedAt: new Date(),
            syncStatus: SyncStatus.COMPLETED,
          },
        }),
      ),
    );
  }
}
