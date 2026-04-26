import apiClient from './client'
import type { Character, ApiResponse, PageRequest } from '@/types'

export interface CreateCharacterRequest {
  novelId: string
  name: string
  description?: string
  personalityTags?: string[]
  avatarUrl?: string
}

export interface UpdateCharacterRequest {
  name?: string
  description?: string
  personalityTags?: string[]
  avatarUrl?: string
  status?: 'draft' | 'confirmed'
}

export const characterApi = {
  getCharacters: async (novelId: string, params?: PageRequest): Promise<ApiResponse<Character[]>> => {
    const response = await apiClient.get(`/novels/${novelId}/characters`, { params })
    return response.data
  },

  getCharacter: async (novelId: string, id: string): Promise<ApiResponse<Character>> => {
    const response = await apiClient.get(`/novels/${novelId}/characters/${id}`)
    return response.data
  },

  createCharacter: async (novelId: string, data: CreateCharacterRequest): Promise<ApiResponse<Character>> => {
    const response = await apiClient.post(`/novels/${novelId}/characters`, data)
    return response.data
  },

  updateCharacter: async (novelId: string, id: string, data: UpdateCharacterRequest): Promise<ApiResponse<Character>> => {
    const response = await apiClient.put(`/novels/${novelId}/characters/${id}`, data)
    return response.data
  },

  deleteCharacter: async (novelId: string, id: string): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete(`/novels/${novelId}/characters/${id}`)
    return response.data
  },

  confirmCharacter: async (novelId: string, id: string): Promise<ApiResponse<Character>> => {
    const response = await apiClient.put(`/novels/${novelId}/characters/${id}/confirm`)
    return response.data
  },
}
