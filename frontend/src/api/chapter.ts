import apiClient from './client'
import type { Chapter, ApiResponse, PageRequest } from '@/types'

export const chapterApi = {
  getChapters: async (novelId: string, params?: PageRequest): Promise<ApiResponse<Chapter[]>> => {
    const response = await apiClient.get(`/novels/${novelId}/chapters`, { params })
    return response.data
  },

  getChapter: async (novelId: string, id: string): Promise<ApiResponse<Chapter>> => {
    const response = await apiClient.get(`/novels/${novelId}/chapters/${id}`)
    return response.data
  },
}
