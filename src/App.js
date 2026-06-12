import { useState } from "react";

const FREE_LIMIT = 3;

const PROMPTS = {
  product: `You are an expert Shopify SEO copywriter. Respond ONLY with a valid JSON object, no markdown, no backticks:
{"metaTitle":"...","metaDescription":"...","productDescription":"...","blogPost":"..."}
Rules:
- metaTitle: max 60 chars
- metaDescription: max 155 chars, include CTA
- productDescription: 3-4 sentences, benefit-focused
- blogPost: 200-250 words, SEO-friendly, include **Headings**`,
  faq: `You are a Shopify product expert. Respond ONLY with a valid JSON object, no markdown, no backticks:
{"faqs":[{"question":"...","answer":"..."},{"question":"...","answer":"..."},{"question":"...","answer":"..."},{"question":"...","answer":"..."},{"question":"...","answer":"..."}]}
Generate 5 realistic customer FAQs with helpful answers.`,
  adcopy: `You are an expert paid social media copywriter. Respond ONLY with a valid JSON object, no markdown, no backticks:
{"facebook":"...","instagram":"..."}
Rules:
- facebook: 2-3 sentences, hook + benefit + CTA, max 200 chars
- instagram: punchy, emoji-friendly, max 150 chars, strong CTA`,
};

// Design tokens — trust-building SaaS palette
const C = {
  bg: "#fafaf9",
  card: "#ffffff",
  border: "#e7e5e4",
  borderFocus: "#16a34a",
  text: "#1c1917",
  textSoft: "#57534e",
  textMuted: "#a8a29e",
  green: "#16a34a",
  greenDark: "#15803d",
  greenSoft: "#f0fdf4",
  greenBorder: "#bbf7d0",
  red: "#dc2626",
  redSoft: "#fef2f2",
  redBorder: "#fecaca",
};

