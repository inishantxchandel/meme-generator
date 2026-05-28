import { NextRequest, NextResponse } from "next/server"
import { getSuggestions } from "@/lib/claude/suggest"

export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const { imageUrl } = await req.json()

    if (!imageUrl || typeof imageUrl !== "string") {
      return NextResponse.json({ error: "imageUrl required" }, { status: 400 })
    }

    const suggestions = await getSuggestions(imageUrl)
    return NextResponse.json({ suggestions })
  } catch (error) {
    console.error("Suggest route error:", error)
    return NextResponse.json({ error: "Failed to generate suggestions" }, { status: 500 })
  }
}
