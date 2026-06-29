import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { requireAuth } from "../lib/auth";
import { requireAdmin } from "../lib/adminAuth";
import { supabaseAdmin } from "../lib/supabaseAdmin";
import { logger } from "../lib/logger";

const router = Router();

const msgLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
});

const SendMessageSchema = z.object({
  message: z.string().min(1).max(2000),
});

// ── POST /api/chat/messages — user sends a message ───────────────────────────
router.post("/messages", requireAuth, msgLimiter, async (req, res) => {
  const userId = req.userId!;
  const parsed = SendMessageSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid message", details: parsed.error.flatten() });
    return;
  }

  const { data, error } = await supabaseAdmin
    .from("chat_messages")
    .insert({ user_id: userId, message: parsed.data.message, sender: "user" })
    .select()
    .single();

  if (error) {
    logger.error({ error }, "Failed to save chat message");
    res.status(500).json({ error: "Failed to send message" });
    return;
  }

  res.status(201).json(data);
});

// ── GET /api/chat/messages — user fetches their own conversation history ──────
router.get("/messages", requireAuth, msgLimiter, async (req, res) => {
  const userId = req.userId!;
  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = Math.min(50, Number(req.query.pageSize) || 30);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await supabaseAdmin
    .from("chat_messages")
    .select("*", { count: "exact" })
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .range(from, to);

  if (error) {
    logger.error({ error }, "Failed to fetch chat messages");
    res.status(500).json({ error: "Failed to fetch messages" });
    return;
  }

  // Mark unread admin→user messages as read
  const unreadIds = (data ?? [])
    .filter((m) => m.sender === "admin" && !m.is_read)
    .map((m) => m.id);

  if (unreadIds.length > 0) {
    await supabaseAdmin
      .from("chat_messages")
      .update({ is_read: true })
      .in("id", unreadIds);
  }

  res.json({
    data: data ?? [],
    total: count ?? 0,
    page,
    pageSize,
    hasMore: (count ?? 0) > page * pageSize,
  });
});

// ── PATCH /api/chat/messages/:id/read — mark a single message as read ────────
router.patch("/messages/:id/read", requireAuth, msgLimiter, async (req, res) => {
  const userId = req.userId!;
  const { id } = req.params;

  const { error } = await supabaseAdmin
    .from("chat_messages")
    .update({ is_read: true })
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    res.status(500).json({ error: "Failed to mark as read" });
    return;
  }

  res.json({ success: true });
});

// ── GET /api/chat/unread-count — how many unread admin replies the user has ───
router.get("/unread-count", requireAuth, async (req, res) => {
  const userId = req.userId!;

  const { count, error } = await supabaseAdmin
    .from("chat_messages")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("sender", "admin")
    .eq("is_read", false);

  if (error) {
    res.status(500).json({ error: "Failed to get unread count" });
    return;
  }

  res.json({ count: count ?? 0 });
});

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN ROUTES
// ─────────────────────────────────────────────────────────────────────────────

// ── GET /api/chat/admin/conversations — list all users who have sent messages ─
router.get("/admin/conversations", requireAdmin, async (req, res) => {
  // Fetch all messages ordered newest first
  const { data, error } = await supabaseAdmin
    .from("chat_messages")
    .select("user_id, created_at, message, sender, is_read")
    .order("created_at", { ascending: false });

  if (error) {
    logger.error({ error }, "Failed to fetch conversations");
    res.status(500).json({ error: "Failed to fetch conversations" });
    return;
  }

  // Build per-user conversation summary
  const byUser = new Map<
    string,
    { user_id: string; last_message: string; last_at: string; unread: number }
  >();

  for (const row of data ?? []) {
    if (!byUser.has(row.user_id)) {
      // First row for this user = most recent message (since ordered desc)
      byUser.set(row.user_id, {
        user_id: row.user_id,
        last_message: row.message,
        last_at: row.created_at,
        unread: 0,
      });
    }
    // Count unread = user messages that admin hasn't read yet
    if (row.sender === "user" && !row.is_read) {
      byUser.get(row.user_id)!.unread += 1;
    }
  }

  // Optionally enrich with emails from auth.users
  const userIds = [...byUser.keys()];
  const emailMap = new Map<string, string>();

  if (userIds.length > 0) {
    try {
      // Supabase admin.listUsers returns paginated results
      const { data: usersData } = await supabaseAdmin.auth.admin.listUsers({
        perPage: 1000,
      });
      for (const u of usersData?.users ?? []) {
        if (u.email && byUser.has(u.id)) {
          emailMap.set(u.id, u.email);
        }
      }
    } catch (e) {
      logger.warn({ e }, "Could not enrich conversations with emails");
    }
  }

  const conversations = [...byUser.values()].map((c) => ({
    ...c,
    email: emailMap.get(c.user_id) ?? null,
  }));

  res.json({ conversations });
});

// ── GET /api/chat/admin/messages/:userId — fetch a specific user's messages ───
// THIS WAS THE MISSING ROUTE causing "No messages yet" in the admin panel
router.get("/admin/messages/:userId", requireAdmin, async (req, res) => {
  const { userId } = req.params;
  const pageSize = Math.min(100, Number(req.query.pageSize) || 50);
  const page = Math.max(1, Number(req.query.page) || 1);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await supabaseAdmin
    .from("chat_messages")
    .select("*", { count: "exact" })
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .range(from, to);

  if (error) {
    logger.error({ error }, "Failed to fetch user messages for admin");
    res.status(500).json({ error: "Failed to fetch messages" });
    return;
  }

  res.json({
    data: data ?? [],
    total: count ?? 0,
    page,
    pageSize,
    hasMore: (count ?? 0) > page * pageSize,
  });
});

// ── POST /api/chat/admin/mark-read/:userId — clear unread for a conversation ──
router.post("/admin/mark-read/:userId", requireAdmin, async (req, res) => {
  const { userId } = req.params;

  const { error } = await supabaseAdmin
    .from("chat_messages")
    .update({ is_read: true })
    .eq("user_id", userId)
    .eq("sender", "user")
    .eq("is_read", false);

  if (error) {
    logger.error({ error }, "Failed to mark messages as read");
    res.status(500).json({ error: "Failed to mark as read" });
    return;
  }

  res.json({ success: true });
});

// ── POST /api/chat/admin/reply — admin replies to a user ─────────────────────
const AdminReplySchema = z.object({
  userId: z.string().uuid(),
  message: z.string().min(1).max(2000),
});

router.post("/admin/reply", requireAdmin, msgLimiter, async (req, res) => {
  const parsed = AdminReplySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }

  const { userId, message } = parsed.data;

  const { data, error } = await supabaseAdmin
    .from("chat_messages")
    .insert({ user_id: userId, message, sender: "admin", is_read: false })
    .select()
    .single();

  if (error) {
    logger.error({ error }, "Failed to send admin reply");
    res.status(500).json({ error: "Failed to send reply" });
    return;
  }

  // Notify the user
  await supabaseAdmin
    .from("notifications")
    .insert({
      user_id: userId,
      title: "Support reply",
      message: message.slice(0, 120),
      type: "info",
    })
    .select();

  res.status(201).json(data);
});

export default router;