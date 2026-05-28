"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import type { ReactionCounts, ReactionEmoji } from "@/types/meme"

const VALID_EMOJIS: ReactionEmoji[] = ["😂", "👍", "🔥", "💀"]

function getReactorId(): string {
  if (typeof window === "undefined") return ""
  let id = localStorage.getItem("reactor_id")
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem("reactor_id", id)
  }
  return id
}

function loadReacted(memeId: string): Set<ReactionEmoji> {
  if (typeof window === "undefined") return new Set()
  try {
    const raw = localStorage.getItem(`reacted-${memeId}`)
    if (!raw) return new Set()
    const arr: string[] = JSON.parse(raw)
    return new Set(arr.filter((e): e is ReactionEmoji => VALID_EMOJIS.includes(e as ReactionEmoji)))
  } catch {
    return new Set()
  }
}

function saveReacted(memeId: string, set: Set<ReactionEmoji>) {
  try {
    localStorage.setItem(`reacted-${memeId}`, JSON.stringify([...set]))
  } catch { /* quota */ }
}

export function useReactions(memeId: string, initial: ReactionCounts) {
  const [counts, setCounts] = useState<ReactionCounts>(initial)
  // Initialise from localStorage so refresh doesn't reset reacted state
  const [reacted, setReacted] = useState<Set<ReactionEmoji>>(() => loadReacted(memeId))
  const [latestEmoji, setLatestEmoji] = useState<ReactionEmoji | null>(null)

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`reactions:${memeId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "reactions", filter: `meme_id=eq.${memeId}` },
        (payload) => {
          const emoji = payload.new.emoji as ReactionEmoji
          setCounts((prev) => ({ ...prev, [emoji]: (prev[emoji] || 0) + 1 }))
          setLatestEmoji(emoji)
          setTimeout(() => setLatestEmoji(null), 1500)
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [memeId])

  const revert = useCallback((emoji: ReactionEmoji) => {
    setCounts((prev) => ({ ...prev, [emoji]: Math.max(0, (prev[emoji] || 0) - 1) }))
    setReacted((prev) => {
      const next = new Set(prev)
      next.delete(emoji)
      saveReacted(memeId, next)
      return next
    })
  }, [memeId])

  const react = useCallback(async (emoji: ReactionEmoji) => {
    if (reacted.has(emoji)) return

    // Optimistic update
    const next = new Set([...reacted, emoji])
    setReacted(next)
    saveReacted(memeId, next)
    setCounts((prev) => ({ ...prev, [emoji]: (prev[emoji] || 0) + 1 }))

    try {
      const res = await fetch(`/api/memes/${memeId}/reactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emoji, reactorId: getReactorId() }),
      })
      const data = await res.json()

      if (data.deduplicated) {
        // Reaction already exists in DB — revert the phantom count +1
        // but KEEP emoji in reacted + localStorage so button stays highlighted
        // and re-react is blocked
        setCounts((prev) => ({ ...prev, [emoji]: Math.max(0, (prev[emoji] || 0) - 1) }))
      }
    } catch {
      // Network error — full revert so user can retry
      revert(emoji)
    }
  }, [memeId, reacted, revert])

  return { counts, reacted, react, latestEmoji }
}
