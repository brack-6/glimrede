export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { a, b } = req.body;
  if (!a?.trim() || !b?.trim()) return res.status(400).json({ error: "a and b are required" });

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
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
    const raw = data.content[0].text.trim().replace(/```json|```/g, "").trim();
    res.json(JSON.parse(raw));
  } catch {
    res.status(502).json({ error: "Parse error" });
  }
}
