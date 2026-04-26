import apiClient from './client'
import type { LoginRequest, RegisterRequest, User, ApiResponse } from '@/types'

export const authApi = {
  login: async (data: LoginRequest): Promise<ApiResponse<{ token: string; user: User }>> => {
    const response = await apiClient.post('/auth/login', data)
    return response.data
  },

  register: async (data: RegisterRequest): Promise<ApiResponse<{ token: string; user: User }>> => {
    const response = await apiClient.post('/auth/register', data)
    return response.data
  },

  getCurrentUser: async (): Promise<ApiResponse<User>> => {
    const response = await apiClient.get('/auth/me')
    return response.data
  },
}
