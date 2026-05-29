"use client"

import { useMemeStore } from "@/store/memeStore"
import { Slider } from "@/components/ui/slider"

const FONTS = [
  { label: "Impact", value: "Impact" },
  { label: "Anton", value: "Anton, sans-serif" },
  { label: "Arial", value: "Arial" },
  { label: "Georgia", value: "Georgia" },
  { label: "Comic Sans", value: "Comic Sans MS, cursive" },
]

const COLORS = [
  { label: "White", value: "#FFFFFF" },
  { label: "Black", value: "#111111" },
  { label: "Yellow", value: "#FFD700" },
  { label: "Red", value: "#FF0040" },
  { label: "Cyan", value: "#00FFFF" },
]

export function EditorToolbar() {
  const { activeTextBlockId, textBlocks, updateTextBlock, addTextBlock, removeTextBlock } = useMemeStore()

  const activeBlock = textBlocks.find((b) => b.id === activeTextBlockId)

  if (!activeTextBlockId || !activeBlock) {
    return (
      <div className="flex flex-col items-center gap-3 py-4 px-4">
        <p className="text-white/40 text-sm text-center">Tap text on canvas to edit style</p>
        <button
          onClick={addTextBlock}
          className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-all hover:scale-105 active:scale-95 cursor-pointer"
        >
          + Add Text
        </button>
      </div>
    )
  }

  const update = (patch: Parameters<typeof updateTextBlock>[1]) =>
    updateTextBlock(activeTextBlockId, patch)

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Block actions */}
      <div className="flex gap-2">
        <button
          onClick={addTextBlock}
          className="flex-1 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 text-sm font-medium transition-all cursor-pointer"
        >
          + Add Text
        </button>
        <button
          onClick={() => removeTextBlock(activeTextBlockId)}
          className="px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/40 text-red-300 text-sm font-medium transition-all cursor-pointer"
        >
          Delete
        </button>
      </div>
      {/* Font family */}
      <div>
        <label className="text-white/60 text-xs uppercase tracking-wide mb-2 block">Font</label>
        <div className="flex flex-wrap gap-2">
          {FONTS.map((f) => (
            <button
              key={f.value}
              onClick={() => update({ fontFamily: f.value })}
              className={`px-3 py-1.5 rounded-lg text-sm transition-all hover:scale-105 active:scale-95 cursor-pointer ${
                activeBlock.fontFamily === f.value
                  ? "bg-violet-600 text-white"
                  : "bg-white/10 text-white/70 hover:bg-white/20"
              }`}
              style={{ fontFamily: f.value }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Font size */}
      <div>
        <label className="text-white/60 text-xs uppercase tracking-wide mb-2 block">
          Size — {activeBlock.fontSize}
        </label>
        <Slider
          min={16}
          max={120}
          step={2}
          value={[activeBlock.fontSize]}
          onValueChange={(v) => {
            const val = Array.isArray(v) ? v[0] : v
            if (typeof val === "number") update({ fontSize: val })
          }}
          className="w-full"
        />
      </div>

      {/* Color */}
      <div>
        <label className="text-white/60 text-xs uppercase tracking-wide mb-2 block">Color</label>
        <div className="flex gap-2 flex-wrap">
          {COLORS.map((c) => (
            <button
              key={c.value}
              onClick={() => update({ fill: c.value })}
              title={c.label}
              className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 active:scale-95 cursor-pointer ${
                activeBlock.fill === c.value ? "border-violet-400 scale-110" : "border-white/20"
              }`}
              style={{ backgroundColor: c.value }}
            />
          ))}
          <input
            type="color"
            value={activeBlock.fill}
            onChange={(e) => update({ fill: e.target.value })}
            className="w-8 h-8 rounded-full border-2 border-white/20 cursor-pointer overflow-hidden"
            title="Custom color"
          />
        </div>
      </div>

      {/* Stroke */}
      <div>
        <label className="text-white/60 text-xs uppercase tracking-wide mb-2 block">
          Outline width — {activeBlock.strokeWidth}
        </label>
        <Slider
          min={0}
          max={6}
          step={0.5}
          value={[activeBlock.strokeWidth]}
          onValueChange={(v) => {
            const val = Array.isArray(v) ? v[0] : v
            if (typeof val === "number") update({ strokeWidth: val })
          }}
        />
      </div>

      {/* Style & alignment toggles */}
      <div>
        <label className="text-white/60 text-xs uppercase tracking-wide mb-2 block">Style &amp; Align</label>
        <div className="flex gap-2 flex-wrap">
          <ToggleButton
            active={activeBlock.shadowEnabled}
            onClick={() => update({ shadowEnabled: !activeBlock.shadowEnabled })}
            label="Shadow"
          />
          <ToggleButton
            active={activeBlock.upperCase}
            onClick={() => update({ upperCase: !activeBlock.upperCase })}
            label="CAPS"
          />
          <ToggleButton
            active={activeBlock.align === "left"}
            onClick={() => update({ align: "left" })}
            label="← Left"
          />
          <ToggleButton
            active={activeBlock.align === "center"}
            onClick={() => update({ align: "center" })}
            label="≡ Center"
          />
          <ToggleButton
            active={activeBlock.align === "right"}
            onClick={() => update({ align: "right" })}
            label="→ Right"
          />
        </div>
      </div>
    </div>
  )
}

function ToggleButton({
  active,
  onClick,
  label,
}: {
  active: boolean
  onClick: () => void
  label: string
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all hover:scale-105 active:scale-95 cursor-pointer ${
        active ? "bg-violet-600 text-white" : "bg-white/10 text-white/60 hover:bg-white/20"
      }`}
    >
      {label}
    </button>
  )
}
