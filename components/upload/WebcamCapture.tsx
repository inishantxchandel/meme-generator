"use client"

import { useRef, useEffect, useState, useCallback } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { motion } from "framer-motion"

type FacingMode = "user" | "environment"

interface Props {
  open: boolean
  onClose: () => void
  onCapture: (file: File) => void
}

export function WebcamCapture({ open, onClose, onCapture }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [facing, setFacing] = useState<FacingMode>("user")
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [switching, setSwitching] = useState(false)

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    setReady(false)
  }, [])

  const startCamera = useCallback(async (mode: FacingMode) => {
    stopCamera()
    setSwitching(true)
    setError(null)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = () => {
          setReady(true)
          setSwitching(false)
        }
      }
    } catch {
      setError("Camera access denied. Please allow camera permissions.")
      setSwitching(false)
    }
  }, [stopCamera])

  useEffect(() => {
    if (open) {
      setError(null)
      setFacing("user")
      startCamera("user")
    } else {
      stopCamera()
    }
    return () => stopCamera()
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const flipCamera = () => {
    const next: FacingMode = facing === "user" ? "environment" : "user"
    setFacing(next)
    startCamera(next)
  }

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
        const ctx = canvas.getContext("2d")
        if (!ctx) return

        canvas.width = video.videoWidth
        canvas.height = video.videoHeight

        // Mirror selfie preview so saved photo matches what user saw
        if (facing === "user") {
          ctx.translate(canvas.width, 0)
          ctx.scale(-1, 1)
        }
        ctx.drawImage(video, 0, 0)
        if (facing === "user") {
          ctx.setTransform(1, 0, 0, 1, 0, 0)
        }

        canvas.toBlob((blob) => {
          if (!blob) return
          const file = new File([blob], `webcam-${Date.now()}.jpg`, { type: "image/jpeg" })
          onCapture(file)
          onClose()
        }, "image/jpeg", 0.9)
      }
    }, 1000)
  }, [onCapture, onClose, facing])

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
                className={`w-full rounded-t-lg bg-black aspect-[3/4] object-cover ${
                  facing === "user" ? "-scale-x-100" : ""
                }`}
              />

              <button
                type="button"
                onClick={flipCamera}
                disabled={!ready || switching || countdown !== null}
                aria-label={facing === "user" ? "Switch to back camera" : "Switch to front camera"}
                className="absolute top-3 right-3 w-11 h-11 rounded-full bg-black/50 border border-white/20 text-white text-lg flex items-center justify-center backdrop-blur-sm hover:bg-black/70 disabled:opacity-40 transition-colors"
              >
                🔄
              </button>

              {(switching || !ready) && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">
                  <span className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}

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
              disabled={!ready || countdown !== null || switching}
              className="flex-1 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold transition-colors"
            >
              {countdown !== null ? `Taking shot in ${countdown}...` : "📸 Snap"}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white/70 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
