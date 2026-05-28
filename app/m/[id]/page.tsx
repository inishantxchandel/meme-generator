import { notFound } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { SharePageClient } from "./SharePageClient"
import type { Metadata } from "next"

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const supabase = createServerClient()
  const { data: meme } = await supabase.from("memes").select("caption_top, caption_bottom").eq("id", id).single()

  if (!meme) return { title: "Meme not found" }

  const title = [meme.caption_top, meme.caption_bottom].filter(Boolean).join(" / ") || "Check out this meme!"
  return {
    title: `${title} — SnapMeme`,
    description: "React to this meme on SnapMeme",
  }
}

export default async function SharePage({ params }: Props) {
  const { id } = await params
  const supabase = createServerClient()

  const { data: meme, error } = await supabase.from("memes").select("*").eq("id", id).single()
  if (error || !meme) notFound()

  const { data: reactionRows } = await supabase.from("reactions").select("emoji").eq("meme_id", id)
  const counts = { "😂": 0, "👍": 0, "🔥": 0, "💀": 0 } as Record<string, number>
  reactionRows?.forEach((r) => { if (r.emoji in counts) counts[r.emoji]++ })

  return (
    <SharePageClient
      meme={meme}
      initialCounts={counts as { "😂": number; "👍": number; "🔥": number; "💀": number }}
    />
  )
}
