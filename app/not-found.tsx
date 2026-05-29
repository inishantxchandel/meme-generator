"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Header } from "@/components/layout/Header"

export default function NotFound() {
  return (
    <main className="min-h-screen bg-zinc-950">
      <Header />
      <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)]">
        <div className="text-center px-4">
          <motion.div
            className="text-6xl mb-4 inline-block"
            animate={{ rotate: [0, -15, 15, -8, 8, 0], scale: [1, 1.1, 1] }}
            transition={{ duration: 0.7, delay: 0.3 }}
          >
            💀
          </motion.div>
          <h1 className="text-3xl font-black text-white mb-2">404</h1>
          <p className="text-white/50 mb-6">This meme has left the chat.</p>
          <Link
            href="/"
            className="px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-medium transition-all hover:scale-105 active:scale-95"
          >
            Make a new one →
          </Link>
        </div>
      </div>
    </main>
  )
}
