export interface ContrastColors {
  fill: string
  stroke: string
  strokeWidth: number
  shadowEnabled: boolean
  shadowColor: string
  shadowBlur: number
}

export const WHITE_ON_DARK: ContrastColors = {
  fill: "#FFFFFF",
  stroke: "",
  strokeWidth: 0,
  shadowEnabled: true,
  shadowColor: "#000000",
  shadowBlur: 8,
}

export const DARK_ON_LIGHT: ContrastColors = {
  fill: "#111111",
  stroke: "",
  strokeWidth: 0,
  shadowEnabled: true,
  shadowColor: "#000000",
  shadowBlur: 4,
}

export interface BarConfig {
  fraction: number
  color: string
}

export interface OverlayConfig {
  color: string
  opacity: number
}

export interface AnalyzeOptions {
  barConfig?: BarConfig
  overlay?: OverlayConfig
}

function chanLum(c: number): number {
  const s = c / 255
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
}

function pixelLum(r: number, g: number, b: number): number {
  return 0.2126 * chanLum(r) + 0.7152 * chanLum(g) + 0.0722 * chanLum(b)
}

function hexToRgb(hex: string): [number, number, number] {
  const c = hex.replace("#", "")
  return [
    parseInt(c.slice(0, 2), 16),
    parseInt(c.slice(2, 4), 16),
    parseInt(c.slice(4, 6), 16),
  ]
}

function blendWithOverlay(lum: number, overlay: OverlayConfig): number {
  const [r, g, b] = hexToRgb(overlay.color)
  const overlayLum = pixelLum(r, g, b)
  return lum * (1 - overlay.opacity) + overlayLum * overlay.opacity
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0.5
  const idx = Math.floor((sorted.length - 1) * p)
  return sorted[idx]
}

/**
 * Prefer white meme text unless the region behind the block is uniformly bright.
 * Uses low-percentile luminance so a dark subject doesn't get drowned out by a bright sky.
 */
function pickContrast(lums: number[]): ContrastColors {
  if (lums.length === 0) return WHITE_ON_DARK

  const sorted = [...lums].sort((a, b) => a - b)
  const avg = lums.reduce((a, b) => a + b, 0) / lums.length
  const p25 = percentile(sorted, 0.25)
  const p75 = percentile(sorted, 0.75)

  // Only use dark text on clearly light, low-contrast backgrounds
  const uniformlyBright = p25 > 0.52 && p75 > 0.62 && avg > 0.58
  return uniformlyBright ? DARK_ON_LIGHT : WHITE_ON_DARK
}

function drawCoverImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  canvasSize: number,
  drawH: number
) {
  const ratio = img.naturalWidth / img.naturalHeight
  const stageRatio = canvasSize / drawH
  let iw: number, ih: number, ix: number, iy: number
  if (ratio > stageRatio) {
    ih = drawH
    iw = drawH * ratio
  } else {
    iw = canvasSize
    ih = canvasSize / ratio
  }
  ix = (canvasSize - iw) / 2
  iy = (drawH - ih) / 2
  ctx.drawImage(img, ix, iy, iw, ih)
}

export function analyzeRegion(
  img: HTMLImageElement,
  region: { x: number; y: number; width: number },
  canvasSize: number,
  options?: AnalyzeOptions
): ContrastColors {
  const barConfig = options?.barConfig
  const overlay = options?.overlay

  if (barConfig && region.y >= 1 - barConfig.fraction) {
    const [r, g, b] = hexToRgb(barConfig.color)
    return pixelLum(r, g, b) > 0.35 ? DARK_ON_LIGHT : WHITE_ON_DARK
  }

  try {
    const cv = document.createElement("canvas")
    cv.width = canvasSize
    cv.height = canvasSize
    const ctx = cv.getContext("2d", { willReadFrequently: true })
    if (!ctx) return WHITE_ON_DARK

    const drawH = barConfig
      ? Math.round(canvasSize * (1 - barConfig.fraction))
      : canvasSize

    drawCoverImage(ctx, img, canvasSize, drawH)

    const sx = Math.max(0, Math.floor(region.x * canvasSize))
    const sy = Math.max(0, Math.floor(region.y * canvasSize))
    const sw = Math.min(Math.floor(region.width * canvasSize), canvasSize - sx)
    // Sample a box under the text block, not a thin strip
    const sh = Math.min(
      Math.max(Math.floor(canvasSize * 0.14), 24),
      drawH - sy,
      canvasSize - sy
    )
    if (sw <= 0 || sh <= 0) return WHITE_ON_DARK

    const { data } = ctx.getImageData(sx, sy, sw, sh)
    const lums: number[] = []

    for (let i = 0; i < data.length; i += 16) {
      let lum = pixelLum(data[i], data[i + 1], data[i + 2])
      if (overlay) lum = blendWithOverlay(lum, overlay)
      lums.push(lum)
    }

    return pickContrast(lums)
  } catch {
    return WHITE_ON_DARK
  }
}

export function analyzeAllBlocks(
  img: HTMLImageElement,
  blocks: Array<{ x: number; y: number; width: number }>,
  canvasSize: number,
  options?: AnalyzeOptions
): ContrastColors[] {
  return blocks.map((b) => analyzeRegion(img, b, canvasSize, options))
}
