

const C = {
  bg: "#fafaf9", card: "#ffffff", border: "#e7e5e4", text: "#1c1917",
  textSoft: "#57534e", textMuted: "#a8a29e", green: "#16a34a",
};

export default function Legal({ page, onBack }) {
  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', sans-serif" }}>
      <nav style={{ background: "#fff", borderBottom: `1px solid ${C.border}`, padding: "0 20px" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", display: "flex", alignItems: "center", height: 68 }}>
          <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer", color: C.text, fontSize: 15, fontWeight: 600, padding: 0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            Back to ShopCopy
          </button>
        </div>
      </nav>

      <main style={{ maxWidth: 720, margin: "0 auto", padding: "56px 20px 80px", lineHeight: 1.7, color: C.textSoft, fontSize: 15 }}>
        {page === "imprint" ? (
          <div>
            <h1 style={{ color: C.text, fontSize: 32, fontWeight: 800, marginBottom: 28, letterSpacing: "-0.02em" }}>Imprint / Impressum</h1>
            <p style={{ margin: "0 0 6px" }}><strong style={{ color: C.text }}>Responsible for content:</strong></p>
            <p style={{ margin: "0 0 4px" }}>Leon Sadiku</p>
            <p style={{ margin: "0 0 4px" }}>Weiherstrasse 20</p>
            <p style={{ margin: "0 0 4px" }}>8280 Kreuzlingen</p>
            <p style={{ margin: "0 0 20px" }}>Switzerland</p>
            <p style={{ margin: "0 0 6px" }}><strong style={{ color: C.text }}>Contact:</strong></p>
            <p style={{ margin: "0 0 24px" }}>Email: leonsa2825@gmail.com</p>
            <p style={{ margin: "0 0 8px" }}>ShopCopy is an independent service and is not affiliated with, endorsed by, or sponsored by Shopify Inc.</p>
            <p style={{ fontSize: 13, color: C.textMuted, marginTop: 32 }}>Last updated: June 2026</p>
          </div>
        ) : (
          <div>
            <h1 style={{ color: C.text, fontSize: 32, fontWeight: 800, marginBottom: 28, letterSpacing: "-0.02em" }}>Privacy Policy</h1>

            <h2 style={{ color: C.text, fontSize: 19, fontWeight: 700, margin: "28px 0 10px" }}>Who we are</h2>
            <p style={{ margin: "0 0 16px" }}>ShopCopy is operated by Leon Sadiku, Weiherstrasse 20, 8280 Kreuzlingen, Switzerland. Contact: leonsa2825@gmail.com.</p>

            <h2 style={{ color: C.text, fontSize: 19, fontWeight: 700, margin: "28px 0 10px" }}>What data we process</h2>
            <p style={{ margin: "0 0 16px" }}>When you use ShopCopy, the product information and any images you submit are sent to our AI provider (Anthropic) to generate your content. We do not sell your data. We do not require an account to use the free version.</p>

            <h2 style={{ color: C.text, fontSize: 19, fontWeight: 700, margin: "28px 0 10px" }}>Local storage</h2>
            <p style={{ margin: "0 0 16px" }}>We store a small counter in your browser to track how many free generations you have used. This stays on your device and is not shared.</p>

            <h2 style={{ color: C.text, fontSize: 19, fontWeight: 700, margin: "28px 0 10px" }}>Third-party services</h2>
            <p style={{ margin: "0 0 16px" }}>We use Anthropic to generate content and Vercel to host this website. These providers may process technical data such as your IP address as part of delivering the service.</p>

            <h2 style={{ color: C.text, fontSize: 19, fontWeight: 700, margin: "28px 0 10px" }}>Your rights</h2>
            <p style={{ margin: "0 0 16px" }}>You may contact us at any time at leonsa2825@gmail.com to ask what data we hold about you or to request deletion.</p>

            <p style={{ fontSize: 13, color: C.textMuted, marginTop: 32 }}>Last updated: June 2026</p>
          </div>
        )}
      </main>
    </div>
  );
}