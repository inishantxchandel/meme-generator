import type { TextBlock } from "./template"

export interface Suggestion {
  id: string
  templateId: string
  captionTop: string
  captionBottom: string
  vibe: "ironic" | "relatable" | "absurdist" | "dark" | "wholesome" | "unhinged"
  confidence: number
}

export interface Meme {
  id: string
  imageUrl: string
  imagePath: string
  templateId: string
  captionTop: string | null
  captionBottom: string | null
  captionExtra: TextBlock[] | null
  exportUrl: string | null
  metadata: Record<string, unknown>
  createdAt: string
}

export interface Reaction {
  id: string
  memeId: string
  emoji: "😂" | "👍" | "🔥" | "💀"
  reactorId: string
  createdAt: string
}

export type ReactionEmoji = "😂" | "👍" | "🔥" | "💀"

export interface ReactionCounts {
  "😂": number
  "👍": number
  "🔥": number
  "💀": number
}
