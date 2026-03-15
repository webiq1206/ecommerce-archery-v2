import { NextRequest, NextResponse } from "next/server";
import { db, fulfillmentLogsTable, ordersTable, orderItemsTable, distributorsTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { sendEmail } from "@/lib/email/send";
import { FulfillmentNoticeEmail } from "@/lib/email/templates/fulfillment-notice";

const CRON_SECRET = process.env.CRON_SECRET;
const STORE_EMAIL = process.env.FROM_EMAIL ?? "orders@apexarchery.com";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const staleEntries = await db
      .select({
        id: fulfillmentLogsTable.id,
        orderId: fulfillmentLogsTable.orderId,
        distributorId: fulfillmentLogsTable.distributorId,
        createdAt: fulfillmentLogsTable.createdAt,
      })
      .from(fulfillmentLogsTable)
      .where(
        and(
          eq(fulfillmentLogsTable.status, "PENDING"),
          sql`${fulfillmentLogsTable.createdAt} < NOW() - INTERVAL '24 hours'`
        )
      );

    let followupsSent = 0;

    for (const entry of staleEntries) {
      const [distributor] = await db
        .select()
        .from(distributorsTable)
        .where(eq(distributorsTable.id, entry.distributorId))
        .limit(1);

      const [order] = await db
        .select()
        .from(ordersTable)
        .where(eq(ordersTable.id, entry.orderId))
        .limit(1);

      if (!distributor || !order) continue;

      const orderItems = await db
        .select()
        .from(orderItemsTable)
        .where(eq(orderItemsTable.orderId, order.id));

      const shippingAddress = order.shippingAddress as {
        firstName: string;
        lastName: string;
        address1: string;
        address2?: string;
        city: string;
        state: string;
        zip: string;
        country: string;
        phone?: string;
      };

      await sendEmail({
        to: distributor.email,
        subject: `[FOLLOWUP] Fulfillment Reminder — Order #${order.orderNumber}`,
        react: FulfillmentNoticeEmail({
          orderNumber: order.orderNumber,
          orderDate: order.createdAt.toLocaleDateString(),
          customerName: order.customerName,
          shippingAddress,
          items: orderItems.map((item) => ({
            sku: item.sku,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
          })),
          notes: `FOLLOWUP: This order has been pending fulfillment for over 24 hours. Originally submitted ${entry.createdAt.toISOString()}.`,
          replyEmail: STORE_EMAIL,
        }),
        replyTo: STORE_EMAIL,
      });

      followupsSent++;
    }

    return NextResponse.json({ staleEntries: staleEntries.length, followupsSent });
  } catch (err) {
    console.error("[Fulfillment Followup Error]", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
