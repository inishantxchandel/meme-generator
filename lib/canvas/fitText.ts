/** Shrink font size until wrapped text fits inside a box (no ellipsis). */
export function fitFontSizeToBox(
  text: string,
  boxWidth: number,
  boxHeight: number,
  baseFontSize: number,
  lineHeight: number,
  minFontSize = 9
): number {
  if (boxWidth <= 0 || boxHeight <= 0) return baseFontSize

  const lines = text.split("\n")
  let size = baseFontSize

  while (size > minFontSize) {
    const charW = size * 0.52
    const charsPerLine = Math.max(1, Math.floor(boxWidth / charW))
    const lineCount = lines.reduce(
      (sum, line) => sum + Math.max(1, Math.ceil(line.length / charsPerLine)),
      0
    )
    if (lineCount * size * lineHeight <= boxHeight) return size
    size -= 1
  }

  return minFontSize
}

export function blockInCaptionBar(blockY: number, barFraction?: number): boolean {
  return !!barFraction && blockY >= 1 - barFraction
}
