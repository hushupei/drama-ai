import axios, { AxiosInstance, AxiosError } from 'axios'
import { useAuthStore } from '@/stores'
import { message } from 'antd'

const apiClient: AxiosInstance = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
})

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string }>) => {
    const status = error.response?.status
    const errorMessage = error.response?.data?.message || error.message

    switch (status) {
      case 400:
        message.error(errorMessage || '请求参数错误')
        break
      case 401:
        message.error('登录已过期，请重新登录')
        useAuthStore.getState().logout()
        window.location.href = '/login'
        break
      case 403:
        message.error('没有权限执行此操作')
        break
      case 404:
        message.error('请求的资源不存在')
        break
      case 413:
        message.error('文件大小超过限制')
        break
      case 422:
        message.error(errorMessage || '数据验证失败')
        break
      case 500:
      case 502:
      case 503:
      case 504:
        message.error('服务器繁忙，请稍后再试')
        break
      default:
        message.error(errorMessage || '网络错误，请检查网络连接')
    }

    return Promise.reject(error)
  },
)

export default apiClient
