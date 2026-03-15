import { NextRequest, NextResponse } from "next/server";
import { db, fulfillmentLogsTable } from "@workspace/db";

export async function POST(request: NextRequest) {
  const { orderIds, distributorId } = await request.json();
  if (!Array.isArray(orderIds) || !distributorId) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const values = orderIds.map((orderId: string) => ({
    orderId,
    distributorId,
    status: "PENDING" as const,
  }));

  await db.insert(fulfillmentLogsTable).values(values);
  return NextResponse.json({ assigned: orderIds.length });
}
