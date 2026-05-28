"use client"

import { useCallback, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useMemeStore } from "@/store/memeStore"
import { toast } from "sonner"
import type { MemeCanvasHandle } from "./MemeCanvas"

interface Props {
  canvasRef: React.RefObject<MemeCanvasHandle | null>
}

export function ExportBar({ canvasRef }: Props) {
  const {
    uploadedImageUrl, uploadedImagePath, selectedTemplateId,
    textBlocks, isExporting, setIsExporting, setShareUrl,
    setMemeId, shareUrl, currentMemeId,
  } = useMemeStore()

  const [copied, setCopied] = useState(false)

  const saveMeme = useCallback(async () => {
    if (!canvasRef.current || isExporting) return
    setIsExporting(true)

    try {
      const dataUrl = await canvasRef.current.exportPng()
      if (!dataUrl) throw new Error("Export failed")

      // Upload the rendered PNG so wall + share page both show the final meme
      let exportUrl: string | null = null
      try {
        const blob = await fetch(dataUrl).then((r) => r.blob())
        const pngFile = new File([blob], `meme-${Date.now()}.png`, { type: "image/png" })
        const form = new FormData()
        form.append("file", pngFile)
        const uploadRes = await fetch("/api/upload", { method: "POST", body: form })
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json()
          exportUrl = uploadData.url
        }
      } catch {
        // Non-fatal — meme saves without export_url, wall falls back to canvas render
      }

      const captionTop = textBlocks.find((b) => b.role === "top" || b.role === "label1" || b.role === "center")?.defaultText ?? ""
      const captionBottom = textBlocks.find((b) => b.role === "bottom" || b.role === "label2")?.defaultText ?? ""

      const res = await fetch("/api/memes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: uploadedImageUrl,
          imagePath: uploadedImagePath,
          templateId: selectedTemplateId,
          captionTop,
          captionBottom,
          exportUrl,
          captionExtra: textBlocks.filter(
            (b) => !["top", "bottom", "label1", "label2", "center"].includes(b.role)
          ),
          metadata: { textBlocks },
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      setMemeId(data.id)
      setShareUrl(data.shareUrl)
      toast.success("Meme saved! Share link ready.")
    } catch (e) {
      console.error(e)
      toast.error("Save failed. Try again.")
    } finally {
      setIsExporting(false)
    }
  }, [canvasRef, isExporting, uploadedImageUrl, uploadedImagePath, selectedTemplateId, textBlocks, setIsExporting, setShareUrl, setMemeId])

  const downloadPng = useCallback(async () => {
    if (!canvasRef.current) return
    const dataUrl = await canvasRef.current.exportPng()
    if (!dataUrl) return

    const a = document.createElement("a")
    a.href = dataUrl
    a.download = `meme-${Date.now()}.png`
    a.click()
    toast.success("PNG downloaded!")
  }, [canvasRef])

  const copyToClipboard = useCallback(async () => {
    if (!canvasRef.current) return
    try {
      const dataUrl = await canvasRef.current.exportPng()
      if (!dataUrl) return

      const blob = await fetch(dataUrl).then((r) => r.blob())
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })])
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast.success("Copied to clipboard!")
    } catch {
      toast.error("Copy failed — browser may not support this")
    }
  }, [canvasRef])

  const copyLink = useCallback(() => {
    if (!shareUrl) return
    const fullUrl = `${window.location.origin}${shareUrl}`
    navigator.clipboard.writeText(fullUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success("Share link copied!")
  }, [shareUrl])

  return (
    <div className="space-y-3 p-4">
      {!shareUrl ? (
        <motion.button
          onClick={saveMeme}
          disabled={isExporting}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-lg transition-all flex items-center justify-center gap-2"
        >
          {isExporting ? (
            <>
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Saving...
            </>
          ) : (
            "✨ Save & Get Share Link"
          )}
        </motion.button>
      ) : (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 rounded-xl bg-violet-950/60 border border-violet-500/40"
          >
            <p className="text-violet-300 text-xs mb-2 font-medium">Share link ready!</p>
            <div className="flex gap-2">
              <code className="flex-1 text-white/80 text-xs bg-black/30 rounded-lg px-3 py-2 truncate">
                {`${typeof window !== "undefined" ? window.location.origin : ""}${shareUrl}`}
              </code>
              <button
                onClick={copyLink}
                className="px-3 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm transition-all hover:scale-105"
              >
                {copied ? "✓" : "Copy"}
              </button>
            </div>
          </motion.div>

          {/* View share page */}
          <a
            href={shareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 font-medium text-center transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            🔗 View Share Page →
          </a>
        </AnimatePresence>
      )}

      <div className="flex gap-2">
        <button
          onClick={downloadPng}
          className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/70 text-sm font-medium transition-all hover:scale-105 active:scale-95"
        >
          ⬇ PNG
        </button>
        <button
          onClick={copyToClipboard}
          className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/70 text-sm font-medium transition-all hover:scale-105 active:scale-95"
        >
          {copied ? "✓ Copied" : "📋 Copy"}
        </button>
      </div>
    </div>
  )
}
