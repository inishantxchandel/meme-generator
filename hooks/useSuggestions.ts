"use client"

import { useCallback } from "react"
import { useMemeStore } from "@/store/memeStore"

export function useSuggestions() {
  const { uploadedImageUrl, setSuggestions, setIsSuggesting, setSuggestError } = useMemeStore()

  const fetchSuggestions = useCallback(async () => {
    if (!uploadedImageUrl) return

    setIsSuggesting(true)
    setSuggestError(null)

    try {
      const res = await fetch("/api/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: uploadedImageUrl }),
      })

      const data = await res.json()

      if (!res.ok) {
        setSuggestError(data.error || "Failed to generate suggestions")
        return
      }

      setSuggestions(data.suggestions)
    } catch {
      setSuggestError("Network error. Using fallback suggestions.")
    } finally {
      setIsSuggesting(false)
    }
  }, [uploadedImageUrl, setSuggestions, setIsSuggesting, setSuggestError])

  return { fetchSuggestions }
}
