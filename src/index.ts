import * as dotenv from "dotenv"
import * as readline from "readline"
import { ZeroShotClassifier } from "./classifier"
import { SENTIMENT_LABELS, INTENT_LABELS, TOPIC_LABELS } from "./presets"

dotenv.config()

const PRESETS: Record<string, typeof SENTIMENT_LABELS> = {
  sentiment: SENTIMENT_LABELS,
  intent:    INTENT_LABELS,
  topic:     TOPIC_LABELS,
}

async function main() {
  const preset = process.argv[2] ?? "sentiment"
  const labels = PRESETS[preset]

  if (!labels) {
    console.error(`Unknown preset: ${preset}. Available: ${Object.keys(PRESETS).join(", ")}`)
    process.exit(1)
  }

  const classifier = new ZeroShotClassifier(labels, process.env.OPENAI_API_KEY ?? "")

  console.log(`AI Classifier — preset: ${preset}`)
  console.log(`Labels: ${classifier.listLabels().join(", ")}`)
  console.log("Type text to classify, or 'exit' to quit\n")

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })

  const ask = () => rl.question("Input: ", async text => {
    const t = text.trim()
    if (!t)        return ask()
    if (t === "exit") { rl.close(); return }

    try {
      const result = await classifier.classify(t)
      console.log(`\nLabel:      ${result.label}`)
      console.log(`Confidence: ${(result.confidence * 100).toFixed(1)}%`)
      console.log(`Reasoning:  ${result.reasoning}`)
      if (result.alternatives.length) {
        console.log("Alternatives:")
        result.alternatives.forEach(a =>
          console.log(`  - ${a.label}: ${(a.confidence * 100).toFixed(1)}%`)
        )
      }
      console.log()
    } catch (err) {
      console.error("Error:", err instanceof Error ? err.message : err)
    }

    ask()
  })

  ask()
}

main()
