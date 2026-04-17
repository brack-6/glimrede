# Glimrede
### A Thesaurus of Lost Language

140 curated entries across ten categories — Old English, Middle English, Early Modern English, and Classical Borrowings. Cross-pollinator, kenning forge, forge log, saved hoards.

---

## Deploy to Vercel

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "glimrede v1.0"
gh repo create glimrede --public --push
```

### 2. Import to Vercel

Go to [vercel.com/new](https://vercel.com/new), import the repository.

Framework will be detected as Vite automatically.

### 3. Set the environment variable

In Vercel project settings → Environment Variables:

```
ANTHROPIC_API_KEY = sk-ant-...
```

### 4. Deploy

Vercel builds and deploys automatically on push. The cross-pollinator and kenning forge will work immediately once the key is set.

---

## Adding words

Edit `public/words.json` directly. Each entry:

```json
{
  "word": "mirk",
  "pronunciation": "merk",
  "era": "Old English",
  "category": "The Dark",
  "definition": "Thick, impenetrable darkness; a blackness that has weight and texture.",
  "lost": "Modern English lost a word for darkness that felt physical — dark tells you about light, mirk tells you about what you're walking through.",
  "usage": "The mirk of the close swallowed him before he reached the second door."
}
```

**Canonical eras:** `Old English` · `Middle English` · `Early Modern English` · `Late Modern English` · `Classical Borrowing` · `Borrowed`

**Categories:** `The Dark` · `The Knowing` · `The Luminous` · `The Reckoning` · `The Sounding` · `The Speaking` · `The Spent` · `The Wandering` · `The Bodied` · `The Bound`

---

## Local development

```bash
npm install
npm run dev
```

The `/api/transmute` and `/api/forge` routes require the Vercel CLI for local testing:

```bash
npm i -g vercel
vercel dev
```

This runs both the Vite frontend and the serverless functions together.
