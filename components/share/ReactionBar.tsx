"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useReactions } from "@/hooks/useReactions"
import type { ReactionCounts, ReactionEmoji } from "@/types/meme"

const REACTIONS: { emoji: ReactionEmoji; label: string }[] = [
  { emoji: "😂", label: "Dead" },
  { emoji: "👍", label: "Nice" },
  { emoji: "🔥", label: "Fire" },
  { emoji: "💀", label: "Killed me" },
]

interface Props {
  memeId: string
  initialCounts: ReactionCounts
}

export function ReactionBar({ memeId, initialCounts }: Props) {
  const { counts, reacted, react, latestEmoji } = useReactions(memeId, initialCounts)
  const total = Object.values(counts).reduce((a, b) => a + b, 0)

  return (
    <div className="relative">
      {/* Floating emoji burst */}
      <AnimatePresence>
        {latestEmoji && (
          <motion.div
            key={`burst-${Date.now()}`}
            className="absolute -top-12 left-1/2 -translate-x-1/2 text-3xl pointer-events-none z-10"
            initial={{ opacity: 1, y: 0, scale: 1 }}
            animate={{ opacity: 0, y: -50, scale: 1.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          >
            {latestEmoji}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-center gap-3 flex-wrap">
        {REACTIONS.map(({ emoji, label }) => {
          const count = counts[emoji] || 0
          const hasReacted = reacted.has(emoji)

          return (
            <motion.button
              key={emoji}
              onClick={() => !hasReacted && react(emoji)}
              disabled={hasReacted}
              whileHover={hasReacted ? {} : { scale: 1.1, y: -2 }}
              whileTap={hasReacted ? {} : { scale: 0.9 }}
              className={`
                flex flex-col items-center gap-1 px-5 py-3 rounded-2xl
                transition-all duration-200 min-w-[72px]
                ${hasReacted
                  ? "bg-violet-600/30 border border-violet-500/60 text-white cursor-default"
                  : "bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:border-white/30 cursor-pointer"
                }
              `}
            >
              <motion.span
                className="text-3xl leading-none"
                animate={hasReacted ? { scale: [1, 1.4, 1] } : {}}
                transition={{ duration: 0.3 }}
              >
                {emoji}
              </motion.span>
              <span className="text-sm font-bold">{count}</span>
              <span className="text-xs text-white/40 hidden sm:block">{label}</span>
            </motion.button>
          )
        })}
      </div>

      {total > 0 && (
        <motion.p
          className="text-center text-white/30 text-xs mt-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {total} reaction{total !== 1 ? "s" : ""} total
        </motion.p>
      )}
    </div>
  )
}
