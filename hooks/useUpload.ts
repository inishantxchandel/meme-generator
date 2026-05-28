"use client"

import { useCallback } from "react"
import { useMemeStore } from "@/store/memeStore"
import { useRouter } from "next/navigation"
import { nanoid } from "nanoid"
import compressImage from "browser-image-compression"

export function useUpload() {
  const { setUpload, setUploading, setUploadError, reset } = useMemeStore()
  const router = useRouter()

  const upload = useCallback(
    async (file: File) => {
      reset()
      setUploading(true)

      try {
        const formData = new FormData()
        formData.append("file", file)

        const res = await fetch("/api/upload", { method: "POST", body: formData })
        const data = await res.json()

        if (!res.ok) {
          setUploadError(data.error || "Upload failed")
          return
        }

        setUpload(data.url, data.path)
        // Pre-set isSuggesting=true before navigation so create page
        // never flashes the empty "No suggestions yet" state
        useMemeStore.getState().setIsSuggesting(true)
        const memeId = nanoid(8)
        router.push(`/create/${memeId}`)
      } catch {
        setUploadError("Network error. Please try again.")
      }
    },
    [setUpload, setUploading, setUploadError, reset, router]
  )

  return { upload }
}
