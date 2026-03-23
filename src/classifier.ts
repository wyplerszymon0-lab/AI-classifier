import OpenAI from "openai"
import { Label, ClassificationResult, BatchResult, ClassifierOptions } from "./types"

const DEFAULTS: Required<ClassifierOptions> = {
  model:               "gpt-4o-mini",
  temperature:         0.1,
  maxTokens:           400,
  topK:                3,
  confidenceThreshold: 0.0,
}

function buildSystemPrompt(labels: Label[]): string {
  const labelBlock = labels.map(l => {
    let entry = `- "${l.name}": ${l.description}`
    if (l.examples?.length) {
      entry += `\n  Examples: ${l.examples.map(e => `"${e}"`).join(", ")}`
    }
    return entry
  }).join("\n")

  return (
    `You are a zero-shot text classifier. Classify the given text into exactly one of the provided categories.\n\n` +
    `Categories:\n${labelBlock}\n\n` +
    `Respond with valid JSON only — no markdown, no preamble:\n` +
    `{\n` +
    `  "label": "<best matching category name>",\n` +
    `  "confidence": <float 0.0-1.0>,\n` +
    `  "reasoning": "<one sentence explaining why>",\n` +
    `  "alternatives": [\n` +
    `    { "label": "<second best>", "confidence": <float> },\n` +
    `    { "label": "<third best>",  "confidence": <float> }\n` +
    `  ]\n` +
    `}`
  )
}

function parseResponse(raw: string, input: string): ClassificationResult {
  const clean = raw.replace(/```json|```/g, "").trim()
  const data  = JSON.parse(clean)
  return {
    input,
    label:        data.label,
    confidence:   data.confidence,
    reasoning:    data.reasoning,
    alternatives: data.alternatives ?? [],
  }
}

export class ZeroShotClassifier {
  private client:  OpenAI
  private labels:  Label[]
  private options: Required<ClassifierOptions>
  private system:  string

  constructor(labels: Label[], apiKey: string, options: ClassifierOptions = {}) {
    this.client  = new OpenAI({ apiKey })
    this.labels  = labels
    this.options = { ...DEFAULTS, ...options }
    this.system  = buildSystemPrompt(labels)
  }

  async classify(input: string): Promise<ClassificationResult> {
    const response = await this.client.chat.completions.create({
      model:       this.options.model,
      temperature: this.options.temperature,
      max_tokens:  this.options.maxTokens,
      messages: [
        { role: "system", content: this.system },
        { role: "user",   content: `Classify this text:\n\n"${input}"` },
      ],
    })

    const raw = response.choices[0]?.message?.content ?? ""
    return parseResponse(raw, input)
  }

  async classifyBatch(inputs: string[], concurrency = 3): Promise<BatchResult> {
    const start   = Date.now()
    const results: ClassificationResult[] = []
    let totalTokens = 0

    for (let i = 0; i < inputs.length; i += concurrency) {
      const batch = inputs.slice(i, i + concurrency)
      const responses = await Promise.all(
        batch.map(input => this.client.chat.completions.create({
          model:       this.options.model,
          temperature: this.options.temperature,
          max_tokens:  this.options.maxTokens,
          messages: [
            { role: "system", content: this.system },
            { role: "user",   content: `Classify this text:\n\n"${input}"` },
          ],
        }))
      )

      for (let j = 0; j < responses.length; j++) {
        const raw = responses[j].choices[0]?.message?.content ?? ""
        totalTokens += responses[j].usage?.total_tokens ?? 0
        results.push(parseResponse(raw, batch[j]))
      }
    }

    return {
      results,
      totalTokensUsed: totalTokens,
      durationMs:      Date.now() - start,
    }
  }

  addLabel(label: Label): void {
    this.labels.push(label)
    this.system = buildSystemPrompt(this.labels)
  }

  removeLabel(name: string): boolean {
    const before = this.labels.length
    this.labels  = this.labels.filter(l => l.name !== name)
    if (this.labels.length < before) {
      this.system = buildSystemPrompt(this.labels)
      return true
    }
    return false
  }

  listLabels(): string[] {
    return this.labels.map(l => l.name)
  }

  updateOptions(options: Partial<ClassifierOptions>): void {
    this.options = { ...this.options, ...options }
  }
}
