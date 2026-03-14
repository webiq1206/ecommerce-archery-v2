import { Router, type IRouter } from "express";

const router: IRouter = Router();

router.post("/checkout/session", async (req, res): Promise<void> => {
  const { items, customerEmail, shippingAddress } = req.body;

  if (!items?.length) {
    res.status(400).json({ error: "Cart items are required" });
    return;
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    res.status(200).json({
      sessionId: `stub_session_${Date.now()}`,
      mode: "stub",
      message: "Stripe not configured — returning stub session. Set STRIPE_SECRET_KEY to enable real payments.",
      items,
      customerEmail,
    });
    return;
  }

  res.status(501).json({ error: "Stripe checkout session creation not yet implemented" });
});

router.post("/checkout/webhook", async (req, res): Promise<void> => {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    res.status(200).json({ received: true, mode: "stub" });
    return;
  }

  res.status(501).json({ error: "Stripe webhook processing not yet implemented" });
});

export default router;
