import { getServerSession } from "@/action/get-session";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { SyncStatus } from "@/generated/prisma";
import { syncAll, type SyncOptions } from "@/lib/canlii/client";

export const POST = async (request: Request) => {
  const session = await getServerSession();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let syncLogId: string | null = null;

  try {
    const body = (await request.json().catch(() => ({}))) as {
      jurisdictions?: string[];
      databaseIds?: string[];
      maxCasesPerDb?: number;
      maxLegislationPerDb?: number;
      dateFrom?: string;
      dateTo?: string;
    };

    const syncLog = await prisma.canLIISyncLog.create({
      data: {
        status: SyncStatus.IN_PROGRESS,
        triggeredBy: userId,
        totalFetched: 0,
        totalSaved: 0,
        totalFailed: 0,
      },
    });
    syncLogId = syncLog.id;

    const syncOptions: SyncOptions = {
      jurisdictions: body.jurisdictions?.length ? body.jurisdictions : ["on", "ca"],
      databaseIds: body.databaseIds,
      maxCasesPerDb: body.maxCasesPerDb ?? 500,
      maxLegislationPerDb: body.maxLegislationPerDb ?? 500,
      dateFrom: body.dateFrom,
      dateTo: body.dateTo,
    };

    const result = await syncAll(syncOptions);

    const totalFetched = result.totalCases + result.totalLegislation;

    await prisma.canLIISyncLog.update({
      where: { id: syncLog.id },
      data: {
        status: result.errors.length > 0 && result.saved === 0
          ? SyncStatus.FAILED
          : SyncStatus.COMPLETED,
        completedAt: new Date(),
        totalFetched,
        totalSaved: result.saved,
        totalFailed: result.failed,
        errorMessage: result.errors.length > 0
          ? result.errors.slice(0, 10).join("; ")
          : null,
      },
    });

    return NextResponse.json({
      syncLog: {
        id: syncLog.id,
        status: result.errors.length > 0 && result.saved === 0
          ? "FAILED"
          : "COMPLETED",
        totalFetched,
        totalSaved: result.saved,
        totalFailed: result.failed,
        databasesScanned: result.databasesScanned,
        errors: result.errors.slice(0, 20),
      },
    });
  } catch (error) {
    if (syncLogId) {
      await prisma.canLIISyncLog.update({
        where: { id: syncLogId },
        data: {
          status: SyncStatus.FAILED,
          completedAt: new Date(),
          errorMessage: error instanceof Error ? error.message : "Unknown error",
        },
      });
    }

    console.error("CanLII sync failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Sync failed" },
      { status: 500 },
    );
  }
};

export const GET = async () => {
  const session = await getServerSession();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const logs = await prisma.canLIISyncLog.findMany({
    where: { triggeredBy: userId },
    orderBy: { startedAt: "desc" },
    take: 20,
  });

  return NextResponse.json({ logs });
};
