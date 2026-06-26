import { Router, type IRouter } from "express";
import { supabaseAdmin } from "../lib/supabaseAdmin";

const router: IRouter = Router();

router.get("/stats", async (_req, res) => {
  try {
    const [ordersResult, customersResult, todayResult, completedResult] =
      await Promise.all([
        supabaseAdmin
          .from("orders")
          .select("*", { count: "exact", head: true }),

        supabaseAdmin
          .from("profiles")
          .select("*", { count: "exact", head: true }),

        supabaseAdmin
          .from("orders")
          .select("*", { count: "exact", head: true })
          .gte(
            "created_at",
            new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
          ),

        supabaseAdmin
          .from("orders")
          .select("*", { count: "exact", head: true })
          .eq("status", "completed"),
      ]);

    res.json({
      totalOrders: ordersResult.count ?? 0,
      totalCustomers: customersResult.count ?? 0,
      ordersToday: todayResult.count ?? 0,
      completedOrders: completedResult.count ?? 0,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

export default router;
