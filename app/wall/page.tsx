import { createServerClient } from "@/lib/supabase/server"
import { WallClient } from "./WallClient"

export const revalidate = 30

export default async function WallPage() {
  const supabase = createServerClient()

  const { data: memes } = await supabase
    .from("memes")
    .select("id, image_url, export_url, caption_top, caption_bottom, template_id, created_at")
    .order("created_at", { ascending: false })
    .limit(48)

  const memeIds = (memes ?? []).map((m) => m.id)

  const { data: reactionRows } = memeIds.length
    ? await supabase.from("reactions").select("meme_id, emoji").in("meme_id", memeIds)
    : { data: [] as { meme_id: string; emoji: string }[] }

  const countsMap = new Map<string, Record<string, number>>()
  for (const row of reactionRows ?? []) {
    if (!countsMap.has(row.meme_id)) {
      countsMap.set(row.meme_id, { "😂": 0, "👍": 0, "🔥": 0, "💀": 0 })
    }
    const c = countsMap.get(row.meme_id)!
    c[row.emoji] = (c[row.emoji] ?? 0) + 1
  }

  const memesWithCounts = (memes ?? []).map((m) => ({
    ...m,
    reactionCounts: countsMap.get(m.id) ?? { "😂": 0, "👍": 0, "🔥": 0, "💀": 0 },
    totalReactions: Object.values(countsMap.get(m.id) ?? {}).reduce((a, b) => a + b, 0),
  }))

  return <WallClient memes={memesWithCounts} />
}
