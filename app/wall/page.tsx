import { createServerClient } from "@/lib/supabase/server"
import { WallClient } from "./WallClient"

export const revalidate = 30

export default async function WallPage() {
  const supabase = createServerClient()

  const { data: memes } = await supabase
    .from("memes")
    .select("id, image_url, export_url, caption_top, caption_bottom, template_id, created_at")
    .order("created_at", { ascending: false })
    .limit(24)

  return <WallClient memes={memes ?? []} />
}
