export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { a, b } = req.body || {};
  if (!a?.trim() || !b?.trim()) return res.status(400).json({ error: "a and b are required" });

  const key = process.env.OPENROUTER_API_KEY;
  if (!key) return res.status(500).json({ error: "API key not configured" });

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${key}`,
        "HTTP-Referer": "https://glimrede.vercel.app",
        "X-Title": "Glimrede",
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3.1-8b-instruct:free",
        max_tokens: 400,
        temperature: 0.9,
        messages: [{
          role: "user",
          content: `You are a master of Old English kenning. Concepts: "${a.trim()}" and "${b.trim()}"

Return ONLY valid JSON, no markdown, no explanation:
{"kennings":[{"compound":"...","names":"...","logic":"..."},{"compound":"...","names":"...","logic":"..."},{"compound":"...","names":"...","logic":"..."},{"compound":"...","names":"...","logic":"..."}]}

compound = hyphenated kenning using both concepts (e.g. "whale-road")
names = what it names, 2-4 words
logic = one sentence metaphoric explanation

Aim for surprise. Use genuine poetic logic.`
        }],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(502).json({ error: "Upstream error", code: response.status, detail: data?.error?.message, full: data });
    }

    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text) return res.status(502).json({ error: "Empty response" });

    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start === -1 || end === -1) return res.status(502).json({ error: "No JSON in response" });

    res.json(JSON.parse(text.slice(start, end + 1)));
  } catch (err) {
    res.status(500).json({ error: "Server error", detail: err.message });
  }
}
