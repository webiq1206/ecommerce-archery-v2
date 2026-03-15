import { NextRequest, NextResponse } from "next/server";
import { db, productsTable } from "@workspace/db";

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, "").toLowerCase());
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].match(/("([^"]|"")*"|[^,]*)/g)?.map((v) => v.trim().replace(/^"|"$/g, "").replace(/""/g, '"')) ?? [];
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => { row[h] = values[idx] ?? ""; });
    rows.push(row);
  }

  return rows;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

    const text = await file.text();
    const rows = parseCSV(text);

    if (rows.length === 0) {
      return NextResponse.json({ error: "Empty or invalid CSV" }, { status: 400 });
    }

    let imported = 0;

    for (const row of rows) {
      if (!row.name || !row.sku) continue;

      await db.insert(productsTable).values({
        name: row.name,
        slug: row.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
        sku: row.sku,
        price: row.price || "0.00",
        status: (row.status as "DRAFT" | "ACTIVE" | "ARCHIVED") || "DRAFT",
        description: row.description || null,
        shortDescription: row.shortdescription || null,
      }).onConflictDoNothing();

      imported++;
    }

    return NextResponse.json({ imported, total: rows.length });
  } catch (err) {
    console.error("CSV import error:", err);
    return NextResponse.json({ error: "Import failed" }, { status: 500 });
  }
}
