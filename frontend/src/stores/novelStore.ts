import { create } from 'zustand'
import type { Novel } from '@/types'

interface NovelState {
  novels: Novel[]
  selectedNovel: Novel | null
  pagination: {
    page: number
    size: number
    total: number
  }
  setNovels: (novels: Novel[]) => void
  setSelectedNovel: (novel: Novel | null) => void
  setPagination: (pagination: Partial<NovelState['pagination']>) => void
  addNovel: (novel: Novel) => void
  updateNovel: (novel: Novel) => void
  removeNovel: (id: string) => void
}

export const useNovelStore = create<NovelState>((set) => ({
  novels: [],
  selectedNovel: null,
  pagination: {
    page: 0,
    size: 10,
    total: 0,
  },
  setNovels: (novels) => set({ novels }),
  setSelectedNovel: (selectedNovel) => set({ selectedNovel }),
  setPagination: (pagination) =>
    set((state) => ({ pagination: { ...state.pagination, ...pagination } })),
  addNovel: (novel) =>
    set((state) => ({ novels: [novel, ...state.novels] })),
  updateNovel: (novel) =>
    set((state) => ({
      novels: state.novels.map((n) => (n.id === novel.id ? novel : n)),
    })),
  removeNovel: (id) =>
    set((state) => ({
      novels: state.novels.filter((n) => n.id !== id),
    })),
}))
