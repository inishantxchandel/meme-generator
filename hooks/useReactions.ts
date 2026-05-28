"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { getReactorId } from "@/lib/reactions/reactorId"
import type { ReactionCounts, ReactionEmoji } from "@/types/meme"

const VALID_EMOJIS: ReactionEmoji[] = ["😂", "👍", "🔥", "💀"]

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

function applyMyReactions(
  memeId: string,
  myReactions: ReactionEmoji[],
  setReacted: (s: Set<ReactionEmoji>) => void
) {
  const next = new Set(myReactions)
  setReacted(next)
  saveReacted(memeId, next)
}

export function useReactions(memeId: string, initial: ReactionCounts) {
  const [counts, setCounts] = useState<ReactionCounts>(initial)
  const [reacted, setReacted] = useState<Set<ReactionEmoji>>(() => loadReacted(memeId))
  const [latestEmoji, setLatestEmoji] = useState<ReactionEmoji | null>(null)
  const [synced, setSynced] = useState(false)
  const busyRef = useRef<Set<ReactionEmoji>>(new Set())

  // Sync counts + this user's reactions from the server (source of truth)
  useEffect(() => {
    const reactorId = getReactorId()
    if (!reactorId) return

    fetch(`/api/memes/${memeId}/reactions?reactorId=${encodeURIComponent(reactorId)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.counts) setCounts(data.counts)
        if (Array.isArray(data.myReactions)) {
          applyMyReactions(memeId, data.myReactions, setReacted)
        }
        setSynced(true)
      })
      .catch(() => setSynced(true))
  }, [memeId])

  useEffect(() => {
    const supabase = createClient()
    const reactorId = getReactorId()

    const channel = supabase
      .channel(`reactions:${memeId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "reactions", filter: `meme_id=eq.${memeId}` },
        (payload) => {
          // Own reactions are applied from the API response — skip to avoid double counts
          if (payload.new.reactor_id === reactorId) return

          const emoji = payload.new.emoji as ReactionEmoji
          setCounts((prev) => ({ ...prev, [emoji]: (prev[emoji] || 0) + 1 }))
          setLatestEmoji(emoji)
          setTimeout(() => setLatestEmoji(null), 1500)
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "reactions", filter: `meme_id=eq.${memeId}` },
        (payload) => {
          if (payload.old.reactor_id === reactorId) return

          const emoji = payload.old.emoji as ReactionEmoji
          setCounts((prev) => ({ ...prev, [emoji]: Math.max(0, (prev[emoji] || 0) - 1) }))
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [memeId])

  const react = useCallback(async (emoji: ReactionEmoji) => {
    if (reacted.has(emoji) || busyRef.current.has(emoji)) return

    busyRef.current.add(emoji)
    const prevReacted = reacted

    const next = new Set([...reacted, emoji])
    setReacted(next)
    saveReacted(memeId, next)
    setLatestEmoji(emoji)
    setTimeout(() => setLatestEmoji(null), 1500)

    try {
      const res = await fetch(`/api/memes/${memeId}/reactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emoji, reactorId: getReactorId() }),
      })
      const data = await res.json()
      if (data.counts) setCounts(data.counts)
      if (Array.isArray(data.myReactions)) applyMyReactions(memeId, data.myReactions, setReacted)
    } catch {
      setReacted(prevReacted)
      saveReacted(memeId, prevReacted)
    } finally {
      busyRef.current.delete(emoji)
    }
  }, [memeId, reacted])

  const unreact = useCallback(async (emoji: ReactionEmoji) => {
    if (!reacted.has(emoji) || busyRef.current.has(emoji)) return

    busyRef.current.add(emoji)
    const prevReacted = reacted

    const next = new Set(reacted)
    next.delete(emoji)
    setReacted(next)
    saveReacted(memeId, next)

    try {
      const res = await fetch(`/api/memes/${memeId}/reactions`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emoji, reactorId: getReactorId() }),
      })
      const data = await res.json()
      if (data.counts) setCounts(data.counts)
      if (Array.isArray(data.myReactions)) applyMyReactions(memeId, data.myReactions, setReacted)
    } catch {
      setReacted(prevReacted)
      saveReacted(memeId, prevReacted)
    } finally {
      busyRef.current.delete(emoji)
    }
  }, [memeId, reacted])

  const toggleReaction = useCallback(
    (emoji: ReactionEmoji) => {
      if (reacted.has(emoji)) unreact(emoji)
      else react(emoji)
    },
    [reacted, react, unreact]
  )

  return { counts, reacted, toggleReaction, latestEmoji, synced }
}
