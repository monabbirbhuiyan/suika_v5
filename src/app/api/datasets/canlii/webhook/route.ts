import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { SyncStatus } from "@/generated/prisma";

export const POST = async (request: Request) => {
  try {
    const body = await request.json() as {
      sync_log_id: string;
      total_fetched: number;
      total_saved: number;
      total_failed: number;
      error?: string;
      status: "completed" | "failed";
    };

    const { sync_log_id, total_fetched, total_saved, total_failed, error, status } = body;

    if (!sync_log_id) {
      return NextResponse.json({ error: "Missing sync_log_id" }, { status: 400 });
    }

    const updateData: {
      totalFetched: number;
      totalSaved: number;
      totalFailed: number;
      status: SyncStatus;
      completedAt: Date;
      errorMessage?: string;
    } = {
      totalFetched: total_fetched,
      totalSaved: total_saved,
      totalFailed: total_failed,
      status: status === "completed" ? SyncStatus.COMPLETED : SyncStatus.FAILED,
      completedAt: new Date(),
    };

    if (error) {
      updateData.errorMessage = error;
    }

    await prisma.canLIISyncLog.update({
      where: { id: sync_log_id },
      data: updateData,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Failed to process webhook" },
      { status: 500 },
    );
  }
};