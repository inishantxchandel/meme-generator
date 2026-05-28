/** Normalize API share path or legacy full URL into an absolute link. */
export function toAbsoluteShareUrl(shareUrl: string, origin?: string): string {
  if (shareUrl.startsWith("http://") || shareUrl.startsWith("https://")) {
    return shareUrl
  }
  const base = origin ?? (typeof window !== "undefined" ? window.location.origin : "")
  const path = shareUrl.startsWith("/") ? shareUrl : `/${shareUrl}`
  return `${base}${path}`
}

export function dataUrlToBlob(dataUrl: string): Blob {
  const [header, data] = dataUrl.split(",")
  const mime = header.match(/:(.*?);/)?.[1] ?? "image/png"
  const binary = atob(data)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new Blob([bytes], { type: mime })
}

export async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    /* fall through */
  }

  try {
    const ta = document.createElement("textarea")
    ta.value = text
    ta.setAttribute("readonly", "")
    ta.style.position = "fixed"
    ta.style.left = "-9999px"
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand("copy")
    document.body.removeChild(ta)
    return ok
  } catch {
    return false
  }
}

export async function copyImageToClipboard(dataUrl: string): Promise<"clipboard" | "download" | "failed"> {
  const blob = dataUrlToBlob(dataUrl)

  try {
    if (typeof ClipboardItem !== "undefined" && navigator.clipboard?.write) {
      await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })])
      return "clipboard"
    }
  } catch {
    /* fall through */
  }

  try {
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `meme-${Date.now()}.png`
    a.click()
    URL.revokeObjectURL(url)
    return "download"
  } catch {
    return "failed"
  }
}
