"use client"

import { useEffect, useRef, useState } from "react"
import dynamic from "next/dynamic"
import { TEMPLATES } from "@/lib/templates/definitions"
import type { TextBlock } from "@/types/template"

const CanvasRenderer = dynamic(
  () => import("@/components/editor/CanvasRenderer").then((m) => m.CanvasRenderer),
  { ssr: false }
)

const TOP_ROLES = new Set(["top", "center", "label1", "overlay"])

interface Props {
  imageUrl: string
  exportUrl: string | null
  templateId: string
  captionTop: string | null
  captionBottom: string | null
}

export function WallMemePreview({ imageUrl, exportUrl, templateId, captionTop, captionBottom }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState(0)

  useEffect(() => {
    if (!containerRef.current) return
    const ro = new ResizeObserver(([e]) => {
      const w = (e.target as HTMLElement).offsetWidth
      if (w > 0) setSize(w)
    })
    ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  // If exported PNG exists — fastest, most accurate
  if (exportUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={exportUrl} alt="meme" className="w-full aspect-square min-h-[280px] sm:min-h-0 object-cover" />
    )
  }

  // Build textBlocks from template + captions
  const template = TEMPLATES[templateId]
  const textBlocks: TextBlock[] = template
    ? template.textBlocks.map((block) => ({
        ...block,
        defaultText: TOP_ROLES.has(block.role)
          ? captionTop || captionBottom || block.defaultText
          : captionBottom || captionTop || block.defaultText,
      }))
    : []

  return (
    <div ref={containerRef} className="w-full aspect-square min-h-[280px] sm:min-h-0 overflow-hidden" style={{ lineHeight: 0 }}>
      {size > 0 && template ? (
        <CanvasRenderer
          imageUrl={imageUrl}
          templateId={templateId}
          textBlocks={textBlocks}
          width={size}
          height={size}
          previewMode
        />
      ) : (
        <div className="w-full h-full bg-zinc-800 animate-pulse" />
      )}
    </div>
  )
}
