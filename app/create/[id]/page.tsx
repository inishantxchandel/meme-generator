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
  "Detecting the vibe...",
  "Consulting the meme gods...",
  "Crafting six bangers...",
  "Picking the funniest angles...",
  "Almost ready...",
]

const TEMPLATE_LABELS = [
  { name: "Classic Impact", icon: "💥" },
  { name: "Caption Below", icon: "📝" },
  { name: "Drake Energy", icon: "👀" },
  { name: "This Is Fine", icon: "🔥" },
  { name: "Galaxy Brain", icon: "🧠" },
  { name: "Chaos Mode", icon: "💀" },
]

function AiLoadingOverlay() {
  const [msgIdx, setMsgIdx] = useState(0)
  const [activeCard, setActiveCard] = useState(0)
  const { uploadedImageUrl } = useMemeStore()

  useEffect(() => {
    const msgTimer = setInterval(() => {
      setMsgIdx((i) => (i + 1) % AI_LOADING_MESSAGES.length)
    }, 2400)
    return () => clearInterval(msgTimer)
  }, [])

  useEffect(() => {
    const cardTimer = setInterval(() => {
      setActiveCard((i) => (i + 1) % 6)
    }, 2000)
    return () => clearInterval(cardTimer)
  }, [])

  return (
    <motion.div
      className="py-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Top row: thumbnail + status */}
      <motion.div
        className="flex items-center gap-5 mb-8 max-w-sm mx-auto"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {uploadedImageUrl && (
          <div className="relative shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={uploadedImageUrl}
              alt="Uploaded"
              className="w-16 h-16 object-cover rounded-xl ring-2 ring-violet-500/60 shadow-xl shadow-violet-500/20"
            />
            <motion.div
              className="absolute inset-0 rounded-xl bg-linear-to-b from-violet-500/40 via-transparent to-transparent"
              animate={{ y: ["0%", "100%", "0%"] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
            <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full bg-violet-600 flex items-center justify-center">
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
                className="block w-3 h-3 border-2 border-white border-t-transparent rounded-full"
              />
            </div>
          </div>
        )}

        <div>
          <div className="flex items-center gap-2 mb-1">
            <motion.div
              className="w-2 h-2 rounded-full bg-violet-400"
              animate={{ opacity: [0.4, 1, 0.4], scale: [0.8, 1.2, 0.8] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
            <span className="text-violet-400 text-xs font-semibold uppercase tracking-widest">
              AI generating
            </span>
          </div>
          <AnimatePresence mode="wait">
            <motion.p
              key={msgIdx}
              className="text-white font-semibold text-base"
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.45 }}
            >
              {AI_LOADING_MESSAGES[msgIdx]}
            </motion.p>
          </AnimatePresence>
          <p className="text-white/40 text-xs mt-0.5">
            Claude is writing custom captions
          </p>
        </div>
      </motion.div>

      {/* Animated card grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-lg md:max-w-none mx-auto md:mx-0">
        {TEMPLATE_LABELS.map((t, i) => (
          <motion.div
            key={i}
            className={`rounded-2xl overflow-hidden border transition-all duration-300 ${
              activeCard === i
                ? "border-violet-500/60 shadow-lg shadow-violet-500/20 bg-zinc-900"
                : "border-white/8 bg-white/4"
            }`}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07, duration: 0.35 }}
          >
            {/* Card image area */}
            <div className="w-full aspect-square relative overflow-hidden bg-zinc-900">
              {/* Base shimmer */}
              <motion.div
                className="absolute inset-0 bg-linear-to-br from-zinc-800 via-zinc-900 to-zinc-800"
                animate={{ opacity: [0.5, 0.9, 0.5] }}
                transition={{ duration: 3.5, repeat: Infinity, delay: i * 0.3 }}
              />

              {/* Active card: scanning glow */}
              {activeCard === i && (
                <motion.div
                  className="absolute inset-0 bg-linear-to-b from-violet-500/25 via-violet-500/10 to-transparent"
                  animate={{ y: ["0%", "100%", "0%"] }}
                  transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
                />
              )}

              {/* Horizontal scan line */}
              <motion.div
                className="absolute inset-x-0 h-px bg-violet-400/30"
                animate={{ y: ["0%", "100%"] }}
                transition={{ duration: 3, repeat: Infinity, delay: i * 0.35, ease: "linear" }}
              />

              {/* Center status */}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                <motion.span
                  className="text-3xl"
                  animate={activeCard === i
                    ? { scale: [1, 1.1, 1], opacity: [0.8, 1, 0.8] }
                    : { scale: 1, opacity: 0.5 }
                  }
                  transition={{ duration: 2, repeat: activeCard === i ? Infinity : 0, ease: "easeInOut" }}
                >
                  {t.icon}
                </motion.span>
                {activeCard === i ? (
                  <motion.div
                    className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-600/80 border border-violet-400/40"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <motion.span
                      className="block w-2.5 h-2.5 border-2 border-white border-t-transparent rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1.1, repeat: Infinity, ease: "linear" }}
                    />
                    <span className="text-white text-[11px] font-semibold">Writing...</span>
                  </motion.div>
                ) : (
                  <div className="flex gap-1">
                    {[0, 1, 2].map((j) => (
                      <motion.div
                        key={j}
                        className="w-1 h-1 rounded-full bg-white/20"
                        animate={{ opacity: [0.2, 0.6, 0.2] }}
                        transition={{ duration: 1.2, repeat: Infinity, delay: j * 0.2 + i * 0.1 }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Card footer */}
            <div className="px-3 py-2.5 border-t border-white/8 flex items-center justify-between gap-2">
              <span className={`text-xs font-medium transition-colors ${activeCard === i ? "text-white/80" : "text-white/35"}`}>
                {t.name}
              </span>
              {activeCard === i && (
                <motion.div
                  className="flex gap-0.5"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {[0, 1, 2, 3].map((j) => (
                    <motion.div
                      key={j}
                      className="w-1 h-3 rounded-full bg-violet-400"
                      animate={{ scaleY: [0.3, 1, 0.3] }}
                      transition={{ duration: 1.1, repeat: Infinity, delay: j * 0.2 }}
                    />
                  ))}
                </motion.div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}

export default function CreatePage() {
  const router = useRouter()
  const { uploadedImageUrl, isSuggesting, suggestions, suggestError } = useMemeStore()
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
    <main className="min-h-screen bg-zinc-950 overflow-x-hidden">
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
                        ? "bg-violet-600 text-white shadow cursor-pointer"
                        : disabled
                        ? "text-white/25 cursor-not-allowed"
                        : "text-white/60 hover:text-white hover:bg-white/10 cursor-pointer"
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
          {/* AI loading overlay — shown until we have results (covers initial render race) */}
          {!suggestions.length && !suggestError ? (
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
                className="flex items-center gap-2 mb-5 px-4 py-2 rounded-xl bg-white/8 hover:bg-white/14 border border-white/15 hover:border-white/30 text-white/90 hover:text-white transition-all text-sm font-semibold cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              >
                <span className="text-base leading-none" aria-hidden>←</span>
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
                  <p className="text-white/60 text-xs font-medium text-center mt-2">
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
