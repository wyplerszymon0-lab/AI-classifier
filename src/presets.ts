import { Label } from "./types"

export const SENTIMENT_LABELS: Label[] = [
  {
    name:        "positive",
    description: "Expresses satisfaction, happiness, praise or approval",
    examples:    ["Great product!", "I love this", "Absolutely amazing"],
  },
  {
    name:        "negative",
    description: "Expresses dissatisfaction, frustration, criticism or disapproval",
    examples:    ["Terrible experience", "Would not recommend", "Very disappointed"],
  },
  {
    name:        "neutral",
    description: "Factual, objective or neither clearly positive nor negative",
    examples:    ["The package arrived", "It has 3 buttons", "Delivery took 5 days"],
  },
]

export const INTENT_LABELS: Label[] = [
  {
    name:        "question",
    description: "User is asking for information or clarification",
    examples:    ["How does this work?", "What is the price?", "Can you explain?"],
  },
  {
    name:        "complaint",
    description: "User is reporting a problem or expressing dissatisfaction",
    examples:    ["This is broken", "I want a refund", "Nothing works"],
  },
  {
    name:        "compliment",
    description: "User is praising or expressing satisfaction",
    examples:    ["Love your service", "Best app ever", "Keep up the great work"],
  },
  {
    name:        "request",
    description: "User is asking for an action to be performed",
    examples:    ["Please cancel my order", "Can you send me the invoice?", "Reset my password"],
  },
  {
    name:        "other",
    description: "Does not fit the above categories",
    examples:    ["Hello", "Testing", "Not sure"],
  },
]

export const TOPIC_LABELS: Label[] = [
  {
    name:        "technology",
    description: "Software, hardware, AI, programming, gadgets",
    examples:    ["New iPhone release", "Python tutorial", "ChatGPT update"],
  },
  {
    name:        "business",
    description: "Finance, startups, markets, corporate news",
    examples:    ["IPO announcement", "Quarterly earnings", "Merger deal"],
  },
  {
    name:        "science",
    description: "Research, discoveries, medicine, environment",
    examples:    ["Climate study", "Cancer breakthrough", "Space mission"],
  },
  {
    name:        "sports",
    description: "Games, athletes, tournaments, scores",
    examples:    ["Championship final", "Transfer news", "World record"],
  },
  {
    name:        "politics",
    description: "Government, elections, policy, international relations",
    examples:    ["Election results", "New legislation", "Summit meeting"],
  },
  {
    name:        "entertainment",
    description: "Movies, music, celebrities, culture",
    examples:    ["Album release", "Box office results", "Award ceremony"],
  },
]
