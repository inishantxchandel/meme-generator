import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { nanoid } from "nanoid"

export const maxDuration = 30

const MAX_SIZE = 5 * 1024 * 1024 // 5MB

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 413 })
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Only image files allowed" }, { status: 400 })
    }

    const ext = file.name.split(".").pop() || "jpg"
    const path = `uploads/${nanoid(12)}.${ext}`

    const supabase = createServerClient()
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { error } = await supabase.storage
      .from("meme-images")
      .upload(path, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (error) {
      console.error("Storage upload error:", error)
      return NextResponse.json({ error: "Upload failed" }, { status: 500 })
    }

    const { data: urlData } = supabase.storage.from("meme-images").getPublicUrl(path)

    return NextResponse.json({ url: urlData.publicUrl, path })
  } catch (error) {
    console.error("Upload route error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
