import type { Request, Response, NextFunction } from "express";

export function adminGuard(req: Request, res: Response, next: NextFunction): void {
  const role = req.headers["x-user-role"] as string | undefined;
  if (role === "ADMIN" || role === "SUPER_ADMIN") {
    next();
    return;
  }
  res.status(403).json({ error: "Admin access required" });
}
