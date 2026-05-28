"use client"

import { useRef, useEffect, useState, useCallback } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { motion } from "framer-motion"

interface Props {
  open: boolean
  onClose: () => void
  onCapture: (file: File) => void
}

export function WebcamCapture({ open, onClose, onCapture }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [countdown, setCountdown] = useState<number | null>(null)

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = () => setReady(true)
      }
    } catch {
      setError("Camera access denied. Please allow camera permissions.")
    }
  }, [])

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    setReady(false)
  }, [])

  useEffect(() => {
    if (open) {
      setError(null)
      startCamera()
    } else {
      stopCamera()
    }
    return () => stopCamera()
  }, [open, startCamera, stopCamera])

  const snap = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return

    setCountdown(3)
    let count = 3
    const interval = setInterval(() => {
      count--
      setCountdown(count)
      if (count === 0) {
        clearInterval(interval)
        setCountdown(null)

        const video = videoRef.current!
        const canvas = canvasRef.current!
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        canvas.getContext("2d")?.drawImage(video, 0, 0)

        canvas.toBlob((blob) => {
          if (!blob) return
          const file = new File([blob], `webcam-${Date.now()}.jpg`, { type: "image/jpeg" })
          onCapture(file)
          onClose()
        }, "image/jpeg", 0.9)
      }
    }, 1000)
  }, [onCapture, onClose])

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg bg-zinc-900 border-zinc-700 p-0 overflow-hidden">
        <DialogTitle className="sr-only">Camera Capture</DialogTitle>
        <div className="relative">
          {error ? (
            <div className="flex items-center justify-center h-64 text-red-400 text-sm p-8 text-center">
              {error}
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full rounded-t-lg"
              />
              <canvas ref={canvasRef} className="hidden" />

              {countdown !== null && (
                <motion.div
                  className="absolute inset-0 flex items-center justify-center bg-black/40"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <motion.span
                    key={countdown}
                    className="text-8xl font-bold text-white"
                    initial={{ scale: 1.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    {countdown || "📸"}
                  </motion.span>
                </motion.div>
              )}
            </>
          )}

          <div className="p-4 flex gap-3">
            <button
              onClick={snap}
              disabled={!ready || countdown !== null}
              className="flex-1 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold transition-all hover:scale-105 active:scale-95"
            >
              {countdown !== null ? `Taking shot in ${countdown}...` : "📸 Snap"}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white/70 transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
