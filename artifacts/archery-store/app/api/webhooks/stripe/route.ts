import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { db, ordersTable, fulfillmentLogsTable, orderItemsTable, distributorsTable, productsTable, productImagesTable } from "@workspace/db";
import { eq, sql, and } from "drizzle-orm";
import { sendEmail } from "@/lib/email/send";
import { OrderConfirmationEmail } from "@/lib/email/templates/order-confirmation";

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req: NextRequest) {
  if (!stripe || !webhookSecret) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
  }

  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "payment_intent.succeeded": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const [order] = await db
        .select()
        .from(ordersTable)
        .where(eq(ordersTable.stripePaymentIntentId, paymentIntent.id))
        .limit(1);

      if (order) {
        await db
          .update(ordersTable)
          .set({
            status: "CONFIRMED",
            paymentStatus: "PAID",
            stripeChargeId: paymentIntent.latest_charge as string,
          })
          .where(eq(ordersTable.id, order.id));

        // Create fulfillment logs per distributor
        const items = await db
          .select()
          .from(orderItemsTable)
          .where(eq(orderItemsTable.orderId, order.id));

        const productIds = items.map((i) => i.productId);
        if (productIds.length > 0) {
          const products = await db
            .select({ id: productsTable.id, distributorId: productsTable.distributorId })
            .from(productsTable)
            .where(sql`${productsTable.id} IN ${productIds}`);

          const distributorMap = new Map<string, typeof items>();
          for (const item of items) {
            const product = products.find((p) => p.id === item.productId);
            const distId = product?.distributorId ?? "unassigned";
            if (!distributorMap.has(distId)) distributorMap.set(distId, []);
            distributorMap.get(distId)!.push(item);
          }

          for (const [distributorId, distItems] of distributorMap) {
            if (distributorId === "unassigned") continue;
            await db.insert(fulfillmentLogsTable).values({
              orderId: order.id,
              distributorId,
              status: "PENDING",
              itemsSent: distItems.map((i) => ({
                name: i.name,
                sku: i.sku,
                quantity: i.quantity,
                options: i.options,
              })),
            });
          }
        }

        // Send order confirmation email
        const productIds = items.map((i) => i.productId);
        const itemImages = productIds.length > 0
          ? await db
              .select({ productId: productImagesTable.productId, url: productImagesTable.url })
              .from(productImagesTable)
              .where(sql`${productImagesTable.productId} IN ${productIds} AND ${productImagesTable.sortOrder} = 0`)
          : [];

        const shippingAddr = order.shippingAddress as {
          firstName: string; lastName: string; address1: string;
          address2?: string; city: string; state: string; zip: string; country: string;
        };

        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://apexarchery.com";

        await sendEmail({
          to: order.customerEmail,
          subject: `Order Confirmed – #${order.orderNumber}`,
          react: OrderConfirmationEmail({
            orderNumber: order.orderNumber,
            orderDate: new Date(order.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
            customerName: order.customerName,
            items: items.map((i) => ({
              name: i.name,
              sku: i.sku,
              quantity: i.quantity,
              price: Number(i.price).toFixed(2),
              image: itemImages.find((img) => img.productId === i.productId)?.url,
            })),
            subtotal: Number(order.subtotal).toFixed(2),
            shipping: Number(order.shippingTotal).toFixed(2),
            tax: Number(order.taxTotal).toFixed(2),
            discount: Number(order.discountTotal).toFixed(2),
            total: Number(order.total).toFixed(2),
            shippingAddress: shippingAddr,
            orderUrl: `${baseUrl}/account/orders/${order.id}`,
          }),
        });
      }
      break;
    }

    case "payment_intent.payment_failed": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      await db
        .update(ordersTable)
        .set({ paymentStatus: "FAILED" })
        .where(eq(ordersTable.stripePaymentIntentId, paymentIntent.id));
      break;
    }
  }

  return NextResponse.json({ received: true });
}
