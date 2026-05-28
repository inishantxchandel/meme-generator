import { create } from "zustand"
import { applyContrastToTextBlocks } from "@/lib/canvas/applyContrast"
import type { Suggestion } from "@/types/meme"
import type { TextBlock } from "@/types/template"
import { TEMPLATES } from "@/lib/templates/definitions"

const CONTRAST_CANVAS_SIZE = 480

interface MemeStore {
  // Upload
  uploadedImageUrl: string | null
  uploadedImagePath: string | null
  isUploading: boolean
  uploadError: string | null

  // Suggestions
  suggestions: Suggestion[]
  isSuggesting: boolean
  suggestError: string | null

  // Editor
  currentMemeId: string | null
  selectedTemplateId: string
  selectedSuggestionIndex: number | null
  textBlocks: TextBlock[]
  activeTextBlockId: string | null

  // Export/Share
  shareUrl: string | null
  isExporting: boolean
  exportedPngUrl: string | null

  // Actions
  setUpload: (url: string, path: string) => void
  setUploading: (v: boolean) => void
  setUploadError: (e: string | null) => void
  setSuggestions: (s: Suggestion[]) => void
  setIsSuggesting: (v: boolean) => void
  setSuggestError: (e: string | null) => void
  selectSuggestion: (index: number) => void
  updateTextBlock: (id: string, patch: Partial<TextBlock>) => void
  addTextBlock: () => void
  removeTextBlock: (id: string) => void
  setActiveTextBlock: (id: string | null) => void
setMemeId: (id: string) => void
  setShareUrl: (url: string) => void
  setIsExporting: (v: boolean) => void
  setExportedPngUrl: (url: string | null) => void
  reset: () => void
}

const initialState = {
  uploadedImageUrl: null,
  uploadedImagePath: null,
  isUploading: false,
  uploadError: null,
  suggestions: [],
  isSuggesting: false,
  suggestError: null,
  currentMemeId: null,
  selectedTemplateId: "classic-impact",
  selectedSuggestionIndex: null,
  textBlocks: [...(TEMPLATES["classic-impact"]?.textBlocks ?? [])],
  activeTextBlockId: null,
  shareUrl: null,
  isExporting: false,
  exportedPngUrl: null,
}

export const useMemeStore = create<MemeStore>((set, get) => ({
  ...initialState,

  setUpload: (url, path) =>
    set({ uploadedImageUrl: url, uploadedImagePath: path, uploadError: null }),

  setUploading: (v) => set({ isUploading: v }),
  setUploadError: (e) => set({ uploadError: e, isUploading: false }),

  setSuggestions: (s) => set({ suggestions: s }),
  setIsSuggesting: (v) => set({ isSuggesting: v }),
  setSuggestError: (e) => set({ suggestError: e, isSuggesting: false }),

  selectSuggestion: (index) => {
    const { suggestions } = get()
    const suggestion = suggestions[index]
    if (!suggestion) return
    const template = TEMPLATES[suggestion.templateId]
    if (!template) return

    const TOP_ROLES = ["top", "center", "label1", "overlay"]
    const usedCaptions = new Set<string>()
    const textBlocks = template.textBlocks.map((block) => {
      const preferred = TOP_ROLES.includes(block.role)
        ? suggestion.captionTop || suggestion.captionBottom
        : suggestion.captionBottom || suggestion.captionTop
      // Use preferred caption only if not already placed on another block
      const text = preferred && !usedCaptions.has(preferred) ? preferred : ""
      if (text) usedCaptions.add(text)
      return { ...block, defaultText: text, stroke: "", strokeWidth: 0 }
    })

    set({
      selectedSuggestionIndex: index,
      selectedTemplateId: suggestion.templateId,
      textBlocks,
    })

    const imageUrl = get().uploadedImageUrl
    if (imageUrl) {
      applyContrastToTextBlocks(
        imageUrl,
        suggestion.templateId,
        textBlocks,
        CONTRAST_CANVAS_SIZE
      )
        .then((contrasted) => {
          if (get().selectedSuggestionIndex === index) {
            set({ textBlocks: contrasted })
          }
        })
        .catch(() => {})
    }
  },

  updateTextBlock: (id, patch) =>
    set((state) => ({
      textBlocks: state.textBlocks.map((b) => (b.id === id ? { ...b, ...patch } : b)),
    })),

  addTextBlock: () => {
    const id = `text-${Date.now()}`
    const newBlock: TextBlock = {
      id,
      role: "overlay",
      defaultText: "Text",
      x: 0.1,
      y: 0.45,
      width: 0.8,
      align: "center",
      fontFamily: "Impact",
      fontSize: 48,
      fill: "#FFFFFF",
      stroke: "",
      strokeWidth: 0,
      shadowEnabled: true,
      shadowColor: "#000000",
      shadowBlur: 4,
      draggable: true,
      upperCase: false,
      padding: 4,
      lineHeight: 1.2,
    }
    set((state) => ({
      textBlocks: [...state.textBlocks, newBlock],
      activeTextBlockId: id,
    }))
  },

  removeTextBlock: (id) =>
    set((state) => ({
      textBlocks: state.textBlocks.filter((b) => b.id !== id),
      activeTextBlockId: state.activeTextBlockId === id ? null : state.activeTextBlockId,
    })),

  setActiveTextBlock: (id) => set({ activeTextBlockId: id }),

setMemeId: (id) => set({ currentMemeId: id }),
  setShareUrl: (url) => set({ shareUrl: url }),
  setIsExporting: (v) => set({ isExporting: v }),
  setExportedPngUrl: (url) => set({ exportedPngUrl: url }),

  reset: () => set(initialState),
}))
