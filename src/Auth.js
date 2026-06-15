import { useState } from "react";
import { supabase } from "./supabaseClient";

const C = {
  bg: "#fafaf9", card: "#ffffff", border: "#e7e5e4", borderFocus: "#16a34a",
  text: "#1c1917", textSoft: "#57534e", textMuted: "#a8a29e",
  green: "#16a34a", greenDark: "#15803d", greenSoft: "#f0fdf4", greenBorder: "#bbf7d0",
  red: "#dc2626", redSoft: "#fef2f2", redBorder: "#fecaca",
};

function Logo({ size = 34 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
      <path d="M12 12V9a6 6 0 0 1 12 0v3" stroke="#16a34a" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <rect x="5" y="11" width="26" height="21" rx="5" fill="#16a34a" />
      <path d="M13.5 21.5l3.5 3.5 6.5-7" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Auth({ onBack }) {
  const [mode, setMode] = useState("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) { setError("Please enter email and password."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (mode === "signup" && password !== confirmPassword) { setError("Passwords don't match."); return; }
    setLoading(true); setError(""); setMessage("");

    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        // Try to log in immediately (works when email confirmation is off)
        const { error: loginErr } = await supabase.auth.signInWithPassword({ email, password });
        if (loginErr) {
          setMessage("Account created! You can now log in.");
          setMode("login");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (e) {
      setError(e.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: "100%", background: "#fff", border: `1px solid ${C.border}`, borderRadius: 10,
    padding: "12px 14px", color: C.text, fontSize: 15, outline: "none", boxSizing: "border-box",
    fontFamily: "inherit", marginBottom: 14, transition: "border-color 0.15s, box-shadow 0.15s",
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', sans-serif", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <Logo />
          <h1 style={{ fontSize: 26, fontWeight: 800, margin: "14px 0 6px", letterSpacing: "-0.02em" }}>
            {mode === "signup" ? "Create your account" : "Welcome back"}
          </h1>
          <p style={{ color: C.textSoft, fontSize: 15, margin: 0 }}>
            {mode === "signup" ? "Start generating unlimited content" : "Log in to your ShopCopy account"}
          </p>
        </div>

        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 28, boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)" }}>
          <label style={{ display: "block", fontSize: 14, fontWeight: 600, marginBottom: 7 }}>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"
            style={inputStyle}
            onFocus={(e) => { e.target.style.borderColor = C.borderFocus; e.target.style.boxShadow = `0 0 0 3px ${C.greenSoft}`; }}
            onBlur={(e) => { e.target.style.borderColor = C.border; e.target.style.boxShadow = "none"; }} />

          <label style={{ display: "block", fontSize: 14, fontWeight: 600, marginBottom: 7 }}>Password</label>
          <div style={{ position: "relative", marginBottom: 14 }}>
            <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters"
              style={{ ...inputStyle, marginBottom: 0, paddingRight: 44 }}
              onFocus={(e) => { e.target.style.borderColor = C.borderFocus; e.target.style.boxShadow = `0 0 0 3px ${C.greenSoft}`; }}
              onBlur={(e) => { e.target.style.borderColor = C.border; e.target.style.boxShadow = "none"; }} />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", color: C.textMuted }}>
              {showPassword ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
              )}
            </button>
          </div>

          {mode === "signup" && (
            <>
              <label style={{ display: "block", fontSize: 14, fontWeight: 600, marginBottom: 7 }}>Confirm password</label>
              <input type={showPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter your password"
                style={inputStyle}
                onFocus={(e) => { e.target.style.borderColor = C.borderFocus; e.target.style.boxShadow = `0 0 0 3px ${C.greenSoft}`; }}
                onBlur={(e) => { e.target.style.borderColor = C.border; e.target.style.boxShadow = "none"; }} />
            </>
          )}

          {error && <div style={{ background: C.redSoft, border: `1px solid ${C.redBorder}`, borderRadius: 10, padding: "10px 14px", color: C.red, fontSize: 14, marginBottom: 14 }}>{error}</div>}
          {message && <div style={{ background: C.greenSoft, border: `1px solid ${C.greenBorder}`, borderRadius: 10, padding: "10px 14px", color: C.greenDark, fontSize: 14, marginBottom: 14 }}>{message}</div>}

          <button onClick={handleSubmit} disabled={loading}
            style={{ width: "100%", padding: "14px", background: C.green, border: "none", borderRadius: 10, color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", opacity: loading ? 0.7 : 1, marginBottom: 16 }}>
            {loading ? "Please wait..." : mode === "signup" ? "Create account" : "Log in"}
          </button>

          <p style={{ textAlign: "center", fontSize: 14, color: C.textSoft, margin: 0 }}>
            {mode === "signup" ? "Already have an account? " : "Don't have an account? "}
            <button onClick={() => { setMode(mode === "signup" ? "login" : "signup"); setError(""); setMessage(""); setConfirmPassword(""); }}
              style={{ background: "none", border: "none", color: C.green, fontWeight: 600, cursor: "pointer", fontSize: 14, padding: 0 }}>
              {mode === "signup" ? "Log in" : "Sign up"}
            </button>
          </p>
        </div>

        <button onClick={onBack} style={{ display: "block", margin: "20px auto 0", background: "none", border: "none", color: C.textMuted, fontSize: 14, cursor: "pointer", fontWeight: 500 }}>
          Back to ShopCopy
        </button>
      </div>
    </div>
  );
}