import { describe, it, expect, vi, beforeEach } from "vitest"
import { ZeroShotClassifier } from "../src/classifier"
import { SENTIMENT_LABELS, INTENT_LABELS } from "../src/presets"
import { Label } from "../src/types"

function makeMockOpenAI(response: object) {
  return {
    chat: {
      completions: {
        create: vi.fn().mockResolvedValue({
          choices: [{ message: { content: JSON.stringify(response) } }],
          usage:   { total_tokens: 100 },
        }),
      },
    },
  }
}

function makeClassifier(labels: Label[], mockResponse: object) {
  const classifier = new ZeroShotClassifier(labels, "fake-key")
  ;(classifier as any).client = makeMockOpenAI(mockResponse)
  return classifier
}

const MOCK_POSITIVE = {
  label:        "positive",
  confidence:   0.95,
  reasoning:    "The text expresses clear satisfaction.",
  alternatives: [
    { label: "neutral",  confidence: 0.04 },
    { label: "negative", confidence: 0.01 },
  ],
}

const MOCK_QUESTION = {
  label:        "question",
  confidence:   0.92,
  reasoning:    "The text ends with a question mark and asks for information.",
  alternatives: [
    { label: "request", confidence: 0.06 },
    { label: "other",   confidence: 0.02 },
  ],
}

describe("ZeroShotClassifier — classify", () => {
  it("returns classification result with all fields", async () => {
    const classifier = makeClassifier(SENTIMENT_LABELS, MOCK_POSITIVE)
    const result     = await classifier.classify("Great product!")

    expect(result.label).toBe("positive")
    expect(result.confidence).toBe(0.95)
    expect(result.reasoning).toBeTruthy()
    expect(result.input).toBe("Great product!")
    expect(Array.isArray(result.alternatives)).toBe(true)
  })

  it("passes input text to the API", async () => {
    const classifier = makeClassifier(SENTIMENT_LABELS, MOCK_POSITIVE)
    const spy        = (classifier as any).client.chat.completions.create

    await classifier.classify("test input")

    const call = spy.mock.calls[0][0]
    const userMsg = call.messages.find((m: any) => m.role === "user")
    expect(userMsg.content).toContain("test input")
  })

  it("includes label descriptions in system prompt", async () => {
    const classifier = makeClassifier(SENTIMENT_LABELS, MOCK_POSITIVE)
    const spy        = (classifier as any).client.chat.completions.create

    await classifier.classify("test")

    const call      = spy.mock.calls[0][0]
    const systemMsg = call.messages.find((m: any) => m.role === "system")
    expect(systemMsg.content).toContain("positive")
    expect(systemMsg.content).toContain("negative")
    expect(systemMsg.content).toContain("neutral")
  })

  it("handles JSON with code fence in response", async () => {
    const classifier = makeClassifier(SENTIMENT_LABELS, {})
    ;(classifier as any).client = {
      chat: {
        completions: {
          create: vi.fn().mockResolvedValue({
            choices: [{ message: { content: `\`\`\`json\n${JSON.stringify(MOCK_POSITIVE)}\n\`\`\`` } }],
            usage:   { total_tokens: 50 },
          }),
        },
      },
    }

    const result = await classifier.classify("test")
    expect(result.label).toBe("positive")
  })
})

describe("ZeroShotClassifier — classifyBatch", () => {
  it("returns results for all inputs", async () => {
    const classifier = makeClassifier(SENTIMENT_LABELS, MOCK_POSITIVE)
    const batch      = await classifier.classifyBatch(["text1", "text2", "text3"])

    expect(batch.results).toHaveLength(3)
    expect(batch.totalTokensUsed).toBeGreaterThan(0)
    expect(batch.durationMs).toBeGreaterThanOrEqual(0)
  })

  it("processes in batches respecting concurrency", async () => {
    const classifier = makeClassifier(SENTIMENT_LABELS, MOCK_POSITIVE)
    const spy        = (classifier as any).client.chat.completions.create

    await classifier.classifyBatch(["a", "b", "c", "d", "e"], 2)

    expect(spy).toHaveBeenCalledTimes(5)
  })

  it("returns empty results for empty input", async () => {
    const classifier = makeClassifier(SENTIMENT_LABELS, MOCK_POSITIVE)
    const batch      = await classifier.classifyBatch([])

    expect(batch.results).toHaveLength(0)
    expect(batch.totalTokensUsed).toBe(0)
  })
})

