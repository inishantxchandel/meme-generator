"use client"

import { useCallback, useRef, useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useUpload } from "@/hooks/useUpload"
import { useMemeStore } from "@/store/memeStore"
import { WebcamCapture } from "./WebcamCapture"
import compressImage from "browser-image-compression"

function isHeicFile(file: File): boolean {
  return (
    file.type === "image/heic" ||
    file.type === "image/heif" ||
    /\.(heic|heif)$/i.test(file.name)
  )
}

async function toJpeg(file: File): Promise<File> {
  const heic2any = (await import("heic2any")).default as (opts: {
    blob: Blob
    toType: string
    quality?: number
  }) => Promise<Blob | Blob[]>
  const result = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.92 })
  const blob = Array.isArray(result) ? result[0] : result
  return new File([blob], file.name.replace(/\.(heic|heif)$/i, ".jpg"), { type: "image/jpeg" })
}

export function UploadZone() {
  const [isDragging, setIsDragging] = useState(false)
  const [showWebcam, setShowWebcam] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const { upload } = useUpload()
  const { isUploading, uploadError } = useMemeStore()

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/") && !isHeicFile(file)) return

      let processedFile = file
      if (isHeicFile(file)) {
        try {
          processedFile = await toJpeg(file)
        } catch {
          // fallback: attempt compress anyway
        }
      }

      const compressed = await compressImage(processedFile, {
        maxSizeMB: 4,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      })
      await upload(compressed as File)
    },
    [upload]
  )

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    [handleFile]
  )

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const onDragLeave = () => setIsDragging(false)

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return
      for (const item of items) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile()
          if (file) handleFile(file)
          break
        }
      }
    }
    document.addEventListener("paste", onPaste)
    return () => document.removeEventListener("paste", onPaste)
  }, [handleFile])

  return (
    <>
      <motion.div
        className={`
          relative flex flex-col items-center justify-center
          min-h-[280px] rounded-2xl border-2 border-dashed
          cursor-pointer select-none transition-all duration-200
          ${isDragging
            ? "border-violet-400 bg-violet-950/40 scale-[1.01]"
            : "border-white/20 bg-white/5 hover:border-violet-400/60 hover:bg-white/10"
          }
          ${isUploading ? "pointer-events-none opacity-60" : ""}
        `}
        onClick={() => !isUploading && inputRef.current?.click()}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*,.heic,.heif"
          className="hidden"
          onChange={onInputChange}
        />

        <AnimatePresence mode="wait">
          {isUploading ? (
            <motion.div
              key="uploading"
              className="flex flex-col items-center gap-5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="relative">
                <div className="w-20 h-20 rounded-full border-4 border-violet-500/30 border-t-violet-400 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center text-2xl">📸</div>
              </div>
              <div className="text-center">
                <p className="text-white font-semibold text-lg">Uploading photo</p>
                <p className="text-white/45 text-sm mt-1">Getting Claude ready to analyze...</p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="idle"
              className="flex flex-col items-center gap-6 p-8 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="text-7xl"
                animate={isDragging ? { scale: 1.3, rotate: -5 } : { scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                📸
              </motion.div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  {isDragging ? "Drop it!" : "Drop a photo here"}
                </h2>
                <p className="text-white/55 text-sm">
                  or click to browse · paste from clipboard
                </p>
              </div>

              <div className="flex gap-3 mt-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowWebcam(true)
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 text-sm font-medium transition-colors cursor-pointer"
                >
                  📷 Use Camera
                </motion.button>
              </div>

              <p className="text-white/45 text-xs mt-2">
                JPEG, PNG, GIF, WebP, HEIC/HEIF · Max 5MB
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <AnimatePresence>
        {uploadError && (
          <motion.div
            className="mt-4 px-4 py-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-sm text-center"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            {uploadError}
          </motion.div>
        )}
      </AnimatePresence>

      <WebcamCapture
        open={showWebcam}
        onClose={() => setShowWebcam(false)}
        onCapture={handleFile}
      />
    </>
  )
}
