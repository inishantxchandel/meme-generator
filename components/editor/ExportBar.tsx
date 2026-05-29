"use client"

import { useCallback, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useMemeStore } from "@/store/memeStore"
import {
  copyImageToClipboard,
  copyTextToClipboard,
  toAbsoluteShareUrl,
} from "@/lib/share/url"
import { toast } from "sonner"
import type { MemeCanvasHandle } from "./MemeCanvas"

interface Props {
  canvasRef: React.RefObject<MemeCanvasHandle | null>
}

export function ExportBar({ canvasRef }: Props) {
  const {
    uploadedImageUrl, uploadedImagePath, selectedTemplateId,
    textBlocks, isExporting, setIsExporting, setShareUrl,
    setMemeId, shareUrl,
  } = useMemeStore()

  const [linkCopied, setLinkCopied] = useState(false)
  const [imageCopied, setImageCopied] = useState(false)

  const absoluteShareUrl = shareUrl ? toAbsoluteShareUrl(shareUrl) : ""

  const saveMeme = useCallback(async () => {
    if (!canvasRef.current || isExporting) return
    if (!uploadedImageUrl || !uploadedImagePath) {
      toast.error("Missing upload data — go back and re-upload your photo")
      return
    }

    setIsExporting(true)

    try {
      const dataUrl = await canvasRef.current.exportPng()
      if (!dataUrl) throw new Error("Export failed")

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
        // Non-fatal — meme saves without export_url
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
      if (!res.ok) throw new Error(data.error ?? "Save failed")

      setMemeId(data.id)
      setShareUrl(data.shareUrl)
      toast.success("Meme saved! Share link ready.")
    } catch (e) {
      console.error(e)
      toast.error(e instanceof Error ? e.message : "Save failed. Try again.")
    } finally {
      setIsExporting(false)
    }
  }, [canvasRef, isExporting, uploadedImageUrl, uploadedImagePath, selectedTemplateId, textBlocks, setIsExporting, setShareUrl, setMemeId])

  const downloadPng = useCallback(async () => {
    if (!canvasRef.current) return
    const dataUrl = await canvasRef.current.exportPng()
    if (!dataUrl) {
      toast.error("Could not export image")
      return
    }

    const a = document.createElement("a")
    a.href = dataUrl
    a.download = `meme-${Date.now()}.png`
    a.click()
    toast.success("PNG downloaded!")
  }, [canvasRef])

  const copyImage = useCallback(async () => {
    if (!canvasRef.current) return
    const dataUrl = await canvasRef.current.exportPng()
    if (!dataUrl) {
      toast.error("Could not export image")
      return
    }

    const result = await copyImageToClipboard(dataUrl)
    if (result === "clipboard") {
      setImageCopied(true)
      setTimeout(() => setImageCopied(false), 2000)
      toast.success("Image copied to clipboard!")
    } else if (result === "download") {
      toast.success("Clipboard unavailable — PNG downloaded instead")
    } else {
      toast.error("Copy failed — try Download PNG")
    }
  }, [canvasRef])

  const copyLink = useCallback(async () => {
    if (!shareUrl) {
      toast.error("Save the meme first to get a share link")
      return
    }

    const fullUrl = toAbsoluteShareUrl(shareUrl)
    const ok = await copyTextToClipboard(fullUrl)
    if (ok) {
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
      toast.success("Share link copied!")
    } else {
      toast.error("Could not copy — select the link and copy manually")
    }
  }, [shareUrl])

  return (
    <div className="space-y-3 p-4">
      {!shareUrl ? (
        <motion.button
          onClick={saveMeme}
          disabled={isExporting}
          whileHover={!isExporting ? { scale: 1.02 } : {}}
          whileTap={!isExporting ? { scale: 0.97 } : {}}
          animate={!isExporting ? {
            boxShadow: [
              "0 0 0 0 rgba(124,58,237,0)",
              "0 0 22px 6px rgba(124,58,237,0.35)",
              "0 0 0 0 rgba(124,58,237,0)",
            ],
          } : {}}
          transition={!isExporting ? { duration: 2.2, repeat: Infinity, ease: "easeInOut" } : {}}
          className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-white font-bold text-lg transition-colors flex items-center justify-center gap-2"
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
                {absoluteShareUrl}
              </code>
              <button
                type="button"
                onClick={copyLink}
                className="px-3 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm transition-colors shrink-0 cursor-pointer"
              >
                {linkCopied ? "✓" : "Copy"}
              </button>
            </div>
          </motion.div>

          <a
            href={absoluteShareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full py-2.5 rounded-xl bg-violet-600/20 hover:bg-violet-600/35 border border-violet-500/40 hover:border-violet-500/70 text-violet-300 hover:text-violet-200 font-medium text-center transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            🔗 View Share Page →
          </a>
        </AnimatePresence>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={downloadPng}
          className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/75 hover:text-white text-sm font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          ⬇ PNG
        </button>
        <button
          type="button"
          onClick={copyImage}
          className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/75 hover:text-white text-sm font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          {imageCopied ? "✓ Copied" : "📋 Copy image"}
        </button>
      </div>
    </div>
  )
}