describe("ZeroShotClassifier — label management", () => {
  it("lists all label names", () => {
    const classifier = new ZeroShotClassifier(SENTIMENT_LABELS, "fake-key")
    const labels     = classifier.listLabels()

    expect(labels).toContain("positive")
    expect(labels).toContain("negative")
    expect(labels).toContain("neutral")
    expect(labels).toHaveLength(3)
  })

  it("adds a new label", async () => {
    const classifier = makeClassifier(SENTIMENT_LABELS, MOCK_POSITIVE)
    classifier.addLabel({ name: "mixed", description: "Both positive and negative elements" })

    expect(classifier.listLabels()).toContain("mixed")
    expect(classifier.listLabels()).toHaveLength(4)
  })

  it("updates system prompt after adding label", async () => {
    const classifier = makeClassifier(SENTIMENT_LABELS, MOCK_POSITIVE)
    const spy        = (classifier as any).client.chat.completions.create

    classifier.addLabel({ name: "sarcastic", description: "Ironic or sarcastic tone" })
    await classifier.classify("test")

    const call      = spy.mock.calls[0][0]
    const systemMsg = call.messages.find((m: any) => m.role === "system")
    expect(systemMsg.content).toContain("sarcastic")
  })

  it("removes an existing label", () => {
    const classifier = new ZeroShotClassifier(SENTIMENT_LABELS, "fake-key")
    const removed    = classifier.removeLabel("neutral")

    expect(removed).toBe(true)
    expect(classifier.listLabels()).not.toContain("neutral")
    expect(classifier.listLabels()).toHaveLength(2)
  })

  it("returns false when removing nonexistent label", () => {
    const classifier = new ZeroShotClassifier(SENTIMENT_LABELS, "fake-key")
    const removed    = classifier.removeLabel("nonexistent")

    expect(removed).toBe(false)
    expect(classifier.listLabels()).toHaveLength(3)
  })
})

describe("ZeroShotClassifier — options", () => {
  it("uses default options when none provided", () => {
    const classifier = new ZeroShotClassifier(SENTIMENT_LABELS, "fake-key")
    const opts       = (classifier as any).options

    expect(opts.model).toBe("gpt-4o-mini")
    expect(opts.temperature).toBe(0.1)
    expect(opts.topK).toBe(3)
  })

  it("overrides defaults with provided options", () => {
    const classifier = new ZeroShotClassifier(SENTIMENT_LABELS, "fake-key", {
      temperature: 0.5,
      topK:        5,
    })
    const opts = (classifier as any).options

    expect(opts.temperature).toBe(0.5)
    expect(opts.topK).toBe(5)
    expect(opts.model).toBe("gpt-4o-mini")
  })

  it("updateOptions merges with existing options", () => {
    const classifier = new ZeroShotClassifier(SENTIMENT_LABELS, "fake-key")
    classifier.updateOptions({ temperature: 0.8 })

    const opts = (classifier as any).options
    expect(opts.temperature).toBe(0.8)
    expect(opts.model).toBe("gpt-4o-mini")
  })
})

describe("Presets", () => {
  it("SENTIMENT_LABELS has 3 labels", () => {
    expect(SENTIMENT_LABELS).toHaveLength(3)
    expect(SENTIMENT_LABELS.map(l => l.name)).toEqual(["positive", "negative", "neutral"])
  })

  it("INTENT_LABELS has 5 labels", () => {
    expect(INTENT_LABELS).toHaveLength(5)
  })

  it("all labels have name and description", () => {
    const all = [...SENTIMENT_LABELS, ...INTENT_LABELS]
    for (const label of all) {
      expect(label.name).toBeTruthy()
      expect(label.description).toBeTruthy()
    }
  })
})
