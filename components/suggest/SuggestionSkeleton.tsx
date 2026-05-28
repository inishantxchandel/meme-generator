"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { motion } from "framer-motion"

export function SuggestionSkeleton() {
  return (
    <div>
      {/* Header skeleton */}
      <motion.div
        className="flex items-center justify-between mb-5"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <Skeleton className="h-7 w-40 bg-white/8 rounded-lg" />
        <Skeleton className="h-6 w-16 bg-white/8 rounded-full" />
      </motion.div>

      {/* Card skeletons */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <motion.div
            key={i}
            className="rounded-2xl overflow-hidden bg-white/5 border border-white/10"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
          >
            <div className="w-full aspect-square relative overflow-hidden">
              <Skeleton className="w-full h-full bg-white/8" />
              {/* Shimmer overlay */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
                animate={{ x: ["-100%", "100%"] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1, ease: "easeInOut" }}
              />
            </div>
            <div className="p-3 space-y-2">
              <Skeleton className="h-3 w-3/4 bg-white/8 rounded" />
              <Skeleton className="h-3 w-1/2 bg-white/8 rounded" />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
