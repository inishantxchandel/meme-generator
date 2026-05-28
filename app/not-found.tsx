import Link from "next/link"

export default function NotFound() {
  return (
    <main className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-4">💀</div>
        <h1 className="text-3xl font-black text-white mb-2">404</h1>
        <p className="text-white/50 mb-6">This meme has left the chat.</p>
        <Link
          href="/"
          className="px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-medium transition-all hover:scale-105"
        >
          Make a new one →
        </Link>
      </div>
    </main>
  )
}
