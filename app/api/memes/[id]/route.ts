import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createServerClient()

    const { data: meme, error } = await supabase
      .from("memes")
      .select("*")
      .eq("id", id)
      .single()

    if (error || !meme) {
      return NextResponse.json({ error: "Meme not found" }, { status: 404 })
    }

    const { data: reactionRows } = await supabase
      .from("reactions")
      .select("emoji")
      .eq("meme_id", id)

    const counts = { "😂": 0, "👍": 0, "🔥": 0, "💀": 0 } as Record<string, number>
    reactionRows?.forEach((r) => {
      if (r.emoji in counts) counts[r.emoji]++
    })

    return NextResponse.json({ meme, reactions: counts })
  } catch (error) {
    console.error("Meme GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const supabase = createServerClient()

    const { error } = await supabase
      .from("memes")
      .update({ export_url: body.exportUrl })
      .eq("id", id)

    if (error) {
      return NextResponse.json({ error: "Update failed" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Meme PATCH error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
