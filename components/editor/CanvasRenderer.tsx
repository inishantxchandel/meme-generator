"use client"

import {
  useEffect, useRef, useState, useCallback,
  forwardRef, useImperativeHandle,
} from "react"
import { Stage, Layer, Image as KonvaImage, Text, Rect, Transformer } from "react-konva"
import type Konva from "konva"
import { TEMPLATES } from "@/lib/templates/definitions"
import { blockInCaptionBar, fitFontSizeToBox } from "@/lib/canvas/fitText"
import type { TextBlock } from "@/types/template"

export interface CanvasRendererHandle {
  exportPng: () => Promise<string | null>
}

interface Props {
  imageUrl: string | null
  templateId: string
  textBlocks: TextBlock[]
  width: number
  height: number
  previewMode?: boolean
  activeBlockId?: string | null
  onBlockSelect?: (id: string | null) => void
  onBlockDrag?: (id: string, x: number, y: number) => void
  onBlockDblClick?: (id: string) => void
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    img.crossOrigin = "anonymous"
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

export const CanvasRenderer = forwardRef<CanvasRendererHandle, Props>(
  ({
    imageUrl, templateId, textBlocks, width, height,
    previewMode = false,
    activeBlockId = null,
    onBlockSelect,
    onBlockDrag,
    onBlockDblClick,
  }, ref) => {
    const stageRef = useRef<Konva.Stage>(null)
    const transformerRef = useRef<Konva.Transformer>(null)
    const textRefs = useRef<Record<string, Konva.Text>>({})
    const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null)

    const template = TEMPLATES[templateId]

    useEffect(() => {
      if (!imageUrl) return
      loadImage(imageUrl).then(setBgImage).catch(console.error)
    }, [imageUrl])

    useEffect(() => {
      if (!transformerRef.current) return
      if (activeBlockId && textRefs.current[activeBlockId]) {
        transformerRef.current.nodes([textRefs.current[activeBlockId]])
      } else {
        transformerRef.current.nodes([])
      }
      transformerRef.current.getLayer()?.batchDraw()
    }, [activeBlockId])

    useImperativeHandle(ref, () => ({
      exportPng: async () => {
        if (!stageRef.current) return null
        onBlockSelect?.(null)
        await new Promise((r) => setTimeout(r, 50))
        return stageRef.current.toDataURL({
          pixelRatio: Math.max(window.devicePixelRatio, 2),
          mimeType: "image/png",
        })
      },
    }))

    // Compute caption bar height from normalized fraction — scales at any canvas size
    const barH = template?.bottomBarFraction ? Math.round(template.bottomBarFraction * height) : 0
    const drawH = height - barH  // photo fills this portion

    const getImageDims = useCallback(() => {
      if (!bgImage || !template) return { x: 0, y: 0, w: width, h: drawH }
      const ratio = bgImage.naturalWidth / bgImage.naturalHeight
      const stageRatio = width / drawH
      let w: number, h: number
      // Always cover mode: image fills drawH
      if (ratio > stageRatio) { h = drawH; w = drawH * ratio }
      else { w = width; h = width / ratio }
      return { x: (width - w) / 2, y: (drawH - h) / 2, w, h }
    }, [bgImage, template, width, drawH])

    const renderBlock = (block: TextBlock) => {
      const text = block.upperCase
        ? (block.defaultText || "").toUpperCase()
        : (block.defaultText || "")

      if (!text.trim()) return null

      const barFraction = template?.bottomBarFraction
      const inCaptionBarBlock = blockInCaptionBar(block.y, barFraction)

      let baseFontSize = Math.max(Math.round((block.fontSize / 500) * width), 10)
      let xPos = block.x * width
      let yPos = block.y * height
      let blockWidth = block.width * width
      let maxHeight = Math.max(height - yPos - 4, baseFontSize * 1.5)

      // Caption-bar blocks: use full bar area and auto-shrink font so nothing gets "..."
      if (inCaptionBarBlock && barFraction) {
        const barTop = height * (1 - barFraction)
        const pad = 6
        xPos = width * block.x
        yPos = barTop + pad
        blockWidth = width * block.width
        maxHeight = height * barFraction - pad * 2
        baseFontSize = fitFontSizeToBox(
          text,
          blockWidth - block.padding * 2,
          maxHeight,
          baseFontSize,
          block.lineHeight
        )
      }

      const fontSize = baseFontSize
      const fill = block.fill
      const stroke = block.strokeWidth > 0 ? block.stroke || undefined : undefined
      const strokeWidth = block.strokeWidth

      return (
        <Text
          key={block.id}
          ref={(node) => { if (node) textRefs.current[block.id] = node }}
          text={text}
          x={xPos}
          y={yPos}
          width={blockWidth}
          height={maxHeight}
          fontSize={fontSize}
          fontFamily={block.fontFamily}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          shadowEnabled={block.shadowEnabled}
          shadowColor={block.shadowColor}
          shadowBlur={block.shadowBlur}
          shadowOffsetX={block.shadowEnabled ? 1 : 0}
          shadowOffsetY={block.shadowEnabled ? 1 : 0}
          align={block.align}
          lineHeight={block.lineHeight}
          padding={block.padding}
          wrap="word"
          ellipsis={!inCaptionBarBlock}
          draggable={!previewMode && block.draggable}
          listening={!previewMode}
          onClick={() => onBlockSelect?.(block.id)}
          onTap={() => onBlockSelect?.(block.id)}
          onDragEnd={(e) => onBlockDrag?.(block.id, e.target.x() / width, e.target.y() / height)}
          onDblClick={() => onBlockDblClick?.(block.id)}
          onDblTap={() => onBlockDblClick?.(block.id)}
        />
      )
    }

    const imgDims = getImageDims()

    return (
      <Stage
        ref={stageRef}
        width={width}
        height={height}
        style={{ display: "block", touchAction: "none" }}
        onMouseDown={(e) => {
          if (e.target === e.target.getStage()) onBlockSelect?.(null)
        }}
        onTouchStart={(e) => {
          if (e.target === e.target.getStage()) onBlockSelect?.(null)
        }}
      >
        <Layer>
          {/* Base background */}
          <Rect
            x={0} y={0} width={width} height={height}
            fill="#000000"
            listening={false}
          />

          {/* Photo — covers drawH (full canvas if no bar, or canvas minus bar) */}
          {bgImage && (
            <KonvaImage
              image={bgImage}
              x={imgDims.x} y={imgDims.y}
              width={imgDims.w} height={imgDims.h}
              listening={false}
            />
          )}

          {/* Caption bar — always render when template has bottomBarFraction */}
          {barH > 0 && (
            <Rect
              x={0} y={drawH} width={width} height={barH}
              fill={template?.bottomBarColor ?? "#FFFFFF"}
              listening={false}
            />
          )}

          {/* Overlay tint (only over photo area) */}
          {template?.overlayColor && (
            <Rect
              x={0} y={0} width={width} height={drawH}
              fill={template.overlayColor}
              opacity={template.overlayOpacity ?? 0.2}
              listening={false}
            />
          )}

          {textBlocks.map((block) => renderBlock(block))}

          {!previewMode && (
            <Transformer
              ref={transformerRef}
              rotateEnabled={false}
              enabledAnchors={["middle-left", "middle-right"]}
              boundBoxFunc={(oldBox, newBox) => newBox.width < 20 ? oldBox : newBox}
            />
          )}
        </Layer>
      </Stage>
    )
  }
)

CanvasRenderer.displayName = "CanvasRenderer"
