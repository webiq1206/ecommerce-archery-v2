import { Router, type IRouter } from "express";

const router: IRouter = Router();

router.post("/ai/recommend", async (req, res): Promise<void> => {
  res.status(501).json({ error: "AI recommendation engine pending — coming in next phase" });
});

router.post("/ai/chat", async (req, res): Promise<void> => {
  res.status(501).json({ error: "AI chat assistant pending — coming in next phase" });
});

export default router;
