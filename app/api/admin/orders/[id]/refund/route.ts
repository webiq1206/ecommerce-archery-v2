import { NextRequest, NextResponse } from "next/server";
import { db, ordersTable, refundsTable } from "@/lib/db";
import { eq, sql } from "drizzle-orm";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: orderId } = await params;

  try {
    const { amount, reason } = (await req.json()) as { amount: number; reason?: string };

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "A positive refund amount is required" }, { status: 400 });
    }

    const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, orderId)).limit(1);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const orderTotal = Number(order.total);
    if (amount > orderTotal) {
      return NextResponse.json({ error: "Refund amount exceeds order total" }, { status: 400 });
    }

    let stripeRefundId: string | null = null;

    if (order.stripePaymentIntentId && process.env.STRIPE_SECRET_KEY) {
      const stripe = await import("stripe");
      const client = new stripe.default(process.env.STRIPE_SECRET_KEY);

      const refund = await client.refunds.create({
        payment_intent: order.stripePaymentIntentId,
        amount: Math.round(amount * 100),
        reason: reason === "duplicate" || reason === "fraudulent" || reason === "requested_by_customer"
          ? reason
          : "requested_by_customer",
      });

      stripeRefundId = refund.id;
    }

    await db.insert(refundsTable).values({
      orderId,
      amount: amount.toFixed(2),
      reason: reason || null,
      stripeRefundId,
    });

    const [{ totalRefunded }] = await db
      .select({ totalRefunded: sql<string>`COALESCE(SUM(${refundsTable.amount}::numeric), 0)::text` })
      .from(refundsTable)
      .where(eq(refundsTable.orderId, orderId));

    const refundedSoFar = Number(totalRefunded);
    const newPaymentStatus = refundedSoFar >= orderTotal ? "REFUNDED" : "PARTIALLY_REFUNDED";
    const newStatus = refundedSoFar >= orderTotal ? "REFUNDED" : "PARTIALLY_REFUNDED";

    await db
      .update(ordersTable)
      .set({ paymentStatus: newPaymentStatus, status: newStatus })
      .where(eq(ordersTable.id, orderId));

    return NextResponse.json({
      success: true,
      stripeRefundId,
      paymentStatus: newPaymentStatus,
      totalRefunded: refundedSoFar,
    });
  } catch (err) {
    console.error("[Refund Error]", err);
    const message = err instanceof Error ? err.message : "Refund failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
