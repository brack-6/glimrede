export default async function handler(req, res) {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) return res.json({ status: "missing", message: "OPENROUTER_API_KEY not set in Vercel env vars" });

  // Just check models endpoint - no tokens used
  try {
    const r = await fetch("https://openrouter.ai/api/v1/models", {
      headers: { "Authorization": `Bearer ${key}` }
    });
    if (r.ok) {
      res.json({ status: "ok", message: "Key is valid and OpenRouter reachable" });
    } else {
      const d = await r.json();
      res.json({ status: "invalid", code: r.status, detail: d?.error?.message });
    }
  } catch (err) {
    res.json({ status: "error", message: err.message });
  }
}
