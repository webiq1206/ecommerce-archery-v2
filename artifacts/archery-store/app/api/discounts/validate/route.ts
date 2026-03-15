import { NextRequest, NextResponse } from "next/server";
import { db, discountsTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const { code, subtotal } = await req.json();

    if (!code) {
      return NextResponse.json({ valid: false, error: "No code provided" });
    }

    const [discount] = await db
      .select()
      .from(discountsTable)
      .where(
        and(
          eq(discountsTable.code, code.toUpperCase()),
          eq(discountsTable.isActive, true)
        )
      )
      .limit(1);

    if (!discount) {
      return NextResponse.json({ valid: false, error: "Invalid discount code" });
    }

    if (discount.expiresAt && new Date(discount.expiresAt) < new Date()) {
      return NextResponse.json({ valid: false, error: "This code has expired" });
    }

    if (discount.maxUses && discount.usedCount >= discount.maxUses) {
      return NextResponse.json({ valid: false, error: "This code has reached its usage limit" });
    }

    if (discount.minOrderValue && subtotal < parseFloat(discount.minOrderValue)) {
      return NextResponse.json({
        valid: false,
        error: `Minimum order of $${discount.minOrderValue} required`,
      });
    }

    let discountAmount = 0;
    if (discount.type === "PERCENTAGE") {
      discountAmount = (subtotal * parseFloat(discount.value)) / 100;
    } else if (discount.type === "FIXED_AMOUNT") {
      discountAmount = parseFloat(discount.value);
    }

    return NextResponse.json({
      valid: true,
      discount: discountAmount,
      type: discount.type,
      value: discount.value,
    });
  } catch {
    return NextResponse.json({ valid: false, error: "Failed to validate code" }, { status: 500 });
  }
}
