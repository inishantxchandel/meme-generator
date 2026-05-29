"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { WallMemePreview } from "./WallMemePreview"
import { useReactions } from "@/hooks/useReactions"
import type { ReactionCounts, ReactionEmoji } from "@/types/meme"

const REACTION_EMOJIS: ReactionEmoji[] = ["😂", "👍", "🔥", "💀"]
const EMPTY_COUNTS: ReactionCounts = { "😂": 0, "👍": 0, "🔥": 0, "💀": 0 }

export interface WallMeme {
  id: string
  image_url: string
  export_url: string | null
  caption_top: string | null
  caption_bottom: string | null
  template_id: string
  created_at: string
  reactionCounts: Record<string, number>
  totalReactions: number
}

interface Props {
  meme: WallMeme
  index: number
}

export function WallCard({ meme, index }: Props) {
  const initialCounts: ReactionCounts = {
    "😂": meme.reactionCounts["😂"] ?? 0,
    "👍": meme.reactionCounts["👍"] ?? 0,
    "🔥": meme.reactionCounts["🔥"] ?? 0,
    "💀": meme.reactionCounts["💀"] ?? 0,
  }

  const { counts, reacted, toggleReaction } = useReactions(meme.id, initialCounts)
  const total = Object.values(counts).reduce((a, b) => a + b, 0)

  const caption = meme.caption_top
    ? `"${meme.caption_top}"`
    : meme.caption_bottom
    ? `"${meme.caption_bottom}"`
    : "View meme"

  return (
    <motion.div
      className="h-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
    >
      <div className="relative flex flex-col h-full w-full rounded-2xl overflow-hidden bg-zinc-900 border border-white/10 hover:border-violet-500/50 hover:shadow-xl hover:shadow-violet-500/10 transition-all duration-200 group">

        {/* Meme preview — navigates to share page */}
        <Link href={`/m/${meme.id}`} className="block flex-shrink-0">
          <WallMemePreview
            imageUrl={meme.image_url}
            exportUrl={meme.export_url}
            templateId={meme.template_id}
            captionTop={meme.caption_top}
            captionBottom={meme.caption_bottom}
          />
        </Link>

        {/* Footer */}
        <div className="p-3 flex flex-col flex-1 justify-between">
          {/* Caption + timestamp */}
          <Link href={`/m/${meme.id}`} className="block cursor-pointer">
            <p className="text-white text-xs font-semibold line-clamp-2 leading-snug">
              {caption}
            </p>
            <div className="flex items-center justify-between mt-1">
              <p className="text-white/35 text-xs">
                {new Date(meme.created_at).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
              {total > 0 && (
                <span className="text-white/45 text-xs tabular-nums">
                  {total} {total === 1 ? "rxn" : "rxns"}
                </span>
              )}
            </div>
          </Link>

          {/* Quick-react row */}
          <div className="flex gap-1 mt-2 pt-2 border-t border-white/8">
            {REACTION_EMOJIS.map((emoji) => (
              <motion.button
                key={emoji}
                type="button"
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.82 }}
                transition={{ type: "spring", stiffness: 400, damping: 15 }}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  toggleReaction(emoji)
                }}
                className={`flex items-center gap-0.5 px-2 py-1 rounded-lg text-xs transition-colors cursor-pointer ${
                  reacted.has(emoji)
                    ? "bg-violet-600/35 border border-violet-500/60 text-white"
                    : "bg-white/8 hover:bg-white/15 border border-transparent text-white/60 hover:text-white"
                }`}
              >
                <span>{emoji}</span>
                {counts[emoji as ReactionEmoji] > 0 && (
                  <span className="tabular-nums text-[11px] font-medium">
                    {counts[emoji as ReactionEmoji]}
                  </span>
                )}
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// Re-export for WallClient to use in empty-counts fallback
export { EMPTY_COUNTS }
