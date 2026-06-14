import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const FREE_IP_DAILY = 2;
const GLOBAL_FREE_DAILY = 30;
const PRO_MONTHLY = 200;
const IMAGE_WEIGHT = 2;

const PROMPTS = {
  product: `You are an expert Shopify SEO copywriter. If a product image is provided, use visual details (colors, materials, style) in your copy. Respond ONLY with a valid JSON object, no markdown, no backticks:
{"metaTitle":"...","metaDescription":"...","productDescription":"...","blogPost":"..."}
Rules:
- metaTitle: max 60 chars
- metaDescription: max 155 chars, include CTA
- productDescription: 3-4 sentences, benefit-focused
- blogPost: 200-250 words, SEO-friendly, include **Headings**`,
  faq: `You are a Shopify product expert. If a product image is provided, use visual details to make FAQs more specific. Respond ONLY with a valid JSON object, no markdown, no backticks:
{"faqs":[{"question":"...","answer":"..."},{"question":"...","answer":"..."},{"question":"...","answer":"..."},{"question":"...","answer":"..."},{"question":"...","answer":"..."}]}
Generate 5 realistic customer FAQs with helpful answers.`,
  adcopy: `You are an expert paid social media copywriter. If a product image is provided, reference its visual appeal. Respond ONLY with a valid JSON object, no markdown, no backticks:
{"facebook":"...","instagram":"...","tiktok":"..."}
Rules:
- facebook: 2-3 sentences, hook + benefit + CTA, max 200 chars
- instagram: punchy, emoji-friendly, max 150 chars, strong CTA
- tiktok: casual Gen-Z tone, scroll-stopping hook first, conversational, max 150 chars, feels native not like an ad`,
};

const BRAND_VOICES = {
  professional: "Write in a professional, trustworthy and competent tone. Sound credible and reassuring. Avoid slang and excessive excitement.",
  friendly: "Write in a friendly, warm and casual tone. Address the customer directly and personally, like a helpful friend.",
  bold: "Write in a bold, energetic and motivating tone. Use strong, punchy language and create excitement and urgency.",
  luxury: "Write in an elegant, premium and sophisticated tone. Emphasise quality, exclusivity and craftsmanship. Refined word choice.",
  playful: "Write in a playful, fun and humorous tone. Light-hearted, witty, emoji-friendly where it fits naturally.",
  minimal: "Write in a minimal, clean and concise tone. Short sentences, no fluff, no exaggeration. Calm and clear.",
};

function getClientIp(req) {
  const fwd = req.headers["x-forwarded-for"];
  if (fwd) return fwd.split(",")[0].trim();
  return req.socket?.remoteAddress || "unknown";
}
function today() { return new Date().toISOString().slice(0, 10); }
function thisMonth() { return new Date().toISOString().slice(0, 7); }

async function askClaude(systemPrompt, userContent) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 1000,
      system: systemPrompt,
      messages: [{ role: "user", content: userContent }],
    }),
  });
  const data = await response.json();
  const text = data.content?.map((i) => i.text || "").join("") || "";
  const clean = text.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { productName, productDetails, imageData } = req.body || {};
  if (!productName || !productName.trim()) {
    return res.status(400).json({ error: "Product name is required." });
  }

  const weight = imageData ? IMAGE_WEIGHT : 1;
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
    let isProUser = false;
    let brandVoice = null;

    if (user) {
      const { data: profile, error: pErr } = await supabase
        .from("profiles").select("is_pro, usage_count, usage_month, brand_voice")
        .eq("id", user.id).single();
      if (pErr) return res.status(500).json({ error: "Could not load profile." });

      if (profile.is_pro) {
        isProUser = true;
        if (profile.brand_voice && BRAND_VOICES[profile.brand_voice]) {
          brandVoice = BRAND_VOICES[profile.brand_voice];
        }
        let used = profile.usage_count || 0;
        if (profile.usage_month !== month) used = 0;
        if (used + weight > PRO_MONTHLY) {
          return res.status(429).json({ error: "You've reached your monthly fair-use limit (200 generations). Contact us if you need more." });
        }
        const { error: upErr } = await supabase
          .from("profiles").update({ usage_count: used + weight, usage_month: month })
          .eq("id", user.id);
        if (upErr) return res.status(500).json({ error: "Could not update usage." });
      }
    }

    if (!isProUser) {
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
    }

    const voiceSuffix = brandVoice ? `\n\nBRAND VOICE — apply this style to everything you write: ${brandVoice}` : "";

    const userContent = imageData
      ? [
          { type: "image", source: { type: "base64", media_type: "image/jpeg", data: imageData } },
          { type: "text", text: `Product Name: ${productName}\nDetails: ${productDetails || "See image for details."}` },
        ]
      : `Product Name: ${productName}\nDetails: ${productDetails || "No additional details provided."}`;

    const [product, faq, adcopy] = await Promise.all([
      askClaude(PROMPTS.product + voiceSuffix, userContent),
      askClaude(PROMPTS.faq + voiceSuffix, userContent),
      askClaude(PROMPTS.adcopy + voiceSuffix, userContent),
    ]);

    return res.status(200).json({ product, faq, adcopy });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}