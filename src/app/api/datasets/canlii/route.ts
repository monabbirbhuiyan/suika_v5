import { getServerSession } from "@/action/get-session";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { CanLIIDocumentType, SyncStatus } from "@/generated/prisma";
import { Prisma } from "@/generated/prisma";

interface CanLIIDocumentInput {
  canliiId: string;
  title: string;
  citation?: string;
  court?: string;
  jurisdiction?: string;
  documentType: CanLIIDocumentType;
  decisionDate?: string;
  url?: string;
  content?: string;
  metadata?: Record<string, unknown>;
}

function generateContentHash(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(16);
}

export const POST = async (request: Request) => {
  const session = await getServerSession();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json() as CanLIIDocumentInput;

    if (!body.canliiId || !body.title || !body.documentType) {
      return NextResponse.json(
        { error: "Missing required fields: canliiId, title, documentType" },
        { status: 400 },
      );
    }

    const contentHash = body.content ? generateContentHash(body.content) : undefined;

    const existing = await prisma.canLIIDataset.findUnique({
      where: { canliiId: body.canliiId },
      select: { id: true, contentHash: true },
    });

    if (existing && existing.contentHash === contentHash) {
      return NextResponse.json({ dataset: existing, unchanged: true });
    }

    const dataset = await prisma.canLIIDataset.upsert({
      where: { canliiId: body.canliiId },
      create: {
        canliiId: body.canliiId,
        title: body.title,
        citation: body.citation,
        court: body.court,
        jurisdiction: body.jurisdiction,
        documentType: body.documentType,
        decisionDate: body.decisionDate ? new Date(body.decisionDate) : null,
        url: body.url,
        content: body.content,
        metadata: body.metadata as Prisma.InputJsonValue,
        contentHash,
        lastSyncedAt: new Date(),
        syncStatus: SyncStatus.COMPLETED,
      },
      update: {
        title: body.title,
        citation: body.citation,
        court: body.court,
        jurisdiction: body.jurisdiction,
        documentType: body.documentType,
        decisionDate: body.decisionDate ? new Date(body.decisionDate) : null,
        url: body.url,
        content: body.content,
        metadata: body.metadata as Prisma.InputJsonValue,
        contentHash,
        lastSyncedAt: new Date(),
        syncStatus: SyncStatus.COMPLETED,
      },
    });

    return NextResponse.json({ dataset });
  } catch (error) {
    console.error("Failed to save CanLII dataset:", error);
    return NextResponse.json(
      { error: "Failed to save dataset" },
      { status: 500 },
    );
  }
};

export const GET = async (request: Request) => {
  const session = await getServerSession();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = Math.min(parseInt(searchParams.get("pageSize") || "20"), 100);
  const jurisdiction = searchParams.get("jurisdiction") || undefined;
  const court = searchParams.get("court") || undefined;
  const documentType = searchParams.get("documentType") || undefined;
  const search = searchParams.get("search") || undefined;
  const syncStatus = searchParams.get("syncStatus") || undefined;

  const where: Record<string, unknown> = {};

  if (jurisdiction) where.jurisdiction = jurisdiction;
  if (court) where.court = court;
  if (documentType) where.documentType = documentType;
  if (syncStatus) where.syncStatus = syncStatus;
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { citation: { contains: search, mode: "insensitive" } },
      { court: { contains: search, mode: "insensitive" } },
    ];
  }

  const [datasets, total, aggregates] = await Promise.all([
    prisma.canLIIDataset.findMany({
      where,
      orderBy: { indexedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.canLIIDataset.count({ where }),
    prisma.canLIIDataset.groupBy({
      by: ["documentType"],
      _count: { id: true },
    }),
  ]);

  const byType: Record<string, number> = {};
  for (const agg of aggregates) {
    byType[agg.documentType] = agg._count.id;
  }

  return NextResponse.json({
    datasets,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
    stats: {
      total,
      byType,
      synced: await prisma.canLIIDataset.count({
        where: { syncStatus: SyncStatus.COMPLETED },
      }),
      failed: await prisma.canLIIDataset.count({
        where: { syncStatus: SyncStatus.FAILED },
      }),
    },
  });
};