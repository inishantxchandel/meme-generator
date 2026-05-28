"use client"

import { useMemeStore } from "@/store/memeStore"
import { SuggestionCard } from "./SuggestionCard"
import { SuggestionSkeleton } from "./SuggestionSkeleton"
import { motion, AnimatePresence } from "framer-motion"

interface Props {
  onSelect: () => void
}

export function SuggestionGrid({ onSelect }: Props) {
  const {
    suggestions,
    isSuggesting,
    suggestError,
    selectedSuggestionIndex,
    uploadedImageUrl,
    selectSuggestion,
  } = useMemeStore()

  // Show skeletons when loading OR when no results yet (prevent empty flash)
  if (isSuggesting || (!suggestions.length && !suggestError)) {
    return <SuggestionSkeleton />
  }

  if (suggestError && !suggestions.length) {
    return (
      <div className="py-12 text-center space-y-3">
        <div className="text-4xl">😬</div>
        <p className="text-red-400 font-medium">{suggestError}</p>
        <p className="text-white/40 text-sm">AI timed out — try uploading again</p>
      </div>
    )
  }

  return (
    <div>
      <motion.div
        className="flex items-center justify-between mb-5"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div>
          <h2 className="text-xl font-bold text-white">Pick your meme</h2>
          {suggestError && (
            <p className="text-yellow-500/70 text-xs mt-0.5">
              ⚠ Fallback suggestions — AI had trouble with that image
            </p>
          )}
        </div>
        <span className="text-white/40 text-sm bg-white/5 px-3 py-1 rounded-full">
          {suggestions.length} ideas
        </span>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-lg md:max-w-none mx-auto md:mx-0">
        <AnimatePresence>
          {suggestions.map((s, i) => (
            <SuggestionCard
              key={s.id}
              suggestion={s}
              imageUrl={uploadedImageUrl!}
              index={i}
              selected={selectedSuggestionIndex === i}
              onClick={() => {
                selectSuggestion(i)
                onSelect()
              }}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
