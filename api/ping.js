export default async function handler(req, res) {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) return res.json({ status: "missing", message: "OPENROUTER_API_KEY not set" });

  try {
    // Test with a minimal actual completion to see exact error
    const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${key}`,
        "HTTP-Referer": "https://glimrede.vercel.app",
        "X-Title": "Glimrede",
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3.1-8b-instruct:free",
        max_tokens: 10,
        messages: [{ role: "user", content: "say hi" }],
      }),
    });
    const data = await r.json();
    res.json({ status: r.ok ? "ok" : "fail", code: r.status, data });
  } catch (err) {
    res.json({ status: "error", message: err.message });
  }
}
