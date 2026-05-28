"use client"

import { useCallback, useEffect } from "react"
import { applyContrastToTextBlocks } from "@/lib/canvas/applyContrast"
import { useMemeStore } from "@/store/memeStore"

export function useAutoContrast(canvasSize: number) {
  const uploadedImageUrl = useMemeStore((s) => s.uploadedImageUrl)
  const selectedTemplateId = useMemeStore((s) => s.selectedTemplateId)

  const refreshContrast = useCallback(() => {
    if (canvasSize < 50) return

    const { uploadedImageUrl: url, selectedTemplateId: templateId, textBlocks } =
      useMemeStore.getState()
    if (!url || !textBlocks.length) return

    const runFor = templateId
    applyContrastToTextBlocks(url, templateId, textBlocks, canvasSize)
      .then((merged) => {
        const state = useMemeStore.getState()
        if (state.selectedTemplateId !== runFor) return
        useMemeStore.setState({ textBlocks: merged })
      })
      .catch(() => { /* CORS / network — keep current colors */ })
  }, [canvasSize])

  useEffect(() => {
    refreshContrast()
  }, [uploadedImageUrl, selectedTemplateId, Math.round(canvasSize / 50), refreshContrast])

  return refreshContrast
}
