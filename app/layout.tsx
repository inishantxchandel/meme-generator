import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })

export const metadata: Metadata = {
  title: "SnapMeme — Make memes that don't suck",
  description: "AI-powered meme creation. Upload a photo, get 6 AI-generated meme ideas, edit them live, and share instantly.",
  openGraph: {
    title: "SnapMeme — AI Meme Maker",
    description: "Upload a photo. Get 6 AI meme ideas. Ship it.",
    type: "website",
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans bg-zinc-950 text-white min-h-screen antialiased overflow-y-auto`}>
        <TooltipProvider delay={200}>
          {children}
        </TooltipProvider>
        <Toaster richColors position="bottom-center" />
      </body>
    </html>
  )
}
