import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import type { ReactionCounts, ReactionEmoji } from "@/types/meme"

const VALID_EMOJIS: ReactionEmoji[] = ["😂", "👍", "🔥", "💀"]

const EMPTY_COUNTS: ReactionCounts = { "😂": 0, "👍": 0, "🔥": 0, "💀": 0 }

function rowsToCounts(rows: { emoji: string }[]): ReactionCounts {
  const counts = { ...EMPTY_COUNTS }
  rows.forEach((r) => {
    if (r.emoji in counts) counts[r.emoji as ReactionEmoji]++
  })
  return counts
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const reactorId = req.nextUrl.searchParams.get("reactorId")
    const supabase = createServerClient()

    const { data: reactionRows, error } = await supabase
      .from("reactions")
      .select("emoji, reactor_id")
      .eq("meme_id", id)

    if (error) {
      console.error("Reactions GET error:", error)
      return NextResponse.json({ error: "Failed to load reactions" }, { status: 500 })
    }

    const counts = rowsToCounts(reactionRows ?? [])
    const myReactions: ReactionEmoji[] =
      reactorId && typeof reactorId === "string"
        ? (reactionRows ?? [])
            .filter((r) => r.reactor_id === reactorId)
            .map((r) => r.emoji)
            .filter((e): e is ReactionEmoji => VALID_EMOJIS.includes(e as ReactionEmoji))
        : []

    return NextResponse.json({ counts, myReactions })
  } catch (error) {
    console.error("Reactions GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

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

    if (error && error.code !== "23505") {
      console.error("Reaction insert error:", error)
      return NextResponse.json({ error: "Failed to save reaction" }, { status: 500 })
    }

    const { data: reactionRows } = await supabase
      .from("reactions")
      .select("emoji, reactor_id")
      .eq("meme_id", id)

    const counts = rowsToCounts(reactionRows ?? [])
    const myReactions = (reactionRows ?? [])
      .filter((r) => r.reactor_id === reactorId)
      .map((r) => r.emoji)
      .filter((e): e is ReactionEmoji => VALID_EMOJIS.includes(e as ReactionEmoji))

    return NextResponse.json({
      success: true,
      deduplicated: error?.code === "23505",
      counts,
      myReactions,
    })
  } catch (error) {
    console.error("Reactions POST error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
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

    const { error } = await supabase
      .from("reactions")
      .delete()
      .eq("meme_id", id)
      .eq("emoji", emoji)
      .eq("reactor_id", reactorId)

    if (error) {
      console.error("Reaction delete error:", error)
      return NextResponse.json({ error: "Failed to remove reaction" }, { status: 500 })
    }

    const { data: reactionRows } = await supabase
      .from("reactions")
      .select("emoji, reactor_id")
      .eq("meme_id", id)

    const counts = rowsToCounts(reactionRows ?? [])
    const myReactions = (reactionRows ?? [])
      .filter((r) => r.reactor_id === reactorId)
      .map((r) => r.emoji)
      .filter((e): e is ReactionEmoji => VALID_EMOJIS.includes(e as ReactionEmoji))

    return NextResponse.json({ success: true, counts, myReactions })
  } catch (error) {
    console.error("Reactions DELETE error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
