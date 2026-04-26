import apiClient from './client'
import type { Novel, ApiResponse, PageRequest } from '@/types'

export const novelApi = {
  getNovels: async (params?: PageRequest): Promise<ApiResponse<Novel[]>> => {
    const response = await apiClient.get('/novels', { params })
    return response.data
  },

  getNovel: async (id: string): Promise<ApiResponse<Novel>> => {
    const response = await apiClient.get(`/novels/${id}`)
    return response.data
  },

  createNovel: async (data: FormData): Promise<ApiResponse<Novel>> => {
    const response = await apiClient.post('/novels', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },

  deleteNovel: async (id: string): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete(`/novels/${id}`)
    return response.data
  },
}
