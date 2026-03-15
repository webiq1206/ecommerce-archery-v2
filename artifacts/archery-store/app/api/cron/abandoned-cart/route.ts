import { NextRequest, NextResponse } from "next/server";
import { db, cartItemsTable, productsTable, productImagesTable } from "@workspace/db";
import { sql, and, asc } from "drizzle-orm";
import { sendEmail } from "@/lib/email/send";
import { AbandonedCartEmail } from "@/lib/email/templates/abandoned-cart";

const CRON_SECRET = process.env.CRON_SECRET;
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://apexarchery.com";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const abandonedCarts = await db
      .select({
        sessionId: cartItemsTable.sessionId,
        productId: cartItemsTable.productId,
        quantity: cartItemsTable.quantity,
      })
      .from(cartItemsTable)
      .where(
        and(
          sql`${cartItemsTable.sessionId} IS NOT NULL`,
          sql`${cartItemsTable.addedAt} < NOW() - INTERVAL '1 hour'`,
          sql`${cartItemsTable.addedAt} > NOW() - INTERVAL '24 hours'`
        )
      );

    const sessions = new Map<string, typeof abandonedCarts>();
    for (const cart of abandonedCarts) {
      if (!cart.sessionId) continue;
      if (!sessions.has(cart.sessionId)) sessions.set(cart.sessionId, []);
      sessions.get(cart.sessionId)!.push(cart);
    }

    let emailsSent = 0;

    for (const [sessionId, items] of sessions) {
      const productIds = items.map((i) => i.productId);
      const products = await db
        .select({ id: productsTable.id, name: productsTable.name, price: productsTable.price })
        .from(productsTable)
        .where(sql`${productsTable.id} IN ${productIds}`);

      const productImages = await db
        .select({ productId: productImagesTable.productId, url: productImagesTable.url })
        .from(productImagesTable)
        .where(sql`${productImagesTable.productId} IN ${productIds}`)
        .orderBy(asc(productImagesTable.sortOrder));

      const imageMap = new Map<string, string>();
      for (const img of productImages) {
        if (!imageMap.has(img.productId)) imageMap.set(img.productId, img.url);
      }

      const emailItems = products.map((p) => ({
        name: p.name,
        price: p.price,
        image: imageMap.get(p.id),
      }));

      // The session may have an associated email from a prior checkout attempt
      // For carts linked to an order email, we'd look that up. Here we use a placeholder
      // that a real implementation would resolve from the user's session/account.
      const customerEmail = `session+${sessionId.slice(0, 8)}@apexarchery.com`;

      await sendEmail({
        to: customerEmail,
        subject: "You left something behind at Apex Archery",
        react: AbandonedCartEmail({
          customerEmail,
          items: emailItems,
          cartUrl: `${BASE_URL}/cart`,
          discountCode: "COMEBACK10",
        }),
      });

      emailsSent++;
    }

    return NextResponse.json({ processed: sessions.size, emailsSent });
  } catch (err) {
    console.error("[Abandoned Cart Cron Error]", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
