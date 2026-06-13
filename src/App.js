import { useState, useRef, useEffect } from "react";
import Legal from "./Legal";
import Auth from "./Auth";
import { supabase } from "./supabaseClient";

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

const C = {
  bg: "#fafaf9", card: "#ffffff", border: "#e7e5e4", borderFocus: "#16a34a",
  text: "#1c1917", textSoft: "#57534e", textMuted: "#a8a29e",
  green: "#16a34a", greenDark: "#15803d", greenSoft: "#f0fdf4", greenBorder: "#bbf7d0",
  red: "#dc2626", redSoft: "#fef2f2", redBorder: "#fecaca",
};

function Logo({ size = 30 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
      <path d="M12 12V9a6 6 0 0 1 12 0v3" stroke="#16a34a" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <rect x="5" y="11" width="26" height="21" rx="5" fill="#16a34a" />
      <path d="M13.5 21.5l3.5 3.5 6.5-7" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function resizeImage(file, maxSize = 800) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onload = (e) => { img.src = e.target.result; };
    reader.onerror = reject;
    img.onload = () => {
      let { width, height } = img;
      if (width > maxSize || height > maxSize) {
        const scale = maxSize / Math.max(width, height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }
      const canvas = document.createElement("canvas");
      canvas.width = width; canvas.height = height;
      canvas.getContext("2d").drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", 0.8).split(",")[1]);
    };
    img.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    const el = document.createElement("textarea");
    el.value = text; document.body.appendChild(el); el.select();
    document.execCommand("copy"); document.body.removeChild(el);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy}
      style={{ padding: "7px 16px", background: copied ? C.greenSoft : "#fff", border: `1px solid ${copied ? C.greenBorder : C.border}`, borderRadius: 8, color: copied ? C.greenDark : C.textSoft, fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.15s" }}>
      {copied ? "Copied ✓" : "Copy"}
    </button>
  );
}

const FEATURES = [
  { title: "SEO Product Copy", desc: "Meta titles, descriptions and full blog posts — tuned to rank on Google and convert visitors into buyers.",
    icon: (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>) },
  { title: "Customer FAQs", desc: "Five realistic questions your buyers actually ask — answered before they hit your support inbox.",
    icon: (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>) },
  { title: "Ready-to-run Ads", desc: "Facebook, Instagram and TikTok ad copy with hooks and CTAs — paste straight into your ad manager.",
    icon: (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 11l18-5v12L3 14v-3z" /><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" /></svg>) },
];

export default function App() {
  const [productName, setProductName] = useState("");
  const [productDetails, setProductDetails] = useState("");
  const [imageData, setImageData] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeSection, setActiveSection] = useState("product");
  const [legalPage, setLegalPage] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const [session, setSession] = useState(null);
  const [isPro, setIsPro] = useState(false);
  const [limitReached, setLimitReached] = useState(false);
  const fileInputRef = useRef(null);

  // Track login session
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setShowAuth(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // Load Pro status when logged in
  useEffect(() => {
    if (!session?.user) { setIsPro(false); return; }
    supabase.from("profiles").select("is_pro").eq("id", session.user.id).single()
      .then(({ data }) => setIsPro(!!data?.is_pro));
  }, [session]);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Please upload an image file."); return; }
    if (file.size > 10 * 1024 * 1024) { setError("Image must be under 10 MB."); return; }
    setError("");
    try {
      const base64 = await resizeImage(file);
      setImageData(base64);
      setImagePreview(`data:image/jpeg;base64,${base64}`);
    } catch { setError("Couldn't read that image. Try another one."); }
  };

  const removeImage = () => {
    setImageData(null); setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const callAPI = async (tool) => {
    const userContent = imageData
      ? [
          { type: "image", source: { type: "base64", media_type: "image/jpeg", data: imageData } },
          { type: "text", text: `Product Name: ${productName}\nDetails: ${productDetails || "See image for details."}` },
        ]
      : `Product Name: ${productName}\nDetails: ${productDetails || "No additional details provided."}`;

    const headers = { "Content-Type": "application/json" };
    if (session?.access_token) headers["Authorization"] = `Bearer ${session.access_token}`;

    const response = await fetch("/api/generate", {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: "claude-sonnet-4-5-20250929",
        max_tokens: 1000,
        system: PROMPTS[tool],
        messages: [{ role: "user", content: userContent }],
      }),
    });

    if (response.status === 429) {
      const data = await response.json();
      const err = new Error(data.error || "Limit reached.");
      err.isLimit = true;
      throw err;
    }
    if (!response.ok) throw new Error("Something went wrong. Please try again.");

    const data = await response.json();
    const text = data.content?.map((i) => i.text || "").join("") || "";
    const clean = text.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  };

  const handleGenerate = async () => {
    if (!productName.trim()) { setError("Please enter a product name."); return; }
    setLoading(true); setError(""); setResults(null); setLimitReached(false);
    try {
      const [product, faq, adcopy] = await Promise.all([callAPI("product"), callAPI("faq"), callAPI("adcopy")]);
      setResults({ product, faq, adcopy });
      setActiveSection("product");
    } catch (e) {
      if (e.isLimit) {
        setError(e.message);
        setLimitReached(true);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsPro(false);
  };

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

  if (legalPage) return <Legal page={legalPage} onBack={() => setLegalPage(null)} />;
  if (showAuth) return <Auth onBack={() => setShowAuth(false)} />;

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', sans-serif" }}>

      <nav style={{ background: "#fff", borderBottom: `1px solid ${C.border}`, padding: "0 20px" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 68, gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 11, flexShrink: 0 }}>
            <Logo />
            <span style={{ fontWeight: 800, fontSize: 21, letterSpacing: "-0.02em" }}>ShopCopy</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginLeft: "auto" }}>
            {session ? (
              <>
                {isPro && <span style={{ fontSize: 12, fontWeight: 700, color: C.greenDark, background: C.greenSoft, border: `1px solid ${C.greenBorder}`, padding: "4px 10px", borderRadius: 100 }}>PRO</span>}
                <button onClick={handleLogout} style={{ padding: "9px 18px", background: "#fff", color: C.text, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Log out</button>
              </>
            ) : (
              <>
                <button onClick={() => setShowAuth(true)} style={{ background: "none", border: "none", color: C.text, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Log in</button>
                <button onClick={() => setShowAuth(true)} style={{ padding: "9px 20px", background: C.text, color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer", flexShrink: 0 }}>Upgrade</button>
              </>
            )}
          </div>
        </div>
      </nav>

      <main style={{ maxWidth: 1080, margin: "0 auto", padding: "56px 20px 80px" }}>

        <div style={{ textAlign: "center", marginBottom: 44 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 7, background: C.greenSoft, border: `1px solid ${C.greenBorder}`, borderRadius: 100, padding: "6px 14px", fontSize: 13, fontWeight: 600, color: C.greenDark, marginBottom: 22 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Built for Shopify stores
          </div>
          <h1 style={{ fontSize: "clamp(32px, 5vw, 50px)", fontWeight: 800, lineHeight: 1.1, margin: "0 0 14px", letterSpacing: "-0.03em" }}>
            Product copy that sells.<br /><span style={{ color: C.green }}>Written in seconds.</span>
          </h1>
          <p style={{ color: C.textSoft, fontSize: 17, lineHeight: 1.6, margin: 0, maxWidth: 480, marginLeft: "auto", marginRight: "auto" }}>
            Enter your product once — get SEO meta tags, descriptions, FAQs and ready-to-run ads. All at once.
          </p>
        </div>

        <div style={{ maxWidth: 680, margin: "0 auto 24px", background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: "28px", boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)" }}>
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 7 }}>Product name <span style={{ color: C.red }}>*</span></label>
            <input value={productName} onChange={(e) => setProductName(e.target.value)} placeholder="e.g. Posture Corrector Belt" style={inputStyle}
              onFocus={(e) => { e.target.style.borderColor = C.borderFocus; e.target.style.boxShadow = `0 0 0 3px ${C.greenSoft}`; }}
              onBlur={(e) => { e.target.style.borderColor = C.border; e.target.style.boxShadow = "none"; }} />
          </div>
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 7 }}>Product details <span style={{ color: C.textMuted, fontWeight: 400 }}>(optional)</span></label>
            <textarea value={productDetails} onChange={(e) => setProductDetails(e.target.value)} placeholder="e.g. adjustable, breathable, fits all sizes, targets office workers" rows={4}
              style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }}
              onFocus={(e) => { e.target.style.borderColor = C.borderFocus; e.target.style.boxShadow = `0 0 0 3px ${C.greenSoft}`; }}
              onBlur={(e) => { e.target.style.borderColor = C.border; e.target.style.boxShadow = "none"; }} />
          </div>

          <div style={{ marginBottom: 22 }}>
            <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 7 }}>Product photo <span style={{ color: C.textMuted, fontWeight: 400 }}>(optional — improves accuracy)</span></label>
            {!imagePreview ? (
              <button onClick={() => fileInputRef.current?.click()}
                style={{ width: "100%", padding: "20px", background: "#fafaf9", border: `1.5px dashed ${C.border}`, borderRadius: 10, color: C.textSoft, fontSize: 14, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 9 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></svg>
                Upload a product photo
              </button>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 14, padding: 12, background: "#fafaf9", border: `1px solid ${C.border}`, borderRadius: 10 }}>
                <img src={imagePreview} alt="Product" style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 8, border: `1px solid ${C.border}` }} />
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: C.text }}>Photo attached</p>
                  <p style={{ margin: "2px 0 0", fontSize: 13, color: C.textMuted }}>AI will use visual details in your copy</p>
                </div>
                <button onClick={removeImage} style={{ padding: "7px 14px", background: "#fff", border: `1px solid ${C.border}`, borderRadius: 8, color: C.textSoft, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Remove</button>
              </div>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} style={{ display: "none" }} />
          </div>

          {error && <div style={{ background: C.redSoft, border: `1px solid ${C.redBorder}`, borderRadius: 10, padding: "11px 14px", color: C.red, fontSize: 14, marginBottom: 16, fontWeight: 500 }}>{error}</div>}

          <button onClick={handleGenerate} disabled={loading}
            style={{ width: "100%", padding: "15px", background: C.green, border: "none", borderRadius: 10, color: "#fff", fontSize: 16, fontWeight: 700, cursor: loading ? "default" : "pointer", opacity: loading ? 0.75 : 1, boxShadow: "0 1px 2px rgba(22,163,74,0.3)" }}>
            {loading ? "Generating your content..." : "Generate all content"}
          </button>
          <p style={{ textAlign: "center", fontSize: 13, color: C.textMuted, margin: "14px 0 0" }}>
            {isPro ? "Pro — 200 generations per month" : "Free to try · Results in ~10 seconds"}
          </p>
        </div>

        {results && (
          <div style={{ maxWidth: 680, margin: "0 auto 24px", background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)" }}>
            <div style={{ display: "flex", borderBottom: `1px solid ${C.border}`, background: "#fafaf9" }}>
              {sectionTabs.map((tab) => (
                <button key={tab.key} onClick={() => setActiveSection(tab.key)}
                  style={{ flex: 1, padding: "15px 8px", background: activeSection === tab.key ? "#fff" : "transparent", border: "none", borderBottom: activeSection === tab.key ? `2px solid ${C.green}` : "2px solid transparent", color: activeSection === tab.key ? C.text : C.textMuted, fontSize: 14, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>
                  {tab.label}
                </button>
              ))}
            </div>
            <div style={{ padding: 28 }}>
              {activeSection === "product" && (
                <div>
                  {[{ key: "metaTitle", label: "Meta Title", limit: 60 }, { key: "metaDescription", label: "Meta Description", limit: 155 }, { key: "productDescription", label: "Product Description" }, { key: "blogPost", label: "Blog Post" }].map((field, i, arr) => (
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
                  {[{ key: "facebook", label: "Facebook Ad" }, { key: "instagram", label: "Instagram Ad" }, { key: "tiktok", label: "TikTok Ad" }].map((ad, i, arr) => (
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

        {limitReached && !isPro && (
          <div style={{ maxWidth: 680, margin: "0 auto 24px", background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 32, textAlign: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            <Logo size={38} />
            <h3 style={{ margin: "14px 0 8px", fontSize: 20, fontWeight: 800, letterSpacing: "-0.02em" }}>Want more generations?</h3>
            <p style={{ color: C.textSoft, fontSize: 15, margin: "0 0 22px" }}>Upgrade to Pro for 200 generations per month for your whole store.</p>
            <button onClick={() => setShowAuth(true)} style={{ padding: "13px 32px", background: C.green, border: "none", borderRadius: 10, color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", boxShadow: "0 1px 2px rgba(22,163,74,0.3)" }}>
              Upgrade to Pro — $29/mo
            </button>
            <p style={{ fontSize: 13, color: C.textMuted, margin: "12px 0 0" }}>Cancel anytime</p>
          </div>
        )}

        <div style={{ marginTop: 56 }}>
          <h2 style={{ textAlign: "center", fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em", margin: "0 0 10px" }}>Everything your store needs</h2>
          <p style={{ textAlign: "center", color: C.textSoft, fontSize: 15, margin: "0 0 36px" }}>One product input. Three types of high-converting content.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20 }}>
            {FEATURES.map((f) => (
              <div key={f.title} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: "26px 24px", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: C.greenSoft, border: `1px solid ${C.greenBorder}`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>{f.icon}</div>
                <h3 style={{ fontSize: 17, fontWeight: 700, margin: "0 0 8px", letterSpacing: "-0.01em" }}>{f.title}</h3>
                <p style={{ color: C.textSoft, fontSize: 14.5, lineHeight: 1.65, margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <footer style={{ textAlign: "center", marginTop: 64, color: C.textMuted, fontSize: 13 }}>
          <div style={{ display: "flex", gap: 18, justifyContent: "center", marginBottom: 12, flexWrap: "wrap" }}>
            <button onClick={() => setLegalPage("imprint")} style={{ background: "none", border: "none", color: C.textSoft, fontSize: 13, cursor: "pointer", fontWeight: 500, padding: 0 }}>Imprint</button>
            <button onClick={() => setLegalPage("privacy")} style={{ background: "none", border: "none", color: C.textSoft, fontSize: 13, cursor: "pointer", fontWeight: 500, padding: 0 }}>Privacy Policy</button>
          </div>
          <p style={{ margin: 0 }}>© 2026 ShopCopy · Not affiliated with Shopify Inc.</p>
        </footer>
      </main>

      <style>{`* { box-sizing: border-box; } body { margin: 0; }`}</style>
    </div>
  );
}