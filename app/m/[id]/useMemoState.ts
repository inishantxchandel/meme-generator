"use client"

import { useEffect, useState } from "react"
import { useMemeStore } from "@/store/memeStore"
import { TEMPLATES } from "@/lib/templates/definitions"

interface MemeData {
  image_url: string
  template_id: string
  caption_top: string | null
  caption_bottom: string | null
  metadata: Record<string, unknown>
}

const TOP_ROLES = new Set(["top", "center", "label1", "overlay"])

export function useMemoStore(meme: MemeData) {
  const { setUpload, updateTextBlock } = useMemeStore()
  const [storeReady, setStoreReady] = useState(false)
  const [canvasSize, setCanvasSize] = useState(480)

  useEffect(() => {
    const updateSize = () => setCanvasSize(Math.min(window.innerWidth - 32, 480))
    updateSize()
    window.addEventListener("resize", updateSize)
    return () => window.removeEventListener("resize", updateSize)
  }, [])

  useEffect(() => {
    setUpload(meme.image_url, "")

    const template = TEMPLATES[meme.template_id]
    if (template) {
      const textBlocks = template.textBlocks.map((block) => ({
        ...block,
        defaultText: TOP_ROLES.has(block.role)
          ? meme.caption_top || meme.caption_bottom || block.defaultText
          : meme.caption_bottom || meme.caption_top || block.defaultText,
      }))

      // Set all store textBlocks in one pass via updateTextBlock per block
      // First set selectedTemplateId via store internals — use the zustand set directly
      useMemeStore.setState({ selectedTemplateId: meme.template_id, textBlocks })
    }

    setStoreReady(true)
  }, [meme.image_url, meme.template_id]) // eslint-disable-line react-hooks/exhaustive-deps

  return { storeReady, canvasSize }
}
