import apiClient from './client'
import type { Drama, ApiResponse, Page, PageRequest } from '@/types'

export const dramaApi = {
  getDramas: async (params?: PageRequest & { keyword?: string }): Promise<ApiResponse<Page<Drama>>> => {
    const response = await apiClient.get('/dramas', { params })
    return response.data
  },

  getDrama: async (id: string): Promise<ApiResponse<Drama>> => {
    const response = await apiClient.get(`/dramas/${id}`)
    return response.data
  },
}
