import { Router, type IRouter } from "express";

const router: IRouter = Router();

router.post("/checkout/session", async (req, res): Promise<void> => {
  res.status(501).json({ error: "Stripe checkout integration pending — coming in next phase" });
});

router.post("/checkout/webhook", async (req, res): Promise<void> => {
  res.status(501).json({ error: "Stripe webhook integration pending — coming in next phase" });
});

export default router;
