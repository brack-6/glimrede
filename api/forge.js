export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { a, b } = req.body;
  if (!a?.trim() || !b?.trim()) return res.status(400).json({ error: "a and b are required" });

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
    },
    body: JSON.stringify({
      model: "meta-llama/llama-3.1-8b-instruct:free",
      max_tokens: 1000,
      messages: [{
        role: "user",
        content: `You are a master of Old English kenning. Given two concepts: "${a.trim()}" and "${b.trim()}"

Generate 4 kenning-style compound words that use BOTH concepts together to name a third thing.

Return ONLY this JSON, nothing else, no markdown:
{"kennings":[{"compound":"...","names":"...","logic":"..."},{"compound":"...","names":"...","logic":"..."},{"compound":"...","names":"...","logic":"..."},{"compound":"...","names":"...","logic":"..."}]}

- compound: hyphenated kenning (e.g. "whale-road")
- names: what it names, 2-4 words
- logic: one sentence on the metaphoric logic

Use genuine poetic logic. Aim for surprise.`,
      }],
    }),
  });

  const data = await response.json();
  if (!response.ok) return res.status(502).json({ error: "Upstream error" });

  try {
    const text = data.choices[0].message.content.trim();
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start === -1 || end === -1) throw new Error("No JSON");
    res.json(JSON.parse(text.slice(start, end + 1)));
  } catch {
    res.status(502).json({ error: "Parse error" });
  }
}
