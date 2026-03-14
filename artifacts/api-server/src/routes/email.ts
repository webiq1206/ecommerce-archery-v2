import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, emailSubscribersTable } from "@workspace/db";
import { SubscribeEmailBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/email/subscribe", async (req, res): Promise<void> => {
  const parsed = SubscribeEmailBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const existing = await db.select().from(emailSubscribersTable).where(eq(emailSubscribersTable.email, parsed.data.email));
  if (existing.length > 0) {
    res.status(201).json({ success: true });
    return;
  }

  const data = parsed.data;
  await db.insert(emailSubscribersTable).values({
    email: data.email,
    firstName: data.firstName,
    source: data.source,
  });
  res.status(201).json({ success: true });
});

export default router;
