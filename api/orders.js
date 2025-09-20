// dapurmerifa/api/orders.js
// Serverless API untuk CRUD order via Supabase (server-side)

import { getSupabaseAdmin } from "./_utils/supabaseAdmin.js";
import { requireAdmin } from "./_utils/auth.js";
import { applyCors } from "./_utils/cors.js";

const supabase = getSupabaseAdmin();

const camelToSnake = (obj) => {
  const out = {};
  for (const [k, v] of Object.entries(obj || {})) {
    const snake = k.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`);
    out[snake] = v;
  }
  return out;
};

export default async function handler(req, res) {
  if (!supabase) {
    return res
      .status(500)
      .json({
        message:
          "Supabase client is not initialized. Check server environment variables.",
      });
  }
  if (
    !applyCors(req, res, { allowMethods: "GET,POST,PUT,PATCH,DELETE,OPTIONS" })
  )
    return;
  if (req.method === "OPTIONS") return res.status(204).end();

  try {
    if (req.method === "GET") {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return res.status(200).json(data);
    }

    if (req.method === "POST") {
      const body = req.body || {};
      // Body dapat berisi: id (string seperti DM-xxxx), customer, customerEmail, items (json), total, status, discount (json), date (YYYY-MM-DD)
      const mapped = camelToSnake(body);
      const { data, error } = await supabase
        .from("orders")
        .insert(mapped)
        .select("*")
        .single();
      if (error) throw error;
      return res.status(201).json(data);
    }

    if (req.method === "PUT" || req.method === "PATCH") {
      const admin = await requireAdmin(req, res);
      if (!admin) return;
      const body = req.body || {};
      const id = body.id || (req.query && req.query.id);
      if (!id) return res.status(400).json({ message: "Missing id" });

      // Fetch current order to detect status transition
      const { data: beforeRow, error: fetchErr } = await supabase
        .from("orders")
        .select("*")
        .eq("id", id)
        .single();
      if (fetchErr && fetchErr.code !== "PGRST116") throw fetchErr;
      const prevStatus = beforeRow?.status || null;

      const mapped = camelToSnake(body);
      delete mapped.id;
      const { data: afterRow, error } = await supabase
        .from("orders")
        .update(mapped)
        .eq("id", id)
        .select("*")
        .single();
      if (error) throw error;

      // Auto-sync loyalty points when order status changes to 'completed'
      try {
        const newStatus = afterRow?.status;
        if (prevStatus !== "completed" && newStatus === "completed") {
          // Calculate earned points (1 point per Rp 10,000)
          const orderTotal = Number(afterRow?.total || 0);
          const pointsEarned = Math.floor(orderTotal / 10000);

          const email = afterRow?.customer_email || afterRow?.customerEmail;
          if (email && pointsEarned > 0) {
            console.log(
              `[Orders API] Auto-syncing ${pointsEarned} points for ${email}`
            );

            // Resolve user id via loyalty_points by email
            let userId = null;
            try {
              const { data: lpByEmail, error: eLp } = await supabase
                .from("loyalty_points")
                .select("id,email,points")
                .eq("email", email)
                .limit(1)
                .single();
              if (!eLp && lpByEmail?.id) userId = lpByEmail.id;
            } catch (_) {}

            if (userId) {
              // Ensure points row exists
              const { data: current, error: e1 } = await supabase
                .from("loyalty_points")
                .select("points,email")
                .eq("id", userId)
                .single();
              let currentPts = 0;
              if (e1 && e1.code !== "PGRST116") throw e1;
              if (current && typeof current.points === "number")
                currentPts = current.points;
              if (!current) {
                const { error: insErr } = await supabase
                  .from("loyalty_points")
                  .insert({ id: userId, email, points: 0 });
                if (insErr) throw insErr;
              }

              // Idempotency guard: skip if points already earned for this order
              const orderCreatedAt =
                afterRow?.created_at || beforeRow?.created_at || null;
              if (orderCreatedAt) {
                try {
                  const { data: dup } = await supabase
                    .from("loyalty_history")
                    .select("op,amount,created_at")
                    .eq("user_id", userId)
                    .eq("op", "earn")
                    .eq("amount", pointsEarned)
                    .gte("created_at", orderCreatedAt)
                    .limit(1);
                  if (Array.isArray(dup) && dup.length > 0) {
                    console.log(
                      `[Orders API] Points already earned for this order, skipping`
                    );
                    return res.status(200).json(afterRow);
                  }
                } catch (_) {}
              }

              const nextPts = currentPts + pointsEarned;
              const { data: updatedPts, error: upErr } = await supabase
                .from("loyalty_points")
                .upsert({ id: userId, email, points: nextPts })
                .select("points")
                .single();
              if (upErr) throw upErr;

              // Write history as earn
              await supabase.from("loyalty_history").insert({
                user_id: userId,
                email,
                op: "earn",
                amount: pointsEarned,
                points_before: currentPts,
                points_after: nextPts,
              });

              console.log(
                `[Orders API] Successfully earned ${pointsEarned} points for ${email}`
              );
            }
          }
        }
      } catch (e) {
        // Do not fail order update if points sync fails; log via console
        console.error("[Orders API] Auto-sync points failed", e);
      }

      // Simple rule: if status transitions to 'Dibatalkan', refund redeemed points automatically
      try {
        const newStatus = afterRow?.status;
        if (prevStatus !== "Dibatalkan" && newStatus === "Dibatalkan") {
          // Determine redeemed points from order row
          const ptsDiscount = Number(
            afterRow?.points_discount || beforeRow?.points_discount || 0
          );
          let ptsRedeemed = Number(
            afterRow?.points_redeemed || beforeRow?.points_redeemed || 0
          );
          if (!ptsRedeemed && ptsDiscount > 0)
            ptsRedeemed = Math.floor(ptsDiscount / 100);

          const email = afterRow?.customer_email || beforeRow?.customer_email;
          if (email && ptsRedeemed > 0) {
            // Resolve user id via loyalty_points by email
            let userId = null;
            try {
              const { data: lpByEmail, error: eLp } = await supabase
                .from("loyalty_points")
                .select("id,email,points")
                .eq("email", email)
                .limit(1)
                .single();
              if (!eLp && lpByEmail?.id) userId = lpByEmail.id;
            } catch (_) {}

            if (userId) {
              // Ensure points row exists
              const { data: current, error: e1 } = await supabase
                .from("loyalty_points")
                .select("points,email")
                .eq("id", userId)
                .single();
              let currentPts = 0;
              if (e1 && e1.code !== "PGRST116") throw e1;
              if (current && typeof current.points === "number")
                currentPts = current.points;
              if (!current) {
                const { error: insErr } = await supabase
                  .from("loyalty_points")
                  .insert({ id: userId, email, points: 0 });
                if (insErr) throw insErr;
              }

              // Idempotency guard: skip if a similar refund already recorded after order creation
              const orderCreatedAt =
                afterRow?.created_at || beforeRow?.created_at || null;
              if (orderCreatedAt) {
                try {
                  const { data: dup } = await supabase
                    .from("loyalty_history")
                    .select("op,amount,created_at")
                    .eq("user_id", userId)
                    .eq("op", "refund")
                    .eq("amount", ptsRedeemed)
                    .gte("created_at", orderCreatedAt)
                    .limit(1);
                  if (Array.isArray(dup) && dup.length > 0) {
                    return res.status(200).json(afterRow);
                  }
                } catch (_) {}
              }

              const nextPts = currentPts + ptsRedeemed;
              const { data: updatedPts, error: upErr } = await supabase
                .from("loyalty_points")
                .upsert({ id: userId, email, points: nextPts })
                .select("points")
                .single();
              if (upErr) throw upErr;

              // Write history as refund
              await supabase.from("loyalty_history").insert({
                user_id: userId,
                email,
                op: "refund",
                amount: ptsRedeemed,
                points_before: currentPts,
                points_after: nextPts,
              });
            }
          }
        }
      } catch (e) {
        // Do not fail order update if refund fails; log via console
        console.error("refund failed", e);
      }

      return res.status(200).json(afterRow);
    }

    if (req.method === "DELETE") {
      const admin = await requireAdmin(req, res);
      if (!admin) return;
      const id =
        (req.query &&
          (req.query.id ||
            (Array.isArray(req.query.id) ? req.query.id[0] : undefined))) ||
        (req.body && req.body.id);
      if (!id) return res.status(400).json({ message: "Missing id" });
      const { error } = await supabase.from("orders").delete().eq("id", id);
      if (error) throw error;
      return res.status(204).end();
    }

    return res.status(405).json({ message: "Method Not Allowed" });
  } catch (e) {
    return res.status(500).json({ message: e.message || "Unexpected error" });
  }
}
