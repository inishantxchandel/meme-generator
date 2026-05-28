import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { nanoid } from "nanoid"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      imageUrl,
      imagePath,
      templateId,
      captionTop,
      captionBottom,
      captionExtra,
      exportUrl,
      metadata,
    } = body

    if (!imageUrl || !imagePath || !templateId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = createServerClient()
    const id = nanoid(8)

    const { error } = await supabase.from("memes").insert({
      id,
      image_url: imageUrl,
      image_path: imagePath,
      template_id: templateId,
      caption_top: captionTop ?? null,
      caption_bottom: captionBottom ?? null,
      caption_extra: captionExtra ?? null,
      export_url: exportUrl ?? null,
      metadata: metadata ?? {},
    })

    if (error) {
      console.error("Meme insert error:", error)
      return NextResponse.json({ error: "Failed to save meme" }, { status: 500 })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || ""
    return NextResponse.json({ id, shareUrl: `${appUrl}/m/${id}` })
  } catch (error) {
    console.error("Memes POST error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 50)

    const supabase = createServerClient()

    const { data, error } = await supabase
      .from("memes")
      .select("id, created_at, image_url, template_id, caption_top, caption_bottom, export_url")
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) {
      return NextResponse.json({ error: "Failed to fetch memes" }, { status: 500 })
    }

    return NextResponse.json({ memes: data })
  } catch (error) {
    console.error("Memes GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
