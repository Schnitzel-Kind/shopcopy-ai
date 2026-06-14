import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const FREE_IP_DAILY = 2;
const GLOBAL_FREE_DAILY = 30;
const PRO_MONTHLY = 200;
const IMAGE_WEIGHT = 2;

function getClientIp(req) {
  const fwd = req.headers["x-forwarded-for"];
  if (fwd) return fwd.split(",")[0].trim();
  return req.socket?.remoteAddress || "unknown";
}

function today() {
  return new Date().toISOString().slice(0, 10);
}
function thisMonth() {
  return new Date().toISOString().slice(0, 7);
}

function requestHasImage(body) {
  try {
    const msgs = body.messages || [];
    for (const m of msgs) {
      if (Array.isArray(m.content)) {
        for (const block of m.content) {
          if (block.type === "image") return true;
        }
      }
    }
  } catch {}
  return false;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const weight = requestHasImage(req.body) ? IMAGE_WEIGHT : 1;
  const day = today();
  const month = thisMonth();

  const authHeader = req.headers["authorization"] || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  let user = null;
  if (token) {
    const { data, error } = await supabase.auth.getUser(token);
    if (!error && data?.user) user = data.user;
  }

  try {
    if (user) {
      const { data: profile, error: pErr } = await supabase
        .from("profiles")
        .select("is_pro, usage_count, usage_month")
        .eq("id", user.id)
        .single();

      if (pErr) {
        return res.status(500).json({ error: "Could not load profile." });
      }

      if (profile.is_pro) {
        let used = profile.usage_count || 0;
        if (profile.usage_month !== month) used = 0;

        if (used + weight > PRO_MONTHLY) {
          return res.status(429).json({ error: "You've reached your monthly fair-use limit (200 generations). Contact us if you need more." });
        }

        const { error: upErr } = await supabase
          .from("profiles")
          .update({ usage_count: used + weight, usage_month: month })
          .eq("id", user.id);
        if (upErr) return res.status(500).json({ error: "Could not update usage." });

        return await callAnthropic(req, res);
      }
    }

    const { data: globalCount, error: gErr } = await supabase
      .rpc("bump_global_usage", { p_day: day, p_weight: weight });
    if (gErr) return res.status(500).json({ error: "Usage check failed." });

    if (globalCount > GLOBAL_FREE_DAILY) {
      return res.status(429).json({ error: "Our free tier is at capacity for today. Please try again tomorrow or upgrade to Pro." });
    }

    const ip = getClientIp(req);
    const { data: ipCount, error: ipErr } = await supabase
      .rpc("bump_ip_usage", { p_ip: ip, p_day: day, p_weight: weight });
    if (ipErr) return res.status(500).json({ error: "Usage check failed." });

    if (ipCount > FREE_IP_DAILY) {
      return res.status(429).json({ error: "You've used your free generations for today. Upgrade to Pro for more." });
    }

    return await callAnthropic(req, res);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function callAnthropic(req, res) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(req.body),
  });
  const data = await response.json();
  return res.status(200).json(data);
}
