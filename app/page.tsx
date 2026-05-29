"use client"

import { useEffect } from "react"
import { motion } from "framer-motion"
import { UploadZone } from "@/components/upload/UploadZone"
import { useMemeStore } from "@/store/memeStore"
import { Header } from "@/components/layout/Header"
import Link from "next/link"

const STEPS = [
  { icon: "📤", label: "Upload" },
  { icon: "✨", label: "AI Suggests" },
  { icon: "👆", label: "Pick" },
  { icon: "🎨", label: "Edit" },
  { icon: "🔗", label: "Share" },
  { icon: "🤣", label: "React" },
]

export default function Home() {
  const { setUploading, setUploadError, setIsSuggesting } = useMemeStore()
  useEffect(() => {
    setUploading(false)
    setUploadError(null)
    setIsSuggesting(false)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <main className="min-h-screen bg-zinc-950 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl" />
      </div>

      <Header
        right={
          <Link
            href="/wall"
            className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-white/8 hover:bg-white/14 border border-white/10 hover:border-violet-500/40 text-white/70 hover:text-white text-sm font-medium transition-all hover:scale-105 active:scale-95"
          >
            🏆 <span>Meme Wall</span>
          </Link>
        }
      />

      <div className="relative z-10 max-w-3xl mx-auto px-4 pt-8 pb-12">
        {/* Hero */}
        <motion.div
          className="text-center mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/20 border border-violet-500/30 text-violet-300 text-xs font-medium mb-4">
            ✦ AI-powered · No signup · Ship instantly
          </div>

          <h1 className="text-5xl md:text-6xl font-black text-white tracking-tight mb-3">
            Snap
            <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
              Meme
            </span>
          </h1>
          <p className="text-white/60 text-lg max-w-md mx-auto leading-relaxed">
            Upload a photo. Get 6 AI-generated meme ideas.<br className="hidden sm:block" /> Edit live. Share instantly.
          </p>
        </motion.div>

        {/* How it works — above upload so it's in initial viewport */}
        <motion.div
          className="mb-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <p className="text-center text-white/55 text-xs font-semibold uppercase tracking-widest mb-3">How it works</p>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-x-1 gap-y-3 sm:gap-y-0 max-w-xs sm:max-w-lg mx-auto">
            {STEPS.map((step, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5 py-1.5 relative">
                <span className="text-xl leading-none">{step.icon}</span>
                <span className="text-white/70 text-xs font-medium whitespace-nowrap">{step.label}</span>
                {i < STEPS.length - 1 && (
                  <span className="absolute right-0 top-1/3 -translate-y-1/2 text-white/35 text-xs hidden sm:block">›</span>
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Upload */}
        <UploadZone />
      </div>
    </main>
  )
}
