import apiClient from './client'
import type { Project, Episode, ApiResponse, PageRequest, Page } from '@/types'

export const projectApi = {
  getProjects: async (params?: PageRequest): Promise<ApiResponse<Page<Project>>> => {
    const response = await apiClient.get('/projects', { params })
    return response.data
  },

  getProject: async (id: string): Promise<ApiResponse<Project>> => {
    const response = await apiClient.get(`/projects/${id}`)
    return response.data
  },

  createProject: async (data: {
    name: string
    type: string
    novelId: string
  }): Promise<ApiResponse<Project>> => {
    const response = await apiClient.post('/projects', data)
    return response.data
  },

  deleteProject: async (id: string): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete(`/projects/${id}`)
    return response.data
  },

  publishProject: async (id: string, coverUrl?: string): Promise<ApiResponse<Project>> => {
    const response = await apiClient.post(`/projects/${id}/publish`, coverUrl ? { coverUrl } : {})
    return response.data
  },

  getEpisodes: async (
    projectId: string,
    params?: PageRequest,
  ): Promise<ApiResponse<Episode[]>> => {
    const response = await apiClient.get(`/projects/${projectId}/episodes`, { params })
    return response.data
  },
}
