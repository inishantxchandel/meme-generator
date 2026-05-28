import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

const VALID_EMOJIS = ["😂", "👍", "🔥", "💀"]

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { emoji, reactorId } = await req.json()

    if (!VALID_EMOJIS.includes(emoji)) {
      return NextResponse.json({ error: "Invalid emoji" }, { status: 400 })
    }

    if (!reactorId || typeof reactorId !== "string") {
      return NextResponse.json({ error: "reactorId required" }, { status: 400 })
    }

    const supabase = createServerClient()

    const { error } = await supabase.from("reactions").insert({
      meme_id: id,
      emoji,
      reactor_id: reactorId,
    })

    if (error) {
      // Unique constraint violation = already reacted, silently succeed
      if (error.code === "23505") {
        return NextResponse.json({ success: true, deduplicated: true })
      }
      console.error("Reaction insert error:", error)
      return NextResponse.json({ error: "Failed to save reaction" }, { status: 500 })
    }

    const { data: reactionRows } = await supabase
      .from("reactions")
      .select("emoji")
      .eq("meme_id", id)

    const counts = { "😂": 0, "👍": 0, "🔥": 0, "💀": 0 } as Record<string, number>
    reactionRows?.forEach((r) => {
      if (r.emoji in counts) counts[r.emoji]++
    })

    return NextResponse.json({ success: true, counts })
  } catch (error) {
    console.error("Reactions POST error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
