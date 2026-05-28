import { getAnthropicClient } from "./client"
import { TEMPLATE_LIST } from "@/lib/templates/definitions"
import type { Suggestion } from "@/types/meme"

// Exactly 6 templates — one per suggestion slot, enforced in code
const SIX_TEMPLATES = [
  "classic-impact",
  "caption-below",
  "drake-pointing",
  "this-is-fine",
  "expanding-brain",
  "chaos-mode",
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

Generate exactly 6 meme suggestions. Each MUST use a DIFFERENT template from this exact ordered list:
1. classic-impact
2. caption-below
3. drake-pointing
4. this-is-fine
5. expanding-brain
6. chaos-mode

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

const FALLBACK_SUGGESTIONS: Suggestion[] = [
  { id: "fallback_0", templateId: "classic-impact", captionTop: "ME UPLOADING A PHOTO", captionBottom: "WAITING FOR THE AI TO ROAST ME", vibe: "relatable", confidence: 0.5 },
  { id: "fallback_1", templateId: "caption-below", captionTop: "", captionBottom: "the face I make when the API times out", vibe: "ironic", confidence: 0.5 },
  { id: "fallback_2", templateId: "drake-pointing", captionTop: "Writing clean code", captionBottom: "Shipping it anyway", vibe: "relatable", confidence: 0.5 },
  { id: "fallback_3", templateId: "this-is-fine", captionTop: "Everything is fine.", captionBottom: "", vibe: "absurdist", confidence: 0.5 },
  { id: "fallback_4", templateId: "expanding-brain", captionTop: "Using Google", captionBottom: "Asking Claude at 2am", vibe: "absurdist", confidence: 0.5 },
  { id: "fallback_5", templateId: "chaos-mode", captionTop: "SEND HELP", captionBottom: "WE LOVE TO SEE IT", vibe: "unhinged", confidence: 0.5 },
]

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

    // Enforce 6 unique templates — override Claude if it repeats
    // Position i in the array is locked to SIX_TEMPLATES[i]
    const usedTemplates = new Set<string>()
    const remainingTemplates = [...SIX_TEMPLATES]

    const suggestions = input.suggestions.map((s, i) => {
      let templateId = s.templateId

      // If Claude used a duplicate, assign the next unused template
      if (usedTemplates.has(templateId)) {
        const unused = remainingTemplates.find((id) => !usedTemplates.has(id))
        templateId = unused ?? SIX_TEMPLATES[i % SIX_TEMPLATES.length]
      }

      usedTemplates.add(templateId)
      remainingTemplates.splice(remainingTemplates.indexOf(templateId), 1)

      return {
        id: `suggestion_${i}`,
        templateId,
        captionTop: s.captionTop ?? "",
        captionBottom: s.captionBottom ?? "",
        vibe: s.vibe as Suggestion["vibe"],
        confidence: s.confidence,
      }
    })

    return suggestions
  } catch (error) {
    console.error("Claude suggest error:", error)
    return FALLBACK_SUGGESTIONS
  }
}
