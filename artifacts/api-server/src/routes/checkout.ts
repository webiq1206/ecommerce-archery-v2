import { Router, type IRouter } from "express";
import * as z from "zod";

const CheckoutSessionBody = z.object({
  items: z.array(z.object({
    productId: z.string(),
    variantId: z.string().optional(),
    price: z.number(),
    quantity: z.number().int().positive(),
  })).min(1),
  customerEmail: z.string().email().optional(),
  shippingAddress: z.record(z.string(), z.string()).optional(),
});

const router: IRouter = Router();

router.post("/checkout/session", async (req, res): Promise<void> => {
  const parsed = CheckoutSessionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { items, customerEmail, shippingAddress } = parsed.data;

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    res.status(200).json({
      sessionId: `stub_session_${Date.now()}`,
      clientSecret: `stub_secret_${Date.now()}`,
      mode: "stub",
      message: "Stripe not configured — returning stub session. Set STRIPE_SECRET_KEY to enable real payments.",
      items,
      customerEmail,
    });
    return;
  }

  try {
    const stripe = await import("stripe");
    const client = new stripe.default(stripeKey);

    const amount = items.reduce((sum: number, item: { price: number; quantity: number }) => {
      return sum + Math.round(item.price * 100) * item.quantity;
    }, 0);

    const paymentIntent = await client.paymentIntents.create({
      amount,
      currency: "usd",
      receipt_email: customerEmail,
      metadata: { itemCount: String(items.length) },
    });

    res.status(200).json({
      sessionId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      mode: "live",
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create payment intent";
    res.status(500).json({ error: message });
  }
});

router.post("/checkout/webhook", async (req, res): Promise<void> => {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    res.status(200).json({ received: true, mode: "stub" });
    return;
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    res.status(200).json({ received: true, mode: "unverified" });
    return;
  }

  try {
    const stripe = await import("stripe");
    const client = new stripe.default(stripeKey);
    const sig = req.headers["stripe-signature"] as string;
    const event = client.webhooks.constructEvent(
      JSON.stringify(req.body),
      sig,
      webhookSecret,
    );

    switch (event.type) {
      case "payment_intent.succeeded":
        break;
      case "payment_intent.payment_failed":
        break;
    }

    res.status(200).json({ received: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Webhook error";
    res.status(400).json({ error: message });
  }
});

export default router;
