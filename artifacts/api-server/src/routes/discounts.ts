import { Router, type IRouter } from "express";
import { eq, and, gte, lte } from "drizzle-orm";
import { db, discountsTable } from "@workspace/db";
import { CreateDiscountBody, UpdateDiscountBody, DeleteDiscountParams, ValidateDiscountBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/discounts", async (_req, res): Promise<void> => {
  const discounts = await db.select().from(discountsTable);
  res.json(discounts.map(d => ({ ...d, createdAt: d.createdAt.toISOString(), startsAt: d.startsAt?.toISOString() ?? null, expiresAt: d.expiresAt?.toISOString() ?? null })));
});

router.post("/discounts", async (req, res): Promise<void> => {
  const parsed = CreateDiscountBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [discount] = await db.insert(discountsTable).values(parsed.data as any).returning();
  res.status(201).json({ ...discount, createdAt: discount.createdAt.toISOString() });
});

router.put("/discounts/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const parsed = UpdateDiscountBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [discount] = await db.update(discountsTable).set(parsed.data as any).where(eq(discountsTable.id, raw)).returning();
  if (!discount) { res.status(404).json({ error: "Discount not found" }); return; }
  res.json({ ...discount, createdAt: discount.createdAt.toISOString() });
});

router.delete("/discounts/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const [discount] = await db.delete(discountsTable).where(eq(discountsTable.id, raw)).returning();
  if (!discount) { res.status(404).json({ error: "Discount not found" }); return; }
  res.sendStatus(204);
});

router.post("/discounts/validate", async (req, res): Promise<void> => {
  const parsed = ValidateDiscountBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [discount] = await db.select().from(discountsTable).where(eq(discountsTable.code, parsed.data.code));
  if (!discount) { res.json({ valid: false, error: "Invalid discount code" }); return; }
  if (!discount.isActive) { res.json({ valid: false, error: "Discount is inactive" }); return; }
  if (discount.maxUses && discount.usedCount >= discount.maxUses) { res.json({ valid: false, error: "Discount has been fully redeemed" }); return; }
  if (discount.expiresAt && new Date() > discount.expiresAt) { res.json({ valid: false, error: "Discount has expired" }); return; }
  if (discount.startsAt && new Date() < discount.startsAt) { res.json({ valid: false, error: "Discount is not yet active" }); return; }
  if (discount.minOrderValue && parsed.data.orderTotal !== undefined && parsed.data.orderTotal < Number(discount.minOrderValue)) {
    res.json({ valid: false, error: `Minimum order value of $${discount.minOrderValue} required` });
    return;
  }

  res.json({ valid: true, discount: { ...discount, createdAt: discount.createdAt.toISOString(), startsAt: discount.startsAt?.toISOString() ?? null, expiresAt: discount.expiresAt?.toISOString() ?? null } });
});

export default router;
