import type { Request, Response, NextFunction } from "express";
import { supabaseAdmin } from "./supabaseAdmin";
import { logger } from "./logger";

async function checkIsAdmin(userId: string): Promise<boolean> {
  const adminEmails = process.env.ADMIN_EMAILS
    ? process.env.ADMIN_EMAILS.split(",").map((e) => e.trim().toLowerCase())
    : [];

  try {
    const { data: { user }, error } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (error || !user) return false;

    if (user.app_metadata?.role === "admin") return true;

    if (
      adminEmails.length > 0 &&
      user.email &&
      adminEmails.includes(user.email.toLowerCase())
    )
      return true;
  } catch (err) {
    logger.warn({ err }, "Admin check failed");
  }

  return false;
}

export async function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing authorization token" });
    return;
  }

  const token = authHeader.slice(7);
  const { data, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !data.user) {
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }

  req.userId = data.user.id;

  const isAdmin = await checkIsAdmin(data.user.id);
  if (!isAdmin) {
    res.status(403).json({ error: "Admin access required" });
    return;
  }

  next();
}

export { checkIsAdmin };