function Logo({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect x="2" y="6" width="28" height="22" rx="5" fill="#16a34a" />
      <path d="M10 6V5a6 6 0 0 1 12 0v1" stroke="#16a34a" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M11.5 17.5l3 3 6-6.5" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    const el = document.createElement("textarea");
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand("copy");
    document.body.removeChild(el);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy}
      style={{ padding: "7px 16px", background: copied ? C.greenSoft : "#fff", border: `1px solid ${copied ? C.greenBorder : C.border}`, borderRadius: 8, color: copied ? C.greenDark : C.textSoft, fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.15s" }}>
      {copied ? "Copied ✓" : "Copy"}
    </button>
  );
}

export default function App() {
  const [productName, setProductName] = useState("");
  const [productDetails, setProductDetails] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [usageCount, setUsageCount] = useState(0);
  const [activeSection, setActiveSection] = useState("product");

  const callAPI = async (tool) => {
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-5-20250929",
        max_tokens: 1000,
        system: PROMPTS[tool],
        messages: [{ role: "user", content: `Product Name: ${productName}\nDetails: ${productDetails || "No additional details provided."}` }],
      }),
    });
    const data = await response.json();
    const text = data.content?.map((i) => i.text || "").join("") || "";
    const clean = text.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  };

  const handleGenerate = async () => {
    if (!productName.trim()) { setError("Please enter a product name."); return; }
    if (usageCount >= FREE_LIMIT) { setError("Free limit reached. Upgrade to Pro to continue."); return; }
    setLoading(true); setError(""); setResults(null);
    try {
      const [product, faq, adcopy] = await Promise.all([callAPI("product"), callAPI("faq"), callAPI("adcopy")]);
      setResults({ product, faq, adcopy });
      setUsageCount((c) => c + 1);
      setActiveSection("product");
    } catch (e) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const remaining = FREE_LIMIT - usageCount;
  const sectionTabs = [
    { key: "product", label: "Product Copy" },
    { key: "faq", label: "FAQs" },
    { key: "adcopy", label: "Ad Copy" },
  ];

  const inputStyle = {
    width: "100%", background: "#fff", border: `1px solid ${C.border}`, borderRadius: 10,
    padding: "12px 14px", color: C.text, fontSize: 15, outline: "none", boxSizing: "border-box",
    fontFamily: "inherit", transition: "border-color 0.15s, box-shadow 0.15s",
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', sans-serif" }}>

      {/* Nav */}
      <nav style={{ background: "#fff", borderBottom: `1px solid ${C.border}`, padding: "0 24px" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Logo />
            <span style={{ fontWeight: 700, fontSize: 17, letterSpacing: "-0.02em" }}>ShopCopy</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span style={{ fontSize: 13, color: C.textMuted, fontWeight: 500 }}>
              {remaining} free generation{remaining !== 1 ? "s" : ""} left
            </span>
            <button style={{ padding: "8px 18px", background: C.text, color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
              Upgrade
            </button>
          </div>
        </div>
      </nav>

      <main style={{ maxWidth: 720, margin: "0 auto", padding: "56px 20px 80px" }}>

        {/* Hero */}
        <div style={{ textAlign: "center", marginBottom: 44 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 7, background: C.greenSoft, border: `1px solid ${C.greenBorder}`, borderRadius: 100, padding: "6px 14px", fontSize: 13, fontWeight: 600, color: C.greenDark, marginBottom: 22 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Built for Shopify stores
          </div>
          <h1 style={{ fontSize: "clamp(30px, 5vw, 46px)", fontWeight: 800, lineHeight: 1.1, margin: "0 0 14px", letterSpacing: "-0.03em" }}>
            Product copy that sells.<br />
            <span style={{ color: C.green }}>Written in seconds.</span>
          </h1>
          <p style={{ color: C.textSoft, fontSize: 17, lineHeight: 1.6, margin: 0, maxWidth: 480, marginLeft: "auto", marginRight: "auto" }}>
            Enter your product once — get SEO meta tags, descriptions, FAQs and ready-to-run ads. All at once.
          </p>
        </div>

        {/* Input Card */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: "28px", marginBottom: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)" }}>
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 7 }}>
              Product name <span style={{ color: C.red }}>*</span>
            </label>
            <input value={productName} onChange={(e) => setProductName(e.target.value)}
              placeholder="e.g. Posture Corrector Belt"
              style={inputStyle}
              onFocus={(e) => { e.target.style.borderColor = C.borderFocus; e.target.style.boxShadow = `0 0 0 3px ${C.greenSoft}`; }}
              onBlur={(e) => { e.target.style.borderColor = C.border; e.target.style.boxShadow = "none"; }} />
          </div>
          <div style={{ marginBottom: 22 }}>
            <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 7 }}>
              Product details <span style={{ color: C.textMuted, fontWeight: 400 }}>(optional)</span>
            </label>
            <textarea value={productDetails} onChange={(e) => setProductDetails(e.target.value)}
              placeholder="e.g. adjustable, breathable, fits all sizes, targets office workers"
              rows={4}
              style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }}
              onFocus={(e) => { e.target.style.borderColor = C.borderFocus; e.target.style.boxShadow = `0 0 0 3px ${C.greenSoft}`; }}
              onBlur={(e) => { e.target.style.borderColor = C.border; e.target.style.boxShadow = "none"; }} />
          </div>

          {error && <div style={{ background: C.redSoft, border: `1px solid ${C.redBorder}`, borderRadius: 10, padding: "11px 14px", color: C.red, fontSize: 14, marginBottom: 16, fontWeight: 500 }}>{error}</div>}

          <button onClick={handleGenerate} disabled={loading || usageCount >= FREE_LIMIT}
            style={{ width: "100%", padding: "15px", background: usageCount >= FREE_LIMIT ? C.border : C.green, border: "none", borderRadius: 10, color: usageCount >= FREE_LIMIT ? C.textMuted : "#fff", fontSize: 16, fontWeight: 700, cursor: usageCount >= FREE_LIMIT ? "not-allowed" : "pointer", opacity: loading ? 0.75 : 1, transition: "background 0.15s", boxShadow: usageCount >= FREE_LIMIT ? "none" : "0 1px 2px rgba(22,163,74,0.3)" }}
            onMouseEnter={(e) => { if (!loading && usageCount < FREE_LIMIT) e.target.style.background = C.greenDark; }}
            onMouseLeave={(e) => { if (usageCount < FREE_LIMIT) e.target.style.background = C.green; }}>
            {loading ? "Generating your content..." : usageCount >= FREE_LIMIT ? "Free limit reached" : "Generate all content"}
          </button>

          <p style={{ textAlign: "center", fontSize: 13, color: C.textMuted, margin: "14px 0 0" }}>
            No credit card required · Results in ~10 seconds
          </p>
        </div>

        {/* Results */}
        {results && (
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)" }}>
            <div style={{ display: "flex", borderBottom: `1px solid ${C.border}`, background: "#fafaf9" }}>
              {sectionTabs.map((tab) => (
                <button key={tab.key} onClick={() => setActiveSection(tab.key)}
                  style={{ flex: 1, padding: "15px 8px", background: activeSection === tab.key ? "#fff" : "transparent", border: "none", borderBottom: activeSection === tab.key ? `2px solid ${C.green}` : "2px solid transparent", color: activeSection === tab.key ? C.text : C.textMuted, fontSize: 14, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.15s" }}>
                  {tab.label}
                </button>
              ))}
            </div>

            <div style={{ padding: 28 }}>
              {activeSection === "product" && (
                <div>
                  {[
                    { key: "metaTitle", label: "Meta Title", limit: 60 },
                    { key: "metaDescription", label: "Meta Description", limit: 155 },
                    { key: "productDescription", label: "Product Description" },
                    { key: "blogPost", label: "Blog Post" },
                  ].map((field, i, arr) => (
                    <div key={field.key} style={{ marginBottom: 26, paddingBottom: 26, borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : "none" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: C.text, textTransform: "uppercase", letterSpacing: "0.05em" }}>{field.label}</span>
                        {field.limit && <span style={{ fontSize: 12, color: results.product[field.key]?.length > field.limit ? C.red : C.green, fontWeight: 600 }}>{results.product[field.key]?.length}/{field.limit}</span>}
                      </div>
                      <p style={{ color: C.textSoft, fontSize: 15, lineHeight: 1.7, margin: "0 0 14px", whiteSpace: "pre-wrap" }}>{results.product[field.key]}</p>
                      <CopyButton text={results.product[field.key] || ""} />
                    </div>
                  ))}
                </div>
              )}

              {activeSection === "faq" && (
                <div>
                  {results.faq.faqs?.map((faq, i) => (
                    <div key={i} style={{ marginBottom: 22, paddingBottom: 22, borderBottom: i < results.faq.faqs.length - 1 ? `1px solid ${C.border}` : "none" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 7 }}>
                        <p style={{ color: C.text, fontWeight: 700, fontSize: 15, margin: 0, flex: 1 }}>{faq.question}</p>
                        <CopyButton text={`Q: ${faq.question}\nA: ${faq.answer}`} />
                      </div>
                      <p style={{ color: C.textSoft, fontSize: 15, lineHeight: 1.7, margin: 0 }}>{faq.answer}</p>
                    </div>
                  ))}
                  <div style={{ marginTop: 18, paddingTop: 18, borderTop: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 10 }}>
                    <CopyButton text={results.faq.faqs?.map(f => `Q: ${f.question}\nA: ${f.answer}`).join("\n\n") || ""} />
                    <span style={{ fontSize: 13, color: C.textMuted }}>Copy all FAQs at once</span>
                  </div>
                </div>
              )}

              {activeSection === "adcopy" && (
                <div>
                  {[{ key: "facebook", label: "Facebook Ad" }, { key: "instagram", label: "Instagram Ad" }].map((ad, i, arr) => (
                    <div key={ad.key} style={{ marginBottom: 26, paddingBottom: 26, borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : "none" }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: C.text, textTransform: "uppercase", letterSpacing: "0.05em" }}>{ad.label}</span>
                      <p style={{ color: C.textSoft, fontSize: 15, lineHeight: 1.7, margin: "10px 0 14px", whiteSpace: "pre-wrap" }}>{results.adcopy[ad.key]}</p>
                      <CopyButton text={results.adcopy[ad.key] || ""} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Upgrade CTA */}
        {usageCount >= FREE_LIMIT && (
          <div style={{ marginTop: 24, background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 32, textAlign: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            <Logo size={36} />
            <h3 style={{ margin: "14px 0 8px", fontSize: 20, fontWeight: 800, letterSpacing: "-0.02em" }}>You've used your free generations</h3>
            <p style={{ color: C.textSoft, fontSize: 15, margin: "0 0 22px" }}>Get unlimited generations for your whole store.</p>
            <button style={{ padding: "13px 32px", background: C.green, border: "none", borderRadius: 10, color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", boxShadow: "0 1px 2px rgba(22,163,74,0.3)" }}>
              Upgrade to Pro — $29/mo
            </button>
            <p style={{ fontSize: 13, color: C.textMuted, margin: "12px 0 0" }}>Cancel anytime</p>
          </div>
        )}

        {/* Footer */}
        <footer style={{ textAlign: "center", marginTop: 56, color: C.textMuted, fontSize: 13 }}>
          <p style={{ margin: 0 }}>© 2026 ShopCopy · Not affiliated with Shopify Inc.</p>
        </footer>
      </main>

      <style>{`* { box-sizing: border-box; } body { margin: 0; }`}</style>
    </div>
  );
}