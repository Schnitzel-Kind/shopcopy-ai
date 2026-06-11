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

const gold = "linear-gradient(135deg, #f5c842 0%, #fff8e1 60%, #ffffff 100%)";
const goldSolid = "#f5c842";

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
      style={{ padding: "7px 14px", background: copied ? "#1a2e1a" : "#1e1e1e", border: `1px solid ${copied ? "#34d399" : "#333"}`, borderRadius: 7, color: copied ? "#34d399" : goldSolid, fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 0.2s" }}>
      {copied ? "Copied! ✓" : "Copy"}
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
    { key: "faq", label: "FAQ Generator" },
    { key: "adcopy", label: "Ad Copy" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", color: "#f0f0f0", fontFamily: "'Inter', system-ui, sans-serif", display: "flex", flexDirection: "column", alignItems: "center", padding: "48px 16px" }}>
      <div style={{ textAlign: "center", marginBottom: "40px", maxWidth: 580 }}>
        <div style={{ display: "inline-block", background: gold, borderRadius: 8, padding: "6px 14px", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#0a0a0a", marginBottom: 20 }}>
          Free — {remaining} generation{remaining !== 1 ? "s" : ""} left
        </div>
        <h1 style={{ fontSize: "clamp(28px, 5vw, 44px)", fontWeight: 800, lineHeight: 1.15, margin: "0 0 16px", background: gold, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          Shopify Copy.<br />Written in seconds.
        </h1>
        <p style={{ color: "#888", fontSize: 16, lineHeight: 1.6, margin: 0 }}>
          One click — get product copy, FAQs, and ads all at once.
        </p>
      </div>

      <div style={{ width: "100%", maxWidth: 580, background: "#141414", border: "1px solid #222", borderRadius: 16, padding: "28px", marginBottom: 24 }}>
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#aaa", marginBottom: 8, letterSpacing: "0.04em", textTransform: "uppercase" }}>Product Name *</label>
          <input value={productName} onChange={(e) => setProductName(e.target.value)}
            placeholder="e.g. Posture Corrector Belt"
            style={{ width: "100%", background: "#0a0a0a", border: "1px solid #2a2a2a", borderRadius: 10, padding: "12px 14px", color: "#f0f0f0", fontSize: 15, outline: "none", boxSizing: "border-box" }}
            onFocus={(e) => e.target.style.borderColor = goldSolid}
            onBlur={(e) => e.target.style.borderColor = "#2a2a2a"} />
        </div>
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#aaa", marginBottom: 8, letterSpacing: "0.04em", textTransform: "uppercase" }}>Product Details</label>
          <textarea value={productDetails} onChange={(e) => setProductDetails(e.target.value)}
            placeholder="e.g. adjustable, breathable, fits all sizes, targets office workers"
            rows={4}
            style={{ width: "100%", background: "#0a0a0a", border: "1px solid #2a2a2a", borderRadius: 10, padding: "12px 14px", color: "#f0f0f0", fontSize: 15, outline: "none", resize: "vertical", boxSizing: "border-box", fontFamily: "inherit", lineHeight: 1.6 }}
            onFocus={(e) => e.target.style.borderColor = goldSolid}
            onBlur={(e) => e.target.style.borderColor = "#2a2a2a"} />
        </div>

        {error && <div style={{ background: "#1a0a0a", border: "1px solid #4a1010", borderRadius: 8, padding: "10px 14px", color: "#f87171", fontSize: 14, marginBottom: 16 }}>{error}</div>}

        <button onClick={handleGenerate} disabled={loading || usageCount >= FREE_LIMIT}
          style={{ width: "100%", padding: "14px", background: usageCount >= FREE_LIMIT ? "#1a1a1a" : gold, border: "none", borderRadius: 10, color: usageCount >= FREE_LIMIT ? "#444" : "#0a0a0a", fontSize: 15, fontWeight: 800, cursor: usageCount >= FREE_LIMIT ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>
          {loading ? "Generating all content..." : usageCount >= FREE_LIMIT ? "Upgrade to Continue" : "Generate All Content →"}
        </button>
      </div>

      {results && (
        <div style={{ width: "100%", maxWidth: 580, background: "#141414", border: "1px solid #222", borderRadius: 16, overflow: "hidden" }}>
          <div style={{ display: "flex", borderBottom: "1px solid #222" }}>
            {sectionTabs.map((tab) => (
              <button key={tab.key} onClick={() => setActiveSection(tab.key)}
                style={{ flex: 1, padding: "14px 8px", background: "none", border: "none", borderBottom: activeSection === tab.key ? `2px solid ${goldSolid}` : "2px solid transparent", color: activeSection === tab.key ? goldSolid : "#555", fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>
                {tab.label}
              </button>
            ))}
          </div>

          <div style={{ padding: 24 }}>
            {activeSection === "product" && (
              <div>
                {[
                  { key: "metaTitle", label: "Meta Title", limit: 60 },
                  { key: "metaDescription", label: "Meta Description", limit: 155 },
                  { key: "productDescription", label: "Product Description" },
                  { key: "blogPost", label: "Blog Post" },
                ].map((field, i, arr) => (
                  <div key={field.key} style={{ marginBottom: 24, paddingBottom: 24, borderBottom: i < arr.length - 1 ? "1px solid #1e1e1e" : "none" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: goldSolid, textTransform: "uppercase", letterSpacing: "0.06em" }}>{field.label}</span>
                      {field.limit && <span style={{ fontSize: 11, color: results.product[field.key]?.length > field.limit ? "#f87171" : "#34d399", fontWeight: 600 }}>{results.product[field.key]?.length}/{field.limit}</span>}
                    </div>
                    <p style={{ color: "#e0e0e0", fontSize: 14, lineHeight: 1.7, margin: "0 0 12px", whiteSpace: "pre-wrap" }}>{results.product[field.key]}</p>
                    <CopyButton text={results.product[field.key] || ""} />
                  </div>
                ))}
              </div>
            )}

            {activeSection === "faq" && (
              <div>
                {results.faq.faqs?.map((faq, i) => (
                  <div key={i} style={{ marginBottom: 20, paddingBottom: 20, borderBottom: i < results.faq.faqs.length - 1 ? "1px solid #1e1e1e" : "none" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                      <p style={{ color: goldSolid, fontWeight: 700, fontSize: 14, margin: 0, flex: 1 }}>Q: {faq.question}</p>
                      <CopyButton text={`Q: ${faq.question}\nA: ${faq.answer}`} />
                    </div>
                    <p style={{ color: "#e0e0e0", fontSize: 14, lineHeight: 1.7, margin: 0 }}>A: {faq.answer}</p>
                  </div>
                ))}
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid #1e1e1e" }}>
                  <CopyButton text={results.faq.faqs?.map(f => `Q: ${f.question}\nA: ${f.answer}`).join("\n\n") || ""} />
                  <span style={{ marginLeft: 10, fontSize: 12, color: "#666" }}>Copy all FAQs</span>
                </div>
              </div>
            )}

            {activeSection === "adcopy" && (
              <div>
                {[{ key: "facebook", label: "Facebook Ad" }, { key: "instagram", label: "Instagram Ad" }].map((ad, i, arr) => (
                  <div key={ad.key} style={{ marginBottom: 24, paddingBottom: 24, borderBottom: i < arr.length - 1 ? "1px solid #1e1e1e" : "none" }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: goldSolid, textTransform: "uppercase", letterSpacing: "0.06em" }}>{ad.label}</span>
                    <p style={{ color: "#e0e0e0", fontSize: 14, lineHeight: 1.7, margin: "10px 0 12px", whiteSpace: "pre-wrap" }}>{results.adcopy[ad.key]}</p>
                    <CopyButton text={results.adcopy[ad.key] || ""} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {usageCount >= FREE_LIMIT && (
        <div style={{ marginTop: 24, width: "100%", maxWidth: 580, background: "linear-gradient(135deg, #1a1200, #0f0c00)", border: `1px solid ${goldSolid}`, borderRadius: 16, padding: 28, textAlign: "center" }}>
          <div style={{ fontSize: 22, marginBottom: 8 }}>🚀</div>
          <h3 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 700 }}>You've hit the free limit</h3>
          <p style={{ color: "#888", fontSize: 14, margin: "0 0 20px" }}>Upgrade to Pro for unlimited generations — $29/month.</p>
          <button style={{ padding: "12px 28px", background: gold, border: "none", borderRadius: 10, color: "#0a0a0a", fontSize: 15, fontWeight: 800, cursor: "pointer" }}>
            Upgrade to Pro →
          </button>
        </div>
      )}

      <style>{`* { box-sizing: border-box; }`}</style>
    </div>
  );
}