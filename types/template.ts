export interface TextBlock {
  id: string
  role: "top" | "bottom" | "center" | "overlay" | "label1" | "label2" | "label3" | "label4"
  defaultText: string
  x: number
  y: number
  width: number
  align: "left" | "center" | "right"
  fontFamily: string
  fontSize: number
  fill: string
  stroke: string
  strokeWidth: number
  shadowEnabled: boolean
  shadowColor: string
  shadowBlur: number
  draggable: boolean
  upperCase: boolean
  padding: number
  lineHeight: number
}

export interface MemeTemplate {
  id: string
  name: string
  description: string
  aspectRatio: number
  imageObjectFit: "cover" | "contain"
  textBlocks: TextBlock[]
  overlayColor?: string
  overlayOpacity?: number
  // Normalized (0-1) fraction of canvas height reserved as a caption bar at the bottom.
  // Scales correctly at any canvas size — replaces the old fixed-pixel paddingBottom.
  bottomBarFraction?: number
  bottomBarColor?: string
}
