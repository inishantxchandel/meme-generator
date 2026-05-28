"use client"

import Link from "next/link"
import { type ReactNode } from "react"

interface Props {
  right?: ReactNode
  sticky?: boolean
}

export function Header({ right, sticky = true }: Props) {
  return (
    <header
      className={`z-50 bg-zinc-950/80 backdrop-blur-md border-b border-white/10 ${
        sticky ? "sticky top-0" : "relative"
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        <Link
          href="/"
          className="text-white font-black text-xl tracking-tight hover:opacity-80 transition-opacity shrink-0"
        >
          Snap
          <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
            Meme
          </span>
        </Link>

        {right && <div className="flex items-center gap-2">{right}</div>}
      </div>
    </header>
  )
}
