import { getAnthropicClient } from "./client"
import type { Suggestion } from "@/types/meme"

// Exactly 6 templates — one per suggestion slot, enforced in code
const SIX_TEMPLATES = [
  "classic-impact",
  "caption-below",
  "drake-pointing",
  "this-is-fine",
  "expanding-brain",
  "chaos-mode",
] as const

// One vibe per slot — never duplicate labels in the grid
const SLOT_VIBES: Suggestion["vibe"][] = [
  "relatable",
  "ironic",
  "wholesome",
  "dark",
  "absurdist",
  "unhinged",
]

const SYSTEM_PROMPT = `You are a meme strategist and internet culture expert with perfect taste.
You analyze images with forensic precision and generate meme captions that are:
- SPECIFIC to what you literally see (expressions, body language, composition, setting)
- Sharp and funny — never generic filler text
- Aware of the format you're using (top/bottom text vs caption vs overlay)

Rules:
- Never write "me when I..." or "when you..." generics that could apply to any photo
- Reference specific visual details you observe
- Each suggestion must have a distinctly different vibe
- Shorter is almost always better for memes`

const USER_PROMPT = `Analyze this image carefully. Look at:
- Who/what is in it, their expressions, body language
- The emotional energy (awkward, triumphant, defeated, chaotic, serene, unhinged)
- Any implied narrative
- Composition details

Generate exactly 6 meme suggestions in this exact order (suggestion[0] = slot 1, etc.):
1. classic-impact — top + bottom Impact-style text
2. caption-below — single caption in the bar below the photo
3. drake-pointing — reject captionTop, approve captionBottom
4. this-is-fine — centered denial phrase (captionTop)
5. expanding-brain — four escalating lines (captionTop → captionBottom)
6. chaos-mode — chaotic dual labels

IMPORTANT — captions must work as a universal two-part meme:
- captionTop = the SETUP: subject, label, what's being described, or the rejected/small-brain option
- captionBottom = the PUNCHLINE: reaction, contrast, the approved/galaxy-brain option, or the joke payoff

This two-part format works across ALL templates:
- classic-impact uses top text + bottom text
- caption-below shows bottom text as caption below the photo
- drake-pointing rejects captionTop, approves captionBottom
- this-is-fine uses captionTop as the denial phrase
- expanding-brain escalates from captionTop (small brain) to captionBottom (galaxy brain)
- chaos-mode uses both as chaotic labels

Rules:
- Both captions must be SHORT (under 8 words each) — memes are punchy
- Reference something SPECIFIC visible in the photo — not generic lines
- captionTop and captionBottom must make sense as a pair when read together`

const SUGGESTION_TOOL = {
  name: "generate_meme_suggestions",
  description: "Generate structured meme suggestions for the uploaded image",
  input_schema: {
    type: "object" as const,
    properties: {
      imageDescription: {
        type: "string",
        description: "What you literally see in the image (1-2 sentences, very specific)",
      },
      suggestions: {
        type: "array",
        minItems: 6,
        maxItems: 6,
        items: {
          type: "object",
          properties: {
            templateId: {
              type: "string",
              enum: SIX_TEMPLATES,
            },
            captionTop: { type: "string" },
            captionBottom: { type: "string" },
            vibe: {
              type: "string",
              enum: ["ironic", "relatable", "absurdist", "dark", "wholesome", "unhinged"],
            },
            confidence: { type: "number", minimum: 0, maximum: 1 },
          },
          required: ["templateId", "captionTop", "captionBottom", "vibe", "confidence"],
        },
      },
    },
    required: ["imageDescription", "suggestions"],
  },
}

const FALLBACK_SUGGESTIONS: Suggestion[] = SIX_TEMPLATES.map((templateId, i) => ({
  id: `fallback_${i}`,
  templateId,
  captionTop: [
    "ME UPLOADING A PHOTO",
    "",
    "Writing clean code",
    "Everything is fine.",
    "Using Google",
    "SEND HELP",
  ][i],
  captionBottom: [
    "WAITING FOR THE AI TO ROAST ME",
    "the face I make when the API times out",
    "Shipping it anyway",
    "",
    "Asking Claude at 2am",
    "WE LOVE TO SEE IT",
  ][i],
  vibe: SLOT_VIBES[i],
  confidence: 0.5,
}))

export async function getSuggestions(imageUrl: string): Promise<Suggestion[]> {
  try {
    const anthropic = getAnthropicClient()

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1500,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "url", url: imageUrl } },
            { type: "text", text: USER_PROMPT },
          ],
        },
      ],
      tools: [SUGGESTION_TOOL],
      tool_choice: { type: "tool", name: "generate_meme_suggestions" },
    })

    const toolUse = response.content.find((c) => c.type === "tool_use")
    if (!toolUse || toolUse.type !== "tool_use") return FALLBACK_SUGGESTIONS

    const input = toolUse.input as {
      suggestions: Array<{
        templateId: string
        captionTop: string
        captionBottom: string
        vibe: string
        confidence: number
      }>
    }

    // Lock each array index to its template + vibe so the grid never duplicates
    const raw = input.suggestions.slice(0, 6)
    while (raw.length < 6) {
      const fb = FALLBACK_SUGGESTIONS[raw.length]
      raw.push({
        templateId: fb.templateId,
        captionTop: fb.captionTop,
        captionBottom: fb.captionBottom,
        vibe: fb.vibe,
        confidence: fb.confidence,
      })
    }

    return raw.map((s, i) => ({
      id: `suggestion_${i}`,
      templateId: SIX_TEMPLATES[i],
      captionTop: s.captionTop ?? "",
      captionBottom: s.captionBottom ?? "",
      vibe: SLOT_VIBES[i],
      confidence: s.confidence ?? 0.8,
    }))
  } catch (error) {
    console.error("Claude suggest error:", error)
    return FALLBACK_SUGGESTIONS
  }
}
