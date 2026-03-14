import { Router, type IRouter } from "express";

const router: IRouter = Router();

router.post("/webhooks/stripe", async (req, res): Promise<void> => {
  res.status(501).json({ error: "Stripe webhook processing pending — coming in next phase" });
});

router.post("/webhooks/shipping", async (req, res): Promise<void> => {
  res.status(501).json({ error: "Shipping webhook processing pending — coming in next phase" });
});

export default router;
