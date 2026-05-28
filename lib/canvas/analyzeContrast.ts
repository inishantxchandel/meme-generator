export interface ContrastColors {
  fill: string
  stroke: string
  strokeWidth: number
  shadowEnabled: boolean
  shadowColor: string
  shadowBlur: number
}

const WHITE_ON_DARK: ContrastColors = {
  fill: "#FFFFFF",
  stroke: "#000000",
  strokeWidth: 2,
  shadowEnabled: true,
  shadowColor: "#000000",
  shadowBlur: 6,
}

const DARK_ON_LIGHT: ContrastColors = {
  fill: "#111111",
  stroke: "#FFFFFF",
  strokeWidth: 2,
  shadowEnabled: true,
  shadowColor: "#000000",
  shadowBlur: 4,
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

export interface BarConfig {
  /** Fraction of canvas height (0-1) that is the caption bar, from the bottom */
  fraction: number
  /** CSS hex color of the bar (e.g. "#FFFFFF") */
  color: string
}

/**
 * Draws the image in cover mode onto a temp canvas (clipped to imageFraction height),
 * samples pixels where the text block appears, and returns optimal text colors.
 *
 * For blocks positioned inside the caption bar, returns contrast based on bar color
 * directly — never samples image pixels for those blocks.
 *
 * @param img            Loaded HTMLImageElement
 * @param region         Normalized (0-1) text block x, y, width
 * @param canvasSize     Pixel size of the square rendering canvas
 * @param barConfig      Optional caption bar config (fraction + color)
 */
export function analyzeRegion(
  img: HTMLImageElement,
  region: { x: number; y: number; width: number },
  canvasSize: number,
  barConfig?: BarConfig
): ContrastColors {
  // If this block is inside the caption bar, use bar color for contrast — never image pixels
  if (barConfig && region.y >= 1 - barConfig.fraction) {
    const [r, g, b] = hexToRgb(barConfig.color)
    const lum = pixelLum(r, g, b)
    return lum > 0.35 ? DARK_ON_LIGHT : WHITE_ON_DARK
  }

  try {
    const cv = document.createElement("canvas")
    cv.width = canvasSize
    cv.height = canvasSize
    const ctx = cv.getContext("2d", { willReadFrequently: true })
    if (!ctx) return WHITE_ON_DARK

    // Draw image in cover mode, clipped to the photo area (not into the caption bar)
    const drawH = barConfig
      ? Math.round(canvasSize * (1 - barConfig.fraction))
      : canvasSize

    const ratio = img.naturalWidth / img.naturalHeight
    const stageRatio = canvasSize / drawH
    let iw: number, ih: number, ix: number, iy: number
    if (ratio > stageRatio) { ih = drawH; iw = drawH * ratio }
    else { iw = canvasSize; ih = canvasSize / ratio }
    ix = (canvasSize - iw) / 2
    iy = (drawH - ih) / 2
    ctx.drawImage(img, ix, iy, iw, ih)

    // Sample a 28px horizontal band at the text block's y position
    const sx = Math.max(0, Math.floor(region.x * canvasSize))
    const sy = Math.max(0, Math.floor(region.y * canvasSize))
    const sw = Math.min(Math.floor(region.width * canvasSize), canvasSize - sx)
    const sh = Math.min(28, canvasSize - sy)
    if (sw <= 0 || sh <= 0) return WHITE_ON_DARK

    const { data } = ctx.getImageData(sx, sy, sw, sh)
    let sum = 0, n = 0
    for (let i = 0; i < data.length; i += 32) {
      sum += pixelLum(data[i], data[i + 1], data[i + 2])
      n++
    }

    return (n > 0 ? sum / n : 0.5) > 0.35 ? DARK_ON_LIGHT : WHITE_ON_DARK
  } catch {
    return WHITE_ON_DARK
  }
}

/**
 * Analyzes all text regions and returns ContrastColors per block.
 * Accepts optional barConfig so caption-bar blocks use bar color, not image pixels.
 */
export function analyzeAllBlocks(
  img: HTMLImageElement,
  blocks: Array<{ x: number; y: number; width: number }>,
  canvasSize: number,
  barConfig?: BarConfig
): ContrastColors[] {
  return blocks.map((b) => analyzeRegion(img, b, canvasSize, barConfig))
}
