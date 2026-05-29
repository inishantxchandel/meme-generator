"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import Link from "next/link"
import { Header } from "@/components/layout/Header"
import { WallCard, type WallMeme } from "@/components/wall/WallCard"

type SortMode = "latest" | "popular"

export function WallClient({ memes }: { memes: WallMeme[] }) {
  const router = useRouter()
  const [sortMode, setSortMode] = useState<SortMode>("latest")

  // Bust Next.js router cache on mount so navigating here always shows fresh memes
  useEffect(() => {
    router.refresh()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Live totals from WallCard useReactions hooks — used for accurate Popular sort
  const liveTotalsRef = useRef<Record<string, number>>({})
  const [liveTotalsVersion, setLiveTotalsVersion] = useState(0)

  const updateTotal = useCallback((id: string, total: number) => {
    if (liveTotalsRef.current[id] !== total) {
      liveTotalsRef.current = { ...liveTotalsRef.current, [id]: total }
      setLiveTotalsVersion((v) => v + 1)
    }
  }, [])

  const sorted = useMemo(() => {
    if (sortMode === "popular") {
      return [...memes].sort((a, b) => {
        const aTotal = liveTotalsRef.current[a.id] ?? a.totalReactions
        const bTotal = liveTotalsRef.current[b.id] ?? b.totalReactions
        return bTotal - aTotal
      })
    }
    return memes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memes, sortMode, liveTotalsVersion])

  return (
    <main className="min-h-screen bg-zinc-950 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
      </div>

      <Header
        right={
          <Link
            href="/"
            className="px-4 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            + Create meme
          </Link>
        }
      />

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8">
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black text-white">🏆 Meme Wall</h1>
              <p className="text-white/45 text-sm mt-1">
                {memes.length > 0
                  ? `${memes.length} meme${memes.length !== 1 ? "s" : ""} created today`
                  : "Today's creations"}
              </p>
            </div>

            {/* Filter bar */}
            {memes.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-white/35 text-xs uppercase tracking-widest">Sort</span>
                {(["latest", "popular"] as SortMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setSortMode(mode)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all cursor-pointer hover:scale-105 active:scale-95 ${
                      sortMode === mode
                        ? "bg-violet-600 text-white shadow-lg shadow-violet-500/20"
                        : "bg-white/8 text-white/55 hover:bg-white/15 hover:text-white border border-white/10"
                    }`}
                  >
                    {mode === "latest" ? "🕐 Latest" : "🔥 Popular"}
                  </button>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {memes.length === 0 ? (
          <motion.div
            className="text-center py-24"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <motion.div
              className="text-5xl mb-4"
              animate={{ rotate: [0, -8, 8, 0] }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              🌵
            </motion.div>
            <p className="text-white/35 text-lg mb-6">No memes yet today.</p>
            <Link
              href="/"
              className="px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              Be the first — create one →
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-w-lg md:max-w-none mx-auto md:mx-0">
            {sorted.map((meme, i) => (
              <WallCard key={meme.id} meme={meme} index={i} onTotalChange={updateTotal} />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
