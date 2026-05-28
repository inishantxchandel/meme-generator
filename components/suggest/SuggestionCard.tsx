"use client"

import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import { TEMPLATES } from "@/lib/templates/definitions"
import { analyzeAllBlocks } from "@/lib/canvas/analyzeContrast"
import type { Suggestion } from "@/types/meme"
import type { TextBlock } from "@/types/template"

// CanvasRenderer is SSR-unsafe — lazy import at module level is fine since
// SuggestionCard itself is only rendered inside a client boundary.
import dynamic from "next/dynamic"
const CanvasRenderer = dynamic(
  () => import("@/components/editor/CanvasRenderer").then((m) => m.CanvasRenderer),
  { ssr: false }
)

const VIBE_COLORS: Record<string, string> = {
  ironic: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  relatable: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  absurdist: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  dark: "bg-zinc-700/40 text-zinc-300 border-zinc-500/30",
  wholesome: "bg-pink-500/20 text-pink-300 border-pink-500/30",
  unhinged: "bg-red-500/20 text-red-300 border-red-500/30",
}

const TOP_ROLES = new Set(["top", "center", "label1", "overlay"])

function loadImageEl(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    img.crossOrigin = "anonymous"
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

/**
 * Build textBlocks for this suggestion — same mapping as selectSuggestion in store.
 * Applies contrast-aware colors so colors in preview match what editor will show.
 */
function buildTextBlocks(
  suggestion: Suggestion,
  contrastColors: ReturnType<typeof analyzeAllBlocks>
): TextBlock[] {
  const template = TEMPLATES[suggestion.templateId]
  if (!template) return []

  return template.textBlocks.map((block, i) => {
    const text = TOP_ROLES.has(block.role)
      ? suggestion.captionTop || suggestion.captionBottom || block.defaultText
      : suggestion.captionBottom || suggestion.captionTop || block.defaultText

    const cc = contrastColors[i]
    return {
      ...block,
      defaultText: text,
      fill: cc?.fill ?? block.fill,
      stroke: cc?.stroke ?? block.stroke,
      strokeWidth: cc?.strokeWidth ?? block.strokeWidth,
      shadowEnabled: cc?.shadowEnabled ?? block.shadowEnabled,
      shadowColor: cc?.shadowColor ?? block.shadowColor,
      shadowBlur: cc?.shadowBlur ?? block.shadowBlur,
    }
  })
}

interface Props {
  suggestion: Suggestion
  imageUrl: string
  index: number
  selected: boolean
  onClick: () => void
}

export function SuggestionCard({ suggestion, imageUrl, index, selected, onClick }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [canvasSize, setCanvasSize] = useState(200)
  const [contrastColors, setContrastColors] = useState<ReturnType<typeof analyzeAllBlocks>>([])
  const template = TEMPLATES[suggestion.templateId]

  // Measure container so CanvasRenderer fills the card exactly
  useEffect(() => {
    if (!containerRef.current) return
    const ro = new ResizeObserver(([entry]) => {
      const w = (entry.target as HTMLElement).offsetWidth
      if (w > 0) setCanvasSize(w)
    })
    ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  // Analyze image contrast once image + size are known, then rebuild textBlocks
  useEffect(() => {
    if (!template || canvasSize < 10) return
    const barConfig = template.bottomBarFraction
      ? { fraction: template.bottomBarFraction, color: template.bottomBarColor ?? "#FFFFFF" }
      : undefined
    loadImageEl(imageUrl)
      .then((img) => setContrastColors(analyzeAllBlocks(img, template.textBlocks, canvasSize, barConfig)))
      .catch(() => setContrastColors([]))
  }, [imageUrl, suggestion.templateId, canvasSize]) // eslint-disable-line react-hooks/exhaustive-deps

  const textBlocks = buildTextBlocks(suggestion, contrastColors)

  // Summary text for the info bar — mirrors what CanvasRenderer will show
  const topText = textBlocks.find((b) => TOP_ROLES.has(b.role))?.defaultText ?? ""
  const bottomText = textBlocks.find((b) => !TOP_ROLES.has(b.role))?.defaultText ?? ""

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.03, y: -2 }}
      whileTap={{ scale: 0.97 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.3 }}
      className={`
        relative rounded-2xl overflow-hidden text-left w-full
        transition-all duration-200
        ${selected
          ? "ring-2 ring-violet-400 shadow-lg shadow-violet-500/30"
          : "ring-1 ring-white/10 hover:ring-white/30"
        }
      `}
    >
      {/* Canvas preview — fills full card */}
      <div
        ref={containerRef}
        className="w-full aspect-square overflow-hidden"
        style={{ lineHeight: 0 }}
      >
        {canvasSize > 10 && (
          <CanvasRenderer
            imageUrl={imageUrl}
            templateId={suggestion.templateId}
            textBlocks={textBlocks}
            width={canvasSize}
            height={canvasSize}
            previewMode={true}
          />
        )}
      </div>

      {/* Info bar — overlaid at bottom of image */}
      <div className="absolute bottom-0 left-0 right-0 p-2.5 bg-linear-to-t from-black/80 via-black/50 to-transparent">
        <div className="flex items-center justify-between gap-1 mb-1">
          <span className="text-white/70 text-[11px] font-medium">
            {template?.name ?? suggestion.templateId}
          </span>
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium shrink-0 ${
              VIBE_COLORS[suggestion.vibe] ?? "bg-white/10 text-white/50"
            }`}
          >
            {suggestion.vibe}
          </span>
        </div>
        <p className="text-white text-[11px] leading-snug line-clamp-2">
          {topText && <span className="block font-semibold">{topText}</span>}
          {bottomText && bottomText !== topText && (
            <span className="block text-white/70 mt-0.5">{bottomText}</span>
          )}
        </p>
      </div>

      {selected && (
        <motion.div
          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-violet-600 border-2 border-white flex items-center justify-center text-white text-xs font-bold shadow-lg"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 15 }}
        >
          ✓
        </motion.div>
      )}
    </motion.button>
  )
}
