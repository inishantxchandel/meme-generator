"use client"

import { useEffect, useRef, useState } from "react"
import dynamic from "next/dynamic"
import { motion, AnimatePresence } from "framer-motion"
import { useMemeStore } from "@/store/memeStore"
import { useSuggestions } from "@/hooks/useSuggestions"
import { SuggestionGrid } from "@/components/suggest/SuggestionGrid"
import { EditorToolbar } from "@/components/editor/EditorToolbar"
import { ExportBar } from "@/components/editor/ExportBar"
import type { MemeCanvasHandle } from "@/components/editor/MemeCanvas"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Header } from "@/components/layout/Header"

const MemeCanvas = dynamic(
  () => import("@/components/editor/MemeCanvas").then((m) => m.MemeCanvas),
  { ssr: false }
)

type Step = "suggest" | "edit"

const AI_LOADING_MESSAGES = [
  "Reading your photo...",
  "Detecting vibe...",
  "Consulting the meme gods...",
  "Crafting six bangers...",
  "Almost there...",
]

function AiLoadingOverlay() {
  const [msgIdx, setMsgIdx] = useState(0)
  const { uploadedImageUrl } = useMemeStore()

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIdx((i) => (i + 1) % AI_LOADING_MESSAGES.length)
    }, 1800)
    return () => clearInterval(interval)
  }, [])

  return (
    <motion.div
      className="flex flex-col items-center justify-center min-h-[60vh] gap-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Photo thumbnail */}
      {uploadedImageUrl && (
        <motion.div
          className="relative"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={uploadedImageUrl}
            alt="Uploaded"
            className="w-40 h-40 object-cover rounded-2xl ring-2 ring-violet-500/50 shadow-2xl shadow-violet-500/20"
          />
          {/* Scanning animation */}
          <motion.div
            className="absolute inset-0 rounded-2xl bg-gradient-to-b from-violet-500/30 via-transparent to-transparent"
            animate={{ y: ["0%", "100%", "0%"] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
          <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center shadow-lg">
            <motion.span
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="block w-4 h-4 border-2 border-white border-t-transparent rounded-full"
            />
          </div>
        </motion.div>
      )}

      {/* Message */}
      <div className="text-center space-y-3">
        <AnimatePresence mode="wait">
          <motion.p
            key={msgIdx}
            className="text-xl font-semibold text-white"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
          >
            {AI_LOADING_MESSAGES[msgIdx]}
          </motion.p>
        </AnimatePresence>
        <p className="text-white/40 text-sm">
          Claude is reading your image and writing custom captions
        </p>
      </div>

      {/* Progress dots */}
      <div className="flex gap-2">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full bg-violet-500"
            animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </div>
    </motion.div>
  )
}

export default function CreatePage() {
  const router = useRouter()
  const { uploadedImageUrl, isSuggesting, suggestions } = useMemeStore()
  const { fetchSuggestions } = useSuggestions()
  const [step, setStep] = useState<Step>("suggest")
  const canvasRef = useRef<MemeCanvasHandle>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [canvasSize, setCanvasSize] = useState(400)

  useEffect(() => {
    if (!uploadedImageUrl) {
      router.replace("/")
      return
    }
    // Only fetch if we don't already have suggestions (prevents double-fetch on re-render)
    if (suggestions.length === 0) {
      fetchSuggestions()
    }
  }, [uploadedImageUrl]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const updateSize = () => {
      const w = containerRef.current?.offsetWidth ?? window.innerWidth - 32
      setCanvasSize(Math.min(w, 480))
    }
    updateSize()
    window.addEventListener("resize", updateSize)
    return () => window.removeEventListener("resize", updateSize)
  }, [])

  if (!uploadedImageUrl) return null

  return (
    <main className="min-h-screen bg-zinc-950">
      <Header
        right={
          <div className="flex items-center gap-3">
            {/* Step tabs */}
            <div className="flex items-center gap-1 bg-white/5 rounded-full p-1">
              {(["suggest", "edit"] as Step[]).map((s) => {
                const disabled = isSuggesting || (s === "edit" && suggestions.length === 0)
                return (
                  <button
                    key={s}
                    onClick={() => !disabled && setStep(s)}
                    disabled={disabled}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                      step === s
                        ? "bg-violet-600 text-white shadow"
                        : disabled
                        ? "text-white/25 cursor-not-allowed"
                        : "text-white/50 hover:text-white/80 hover:bg-white/10"
                    }`}
                  >
                    {s === "suggest" ? "1. Pick" : "2. Edit"}
                  </button>
                )
              })}
            </div>

            {/* AI status */}
            <div className="hidden sm:flex items-center">
              {isSuggesting ? (
                <span className="flex items-center gap-1.5 text-violet-400 text-xs font-medium">
                  <span className="w-3 h-3 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
                  AI thinking
                </span>
              ) : suggestions.length > 0 ? (
                <span className="text-green-400/70 text-xs">✓ {suggestions.length} ideas ready</span>
              ) : null}
            </div>
          </div>
        }
      />

      <div className="max-w-6xl mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          {/* AI loading overlay — shown while isSuggesting and no results yet */}
          {isSuggesting && suggestions.length === 0 ? (
            <motion.div key="loading">
              <AiLoadingOverlay />
            </motion.div>
          ) : step === "suggest" ? (
            <motion.div
              key="suggest"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
            >
              <SuggestionGrid onSelect={() => setStep("edit")} />
            </motion.div>
          ) : (
            <motion.div
              key="edit"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.25 }}
            >
              <button
                type="button"
                onClick={() => setStep("suggest")}
                className="flex items-center gap-2 mb-5 px-3 py-2 -ml-3 rounded-xl text-white/70 hover:text-white hover:bg-white/5 transition-colors text-sm font-medium"
              >
                <span className="text-lg leading-none" aria-hidden>
                  ←
                </span>
                Back to meme ideas
              </button>

              <div className="flex flex-col lg:flex-row gap-6">
              {/* Canvas */}
              <div className="flex-1 flex flex-col items-center">
                <div ref={containerRef} className="w-full max-w-[480px]">
                  <div
                    className="rounded-2xl overflow-hidden ring-1 ring-white/10 shadow-2xl shadow-black/40"
                    style={{ width: canvasSize, height: canvasSize }}
                  >
                    <MemeCanvas
                      ref={canvasRef}
                      width={canvasSize}
                      height={canvasSize}
                    />
                  </div>
                  <p className="text-white/25 text-xs text-center mt-2">
                    Tap text to select · Double-tap to edit · Drag to move
                  </p>
                </div>
              </div>

              {/* Controls sidebar */}
              <div className="lg:w-80 flex flex-col gap-4">
                <div className="rounded-2xl bg-zinc-900 border border-white/10 overflow-hidden">
                  <div className="px-4 pt-4 pb-2 border-b border-white/10">
                    <h3 className="text-white font-semibold text-sm">Edit Text</h3>
                  </div>
                  <EditorToolbar />
                </div>

                <div className="rounded-2xl bg-zinc-900 border border-white/10 overflow-hidden">
                  <div className="px-4 pt-4 pb-2 border-b border-white/10">
                    <h3 className="text-white font-semibold text-sm">Export & Share</h3>
                  </div>
                  <ExportBar canvasRef={canvasRef} />
                </div>
              </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  )
}
