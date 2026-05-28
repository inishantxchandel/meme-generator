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
  const { counts, reacted, toggleReaction, latestEmoji, synced } = useReactions(memeId, initialCounts)
  const total = Object.values(counts).reduce((a, b) => a + b, 0)
  const myCount = reacted.size

  const footerText =
    myCount > 0
      ? `You reacted with ${myCount} emoji${myCount !== 1 ? "s" : ""} · tap again to remove`
      : total > 0
      ? `${total} reaction${total !== 1 ? "s" : ""} total`
      : "Be the first to react"

  return (
    <div className="relative">
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

      <div className="grid grid-cols-3 gap-3 max-w-[280px] mx-auto">
        {REACTIONS.slice(0, 3).map(({ emoji, label }) => (
          <ReactionButton
            key={emoji}
            emoji={emoji}
            label={label}
            count={counts[emoji] || 0}
            selected={reacted.has(emoji)}
            synced={synced}
            onToggle={() => toggleReaction(emoji)}
          />
        ))}
      </div>
      <div className="flex justify-center mt-3">
        <ReactionButton
          emoji={REACTIONS[3].emoji}
          label={REACTIONS[3].label}
          count={counts[REACTIONS[3].emoji] || 0}
          selected={reacted.has(REACTIONS[3].emoji)}
          synced={synced}
          onToggle={() => toggleReaction(REACTIONS[3].emoji)}
        />
      </div>

      <p className="text-center text-white/30 text-xs mt-3 min-h-[2.5rem] flex items-center justify-center px-2 leading-snug">
        {footerText}
      </p>
    </div>
  )
}

function ReactionButton({
  emoji,
  label,
  count,
  selected,
  synced,
  onToggle,
}: {
  emoji: ReactionEmoji
  label: string
  count: number
  selected: boolean
  synced: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={selected}
      aria-label={selected ? `Remove ${label} reaction` : `React with ${label}`}
      className={`
        flex flex-col items-center justify-center gap-1
        w-[72px] h-[88px] px-2 py-2 rounded-2xl
        border-2 transition-colors duration-200 cursor-pointer
        ${selected
          ? "bg-violet-600/40 border-violet-400 text-white shadow-lg shadow-violet-500/20"
          : "bg-white/5 border-transparent text-white/70 hover:bg-white/10 hover:border-white/20"
        }
        ${!synced ? "opacity-70" : ""}
      `}
    >
      <span className="text-3xl leading-none">{emoji}</span>
      <span className="text-sm font-bold tabular-nums leading-none">{count}</span>
      <span
        className={`text-[10px] leading-tight text-center h-6 flex items-center justify-center w-full ${
          selected ? "text-violet-200" : "text-white/40"
        }`}
      >
        {label}
      </span>
    </button>
  )
}
