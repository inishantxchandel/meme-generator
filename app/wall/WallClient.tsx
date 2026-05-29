"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { Header } from "@/components/layout/Header"
import { WallMemePreview } from "@/components/wall/WallMemePreview"

interface Meme {
  id: string
  image_url: string
  export_url: string | null
  caption_top: string | null
  caption_bottom: string | null
  template_id: string
  created_at: string
}

export function WallClient({ memes }: { memes: Meme[] }) {
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
            className="px-4 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-all hover:scale-105 active:scale-95"
          >
            + Create meme
          </Link>
        }
      />

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8">
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-black text-white">🏆 Meme Wall</h1>
          <p className="text-white/40 text-sm mt-1">
            {memes.length > 0
              ? `${memes.length} meme${memes.length !== 1 ? "s" : ""} created today`
              : "Today's creations"}
          </p>
        </motion.div>

        {memes.length === 0 ? (
          <motion.div
            className="text-center py-24"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="text-5xl mb-4">🌵</div>
            <p className="text-white/30 text-lg mb-6">No memes yet today.</p>
            <Link
              href="/"
              className="px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold transition-all hover:scale-105 active:scale-95"
            >
              Be the first — create one →
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-w-lg md:max-w-none mx-auto md:mx-0">
            {memes.map((meme, i) => (
              <motion.div
                key={meme.id}
                className="h-full"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, duration: 0.3 }}
              >
                <Link
                  href={`/m/${meme.id}`}
                  className="flex flex-col h-full w-full rounded-2xl overflow-hidden bg-zinc-900 border border-white/10 hover:border-violet-500/50 md:hover:scale-[1.02] hover:shadow-xl hover:shadow-violet-500/10 transition-all duration-200 group"
                >
                  <WallMemePreview
                    imageUrl={meme.image_url}
                    exportUrl={meme.export_url}
                    templateId={meme.template_id}
                    captionTop={meme.caption_top}
                    captionBottom={meme.caption_bottom}
                  />
                  <div className="p-3 flex flex-col flex-1 justify-between">
                    <p className="text-white text-xs font-semibold line-clamp-2 leading-snug">
                      {meme.caption_top
                        ? `"${meme.caption_top}"`
                        : meme.caption_bottom
                        ? `"${meme.caption_bottom}"`
                        : "View meme"}
                    </p>
                    <p className="text-white/35 text-xs mt-1.5">
                      {new Date(meme.created_at).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
