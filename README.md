# ai-classifier

Zero-shot text classifier powered by LLMs. Categorizes any text into custom labels without training data or fine-tuning — just define your labels and classify.

## Features

- Zero-shot classification — no training data needed
- Custom labels with descriptions and examples
- Confidence scores and alternative predictions
- Batch classification with concurrency control
- Built-in presets — sentiment, intent, topic
- Add / remove labels at runtime

## Built-in Presets

| Preset | Labels |
|---|---|
| `sentiment` | positive, negative, neutral |
| `intent` | question, complaint, compliment, request, other |
| `topic` | technology, business, science, sports, politics, entertainment |

## Run
```bash
npm install
export OPENAI_API_KEY=your_key

npm run dev sentiment
npm run dev intent
npm run dev topic
```

## Custom Labels
```typescript
import { ZeroShotClassifier } from "./src/classifier"

const classifier = new ZeroShotClassifier([
  { name: "bug",     description: "Software defect or error report", examples: ["It crashes", "404 error"] },
  { name: "feature", description: "Request for new functionality",   examples: ["Add dark mode", "Export to PDF"] },
  { name: "docs",    description: "Documentation issue or request",  examples: ["Missing example", "Unclear steps"] },
], process.env.OPENAI_API_KEY)

const result = await classifier.classify("The app crashes on startup")
console.log(result.label)      // "bug"
console.log(result.confidence) // 0.97
```

## Test
```bash
npm test
```

## Project Structure
```
ai-classifier/
├── src/
│   ├── index.ts       # CLI entry point
│   ├── classifier.ts  # ZeroShotClassifier core
│   ├── presets.ts     # Built-in label presets
│   └── types.ts       # Interfaces and types
├── tests/
│   └── classifier.test.ts
├── package.json
├── tsconfig.json
└── README.md
```

## Author

**Szymon Wypler** 
