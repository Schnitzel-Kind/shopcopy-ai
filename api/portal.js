import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Identify the logged-in user from the Bearer token
  const authHeader = req.headers["authorization"] || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Not logged in." });

  const { data: userData, error: userErr } = await supabase.auth.getUser(token);
  if (userErr || !userData?.user) {
    return res.status(401).json({ error: "Not logged in." });
  }
  const user = userData.user;

  try {
    // Look up the Stripe customer id stored for this user
    const { data: profile, error: pErr } = await supabase
      .from("profiles").select("stripe_customer_id").eq("id", user.id).single();
    if (pErr) return res.status(500).json({ error: "Could not load profile." });

    if (!profile?.stripe_customer_id) {
      return res.status(400).json({ error: "No subscription found for this account." });
    }

    // Create a Stripe Billing Portal session and return its URL
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: "https://www.shopcopyai.co",
    });

    return res.status(200).json({ url: portalSession.url });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}