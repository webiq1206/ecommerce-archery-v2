import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, distributorsTable, productsTable } from "@workspace/db";
import { CreateDistributorBody, UpdateDistributorBody, DeleteDistributorParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/distributors", async (_req, res): Promise<void> => {
  const distributors = await db.select().from(distributorsTable);
  const counts = await db.select({ distributorId: productsTable.distributorId, count: sql<number>`count(*)::int` }).from(productsTable).where(sql`${productsTable.distributorId} IS NOT NULL`).groupBy(productsTable.distributorId);
  const countMap = new Map(counts.map(c => [c.distributorId, c.count]));

  res.json(distributors.map(d => ({
    id: d.id, name: d.name, contactName: d.contactName, email: d.email,
    phone: d.phone, notes: d.notes, isActive: d.isActive,
    productCount: countMap.get(d.id) ?? 0, createdAt: d.createdAt.toISOString(),
  })));
});

router.post("/distributors", async (req, res): Promise<void> => {
  const parsed = CreateDistributorBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const data = parsed.data;
  const [distributor] = await db.insert(distributorsTable).values({
    name: data.name,
    contactName: data.contactName,
    email: data.email,
    phone: data.phone,
    notes: data.notes,
    isActive: data.isActive,
  }).returning();
  res.status(201).json({ ...distributor, createdAt: distributor.createdAt.toISOString() });
});

router.get("/distributors/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const [distributor] = await db.select().from(distributorsTable).where(eq(distributorsTable.id, raw));
  if (!distributor) { res.status(404).json({ error: "Distributor not found" }); return; }
  res.json({ ...distributor, createdAt: distributor.createdAt.toISOString() });
});

router.put("/distributors/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const parsed = UpdateDistributorBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const data = parsed.data;
  const [distributor] = await db.update(distributorsTable).set({
    name: data.name,
    contactName: data.contactName,
    email: data.email,
    phone: data.phone,
    notes: data.notes,
    isActive: data.isActive,
  }).where(eq(distributorsTable.id, raw)).returning();
  if (!distributor) { res.status(404).json({ error: "Distributor not found" }); return; }
  res.json({ ...distributor, createdAt: distributor.createdAt.toISOString() });
});

router.delete("/distributors/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const [distributor] = await db.delete(distributorsTable).where(eq(distributorsTable.id, raw)).returning();
  if (!distributor) { res.status(404).json({ error: "Distributor not found" }); return; }
  res.sendStatus(204);
});

export default router;
