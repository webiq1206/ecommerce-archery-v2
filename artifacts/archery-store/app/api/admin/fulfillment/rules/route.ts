import { NextRequest, NextResponse } from "next/server";
import { db, storeSettingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const SETTING_KEY = "fulfillment_routing_rules";

export async function GET() {
  try {
    const [setting] = await db
      .select()
      .from(storeSettingsTable)
      .where(eq(storeSettingsTable.key, SETTING_KEY))
      .limit(1);

    const rules = setting ? JSON.parse(setting.value) : [];
    return NextResponse.json({ rules });
  } catch (err) {
    console.error("[Routing Rules GET Error]", err);
    return NextResponse.json({ error: "Failed to fetch routing rules" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { rules } = (await req.json()) as {
      rules: Array<{ id: string; categoryId: string; distributorId: string }>;
    };

    if (!Array.isArray(rules)) {
      return NextResponse.json({ error: "rules must be an array" }, { status: 400 });
    }

    const value = JSON.stringify(rules);

    const [existing] = await db
      .select()
      .from(storeSettingsTable)
      .where(eq(storeSettingsTable.key, SETTING_KEY))
      .limit(1);

    if (existing) {
      await db
        .update(storeSettingsTable)
        .set({ value })
        .where(eq(storeSettingsTable.key, SETTING_KEY));
    } else {
      await db.insert(storeSettingsTable).values({ key: SETTING_KEY, value });
    }

    return NextResponse.json({ success: true, rules });
  } catch (err) {
    console.error("[Routing Rules POST Error]", err);
    return NextResponse.json({ error: "Failed to save routing rules" }, { status: 500 });
  }
}
