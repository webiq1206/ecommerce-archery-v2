import { NextRequest, NextResponse } from "next/server";
import { db, productsTable } from "@workspace/db";
import { sql, eq } from "drizzle-orm";

const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Update search vectors for all active products
    const result = await db.execute(sql`
      UPDATE products
      SET search_vector = to_tsvector('english',
        coalesce(name, '') || ' ' ||
        coalesce(short_description, '') || ' ' ||
        coalesce(description, '') || ' ' ||
        coalesce(sku, '') || ' ' ||
        coalesce(seo_keywords, '')
      )
      WHERE status = 'ACTIVE'
    `);

    return NextResponse.json({
      success: true,
      message: "Search vectors updated for all active products",
    });
  } catch (err) {
    console.error("[Search Reindex Error]", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
