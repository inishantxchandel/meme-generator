"use client"

import { useRef, forwardRef, useImperativeHandle } from "react"
import { CanvasRenderer, type CanvasRendererHandle } from "./CanvasRenderer"
import { useAutoContrast } from "@/hooks/useAutoContrast"
import { useMemeStore } from "@/store/memeStore"

interface Props {
  width: number
  height: number
  previewMode?: boolean
}

export interface MemeCanvasHandle {
  exportPng: () => Promise<string | null>
}

export const MemeCanvas = forwardRef<MemeCanvasHandle, Props>(
  ({ width, height, previewMode = false }, ref) => {
    const rendererRef = useRef<CanvasRendererHandle>(null)

    const {
      uploadedImageUrl,
      selectedTemplateId,
      textBlocks,
      activeTextBlockId,
      setActiveTextBlock,
      updateTextBlock,
    } = useMemeStore()

    const refreshContrast = useAutoContrast(width)

    useImperativeHandle(ref, () => ({
      exportPng: () => rendererRef.current?.exportPng() ?? Promise.resolve(null),
    }))

    const handleDblClick = (blockId: string) => {
      const block = textBlocks.find((b) => b.id === blockId)
      if (!block || !rendererRef.current) return
      startInlineEdit(blockId, block)
    }

    const startInlineEdit = (blockId: string, block: typeof textBlocks[number]) => {
      const stageContainer = document.querySelector(`[data-block-edit-stage]`) as HTMLElement
      if (!stageContainer) return

      const stageBox = stageContainer.getBoundingClientRect()
      const x = stageBox.left + block.x * width
      const y = stageBox.top + block.y * height
      const fontSize = Math.max(Math.round((block.fontSize / 500) * width), 10)

      const original = block.defaultText
      // Hide canvas text while textarea is open to avoid double-render
      updateTextBlock(blockId, { defaultText: "" })
      setActiveTextBlock(null)

      const textarea = document.createElement("textarea")
      document.body.appendChild(textarea)
      textarea.value = original
      textarea.style.cssText = `
        position: fixed;
        top: ${y}px;
        left: ${x}px;
        width: ${block.width * width}px;
        min-height: ${fontSize * 1.5}px;
        font-size: ${fontSize}px;
        font-family: ${block.fontFamily};
        color: ${block.fill};
        background: rgba(0,0,0,0.75);
        border: 2px solid #7c3aed;
        border-radius: 8px;
        padding: 4px 8px;
        outline: none;
        resize: none;
        z-index: 9999;
        line-height: ${block.lineHeight};
        text-align: ${block.align};
        text-transform: ${block.upperCase ? "uppercase" : "none"};
      `
      textarea.focus()
      textarea.select()

      let finished = false
      const finish = (save: boolean) => {
        if (finished || !document.body.contains(textarea)) return
        finished = true
        updateTextBlock(blockId, { defaultText: save ? textarea.value : original })
        document.body.removeChild(textarea)
        setActiveTextBlock(blockId)
      }
      textarea.addEventListener("keydown", (e) => {
        if (e.key === "Escape") { finish(false); return }
        if (e.key === "Enter" && !e.shiftKey) finish(true)
      })
      textarea.addEventListener("blur", () => finish(true))
    }

    return (
      <div data-block-edit-stage style={{ lineHeight: 0 }}>
        <CanvasRenderer
          ref={rendererRef}
          imageUrl={uploadedImageUrl}
          templateId={selectedTemplateId}
          textBlocks={textBlocks}
          width={width}
          height={height}
          previewMode={previewMode}
          activeBlockId={activeTextBlockId}
          onBlockSelect={setActiveTextBlock}
          onBlockDrag={(id, x, y) => {
            updateTextBlock(id, { x, y })
            refreshContrast()
          }}
          onBlockDblClick={handleDblClick}
        />
      </div>
    )
  }
)

MemeCanvas.displayName = "MemeCanvas"
