export interface Label {
  name: string
  description: string
  examples?: string[]
}

export interface ClassificationResult {
  input: string
  label: string
  confidence: number
  reasoning: string
  alternatives: Array<{ label: string; confidence: number }>
}

export interface BatchResult {
  results: ClassificationResult[]
  totalTokensUsed: number
  durationMs: number
  accuracy?: number
}

export interface ClassifierOptions {
  model?: string
  temperature?: number
  maxTokens?: number
  topK?: number
  confidenceThreshold?: number
}
