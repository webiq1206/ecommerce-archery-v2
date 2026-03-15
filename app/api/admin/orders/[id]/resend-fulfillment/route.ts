import { NextRequest, NextResponse } from "next/server";
import { db, fulfillmentLogsTable, ordersTable, orderItemsTable, distributorsTable } from "@/lib/db";
import { eq } from "drizzle-orm";
import { sendEmail } from "@/lib/email/send";
import { FulfillmentNoticeEmail } from "@/lib/email/templates/fulfillment-notice";

const STORE_EMAIL = process.env.FROM_EMAIL ?? "orders@apexarchery.com";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: orderId } = await params;

  try {
    const { fulfillmentLogId } = await req.json();

    if (!fulfillmentLogId) {
      return NextResponse.json({ error: "fulfillmentLogId is required" }, { status: 400 });
    }

    const [fulfillmentLog] = await db
      .select()
      .from(fulfillmentLogsTable)
      .where(eq(fulfillmentLogsTable.id, fulfillmentLogId))
      .limit(1);

    if (!fulfillmentLog || fulfillmentLog.orderId !== orderId) {
      return NextResponse.json({ error: "Fulfillment log not found" }, { status: 404 });
    }

    const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, orderId)).limit(1);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const [distributor] = await db
      .select()
      .from(distributorsTable)
      .where(eq(distributorsTable.id, fulfillmentLog.distributorId))
      .limit(1);

    if (!distributor) {
      return NextResponse.json({ error: "Distributor not found" }, { status: 404 });
    }

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
      subject: `[RESEND] Fulfillment Request — Order #${order.orderNumber}`,
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
        notes: "This is a re-sent fulfillment request.",
        replyEmail: STORE_EMAIL,
      }),
      replyTo: STORE_EMAIL,
    });

    await db
      .update(fulfillmentLogsTable)
      .set({ emailSentAt: new Date() })
      .where(eq(fulfillmentLogsTable.id, fulfillmentLogId));

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Resend Fulfillment Error]", err);
    return NextResponse.json({ error: "Failed to resend fulfillment email" }, { status: 500 });
  }
}
