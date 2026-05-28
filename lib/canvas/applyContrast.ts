import {
  analyzeAllBlocks,
  DARK_ON_LIGHT,
  WHITE_ON_DARK,
  type ContrastColors,
} from "@/lib/canvas/analyzeContrast"
import { blockInCaptionBar } from "@/lib/canvas/fitText"
import { TEMPLATES } from "@/lib/templates/definitions"
import type { TextBlock } from "@/types/template"

const imageCache = new Map<string, HTMLImageElement>()

export function loadImage(src: string): Promise<HTMLImageElement> {
  if (imageCache.has(src)) return Promise.resolve(imageCache.get(src)!)
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      imageCache.set(src, img)
      resolve(img)
    }
    img.onerror = reject
    img.src = src
  })
}

function analyzeOptionsForTemplate(templateId: string) {
  const template = TEMPLATES[templateId]
  if (!template) return undefined

  const barConfig = template.bottomBarFraction
    ? { fraction: template.bottomBarFraction, color: template.bottomBarColor ?? "#FFFFFF" }
    : undefined

  const overlay =
    template.overlayColor != null
      ? { color: template.overlayColor, opacity: template.overlayOpacity ?? 0.25 }
      : undefined

  return { barConfig, overlay }
}

export function contrastColorsForBlocks(
  img: HTMLImageElement,
  templateId: string,
  blocks: Array<{ x: number; y: number; width: number }>,
  canvasSize: number
): ContrastColors[] {
  return analyzeAllBlocks(img, blocks, canvasSize, analyzeOptionsForTemplate(templateId))
}

export function mergeContrastIntoBlocks(
  blocks: TextBlock[],
  colors: ContrastColors[],
  templateId?: string
): TextBlock[] {
  const template = templateId ? TEMPLATES[templateId] : undefined

  return blocks.map((block, i) => {
    const cc = colors[i]
    if (cc) {
      return {
        ...block,
        fill: cc.fill,
        stroke: cc.stroke,
        strokeWidth: cc.strokeWidth,
        shadowEnabled: cc.shadowEnabled,
        shadowColor: cc.shadowColor,
        shadowBlur: cc.shadowBlur,
      }
    }

    // Before analysis finishes — safe defaults per region
    const inBar = template && blockInCaptionBar(block.y, template.bottomBarFraction)
    const fallback = inBar ? DARK_ON_LIGHT : WHITE_ON_DARK
    return { ...block, ...fallback, stroke: "", strokeWidth: 0 }
  })
}

/** Pick text fill/shadow from pixels under each block so captions stay readable. */
export async function applyContrastToTextBlocks(
  imageUrl: string,
  templateId: string,
  blocks: TextBlock[],
  canvasSize: number
): Promise<TextBlock[]> {
  const img = await loadImage(imageUrl)
  const colors = contrastColorsForBlocks(img, templateId, blocks, canvasSize)
  return mergeContrastIntoBlocks(blocks, colors, templateId)
}
