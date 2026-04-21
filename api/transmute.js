export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { word } = req.body || {};
  if (!word?.trim()) return res.status(400).json({ error: "word is required" });

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
        max_tokens: 300,
        temperature: 0.8,
        messages: [{
          role: "user",
          content: `You are a curator of archaic English. For the word: "${word.trim()}"

Return ONLY valid JSON, no markdown, no explanation:
{"oe":{"word":"...","gloss":"..."},"naut":{"word":"...","gloss":"..."},"leg":{"word":"...","gloss":"..."}}

oe = Old/Middle/Early Modern English word for this concept
naut = nautical or seafaring term evoking this concept  
leg = archaic legal or ceremonial term evoking this concept
gloss = 4-7 word evocative phrase

Use genuine archaic vocabulary only.`
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
