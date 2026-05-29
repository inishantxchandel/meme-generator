"use client"

import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import dynamic from "next/dynamic"
import { useMemoStore } from "./useMemoState"
import { ReactionBar } from "@/components/share/ReactionBar"
import { Header } from "@/components/layout/Header"
import Link from "next/link"
import type { ReactionCounts } from "@/types/meme"
import { copyTextToClipboard } from "@/lib/share/url"

const MemeCanvas = dynamic(
  () => import("@/components/editor/MemeCanvas").then((m) => m.MemeCanvas),
  { ssr: false }
)

interface Props {
  meme: {
    id: string
    image_url: string
    image_path: string
    template_id: string
    caption_top: string | null
    caption_bottom: string | null
    caption_extra: unknown
    export_url: string | null
    metadata: Record<string, unknown>
    created_at: string
  }
  initialCounts: ReactionCounts
}

export function SharePageClient({ meme, initialCounts }: Props) {
  const [copied, setCopied] = useState(false)

  const copyLink = async () => {
    const ok = await copyTextToClipboard(window.location.href)
    if (ok) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <main className="min-h-screen bg-zinc-950 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-96 h-96 bg-violet-600/15 rounded-full blur-3xl" />
      </div>

      <Header
        right={
          <Link
            href="/"
            className="px-4 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-all hover:scale-105 active:scale-95"
          >
            Make your own ✦
          </Link>
        }
      />

      {/* Centered 2-col layout: meme capped at 480px, reactions panel fixed 300px */}
      <div className="relative z-10 max-w-[820px] mx-auto px-4 py-6 flex flex-col md:flex-row gap-5 items-start justify-center">

        {/* Meme canvas */}
        <motion.div
          className="w-full md:w-[480px] shrink-0 rounded-2xl overflow-hidden ring-1 ring-white/10 shadow-2xl shadow-black/50"
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35 }}
          style={{ lineHeight: 0 }}
        >
          {meme.export_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={meme.export_url} alt="Meme" className="w-full block" />
          ) : (
            <ShareMemeCanvas meme={meme} />
          )}
        </motion.div>

        {/* Reactions + actions */}
        <motion.div
          className="w-full md:flex-1 flex flex-col gap-3"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.35 }}
        >
          {/* Reactions */}
          <div className="rounded-2xl bg-zinc-900 border border-white/10 p-5">
            <p className="text-white/50 text-xs uppercase tracking-widest font-medium mb-4 text-center">
              React to this meme
            </p>
            <ReactionBar memeId={meme.id} initialCounts={initialCounts} />
          </div>

          {/* Copy link */}
          <button
            onClick={copyLink}
            className={`w-full py-3 rounded-xl border text-sm font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${
              copied
                ? "bg-green-500/20 border-green-500/50 text-green-400"
                : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 text-white/70"
            }`}
          >
            {copied ? "✓ Copied to clipboard!" : "📋 Copy share link"}
          </button>

          {/* Back to wall */}
          <Link
            href="/wall"
            className="w-full py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-white/50 hover:text-white/80 text-sm font-medium text-center transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
          >
            🏆 Back to Meme Wall
          </Link>

          {/* Caption */}
          {(meme.caption_top || meme.caption_bottom) && (
            <div className="rounded-2xl bg-zinc-900/60 border border-white/10 px-4 py-3 text-center">
              {meme.caption_top && (
                <p className="text-white text-sm font-semibold leading-snug">{meme.caption_top}</p>
              )}
              {meme.caption_bottom && (
                <p className="text-white/70 text-sm mt-1 leading-snug">{meme.caption_bottom}</p>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </main>
  )
}

function ShareMemeCanvas({ meme }: { meme: Props["meme"] }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState(0)
  const { storeReady } = useMemoStore(meme)

  // Measure container — canvas must match exactly to fill the card
  useEffect(() => {
    if (!containerRef.current) return
    const ro = new ResizeObserver(([e]) => {
      const w = (e.target as HTMLElement).offsetWidth
      if (w > 0) setSize(w)
    })
    ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  return (
    <div ref={containerRef} className="w-full aspect-square" style={{ lineHeight: 0 }}>
      {storeReady && size > 0 ? (
        <MemeCanvas width={size} height={size} previewMode />
      ) : (
        <div className="w-full h-full bg-zinc-900 animate-pulse" />
      )}
    </div>
  )
}
