export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { word } = req.body;
  if (!word?.trim()) return res.status(400).json({ error: "word is required" });

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
        content: `You are a curator of archaic and historical English. Given the modern word or concept: "${word.trim()}"

Return ONLY this JSON, nothing else, no markdown:
{"oe":{"word":"...","gloss":"..."},"naut":{"word":"...","gloss":"..."},"leg":{"word":"...","gloss":"..."}}

Where:
- oe: an Old English, Middle English, or Early Modern English word or phrase for this concept
- naut: a nautical cant or seafaring term evoking this concept
- leg: an archaic legal or ceremonial term evoking this concept
- gloss: a single evocative phrase of 4-7 words

Use genuine archaic vocabulary, not invented words. Prefer lesser-known terms over familiar ones.`,
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
