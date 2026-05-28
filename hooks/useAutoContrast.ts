"use client"

import { useEffect } from "react"
import { useMemeStore } from "@/store/memeStore"
import { analyzeAllBlocks } from "@/lib/canvas/analyzeContrast"
import { TEMPLATES } from "@/lib/templates/definitions"

const imageCache = new Map<string, HTMLImageElement>()

function loadImage(src: string): Promise<HTMLImageElement> {
  if (imageCache.has(src)) return Promise.resolve(imageCache.get(src)!)
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    img.crossOrigin = "anonymous"
    img.onload = () => { imageCache.set(src, img); resolve(img) }
    img.onerror = reject
    img.src = src
  })
}

export function useAutoContrast(canvasSize: number) {
  // Only use these for the deps array — effect reads state directly to avoid stale closure
  const uploadedImageUrl = useMemeStore((s) => s.uploadedImageUrl)
  const selectedTemplateId = useMemeStore((s) => s.selectedTemplateId)

  useEffect(() => {
    if (canvasSize < 50) return

    // Read from store.getState() at execution time — NOT from the render closure.
    // This ensures we always use the textBlocks that exist AFTER swapTemplate ran,
    // not the stale snapshot captured when this effect was scheduled.
    const { uploadedImageUrl: url, textBlocks, updateTextBlock } = useMemeStore.getState()
    if (!url || !textBlocks.length) return

    const template = TEMPLATES[selectedTemplateId]
    const barConfig = template?.bottomBarFraction
      ? { fraction: template.bottomBarFraction, color: template.bottomBarColor ?? "#FFFFFF" }
      : undefined

    loadImage(url)
      .then((img) => {
        // Re-read textBlocks from store again after async image load — template might have
        // changed again while image was loading; don't apply stale colors
        const { textBlocks: currentBlocks, selectedTemplateId: currentTemplateId, updateTextBlock: update } =
          useMemeStore.getState()

        // Abort if template changed between effect fire and image load completion
        if (currentTemplateId !== selectedTemplateId) return

        const colors = analyzeAllBlocks(img, currentBlocks, canvasSize, barConfig)
        colors.forEach((cc, i) => {
          const block = currentBlocks[i]
          if (!block) return
          update(block.id, {
            fill: cc.fill,
            stroke: cc.stroke,
            strokeWidth: cc.strokeWidth,
            shadowEnabled: cc.shadowEnabled,
            shadowColor: cc.shadowColor,
            shadowBlur: cc.shadowBlur,
          })
        })
      })
      .catch(() => { /* CORS / network error — keep current colors */ })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploadedImageUrl, selectedTemplateId, Math.round(canvasSize / 50)])
}
