import apiClient from './client'

export const taskApi = {
  // 获取任务执行历史
  getTaskHistory: async (taskName?: string) => {
    const params = taskName ? { task_name: taskName } : {}
    const response = await apiClient.get('/tasks/history', { params })
    return response.data
  },

  // 获取运行中任务
  getRunningTasks: async () => {
    const response = await apiClient.get('/tasks/running')
    return response.data
  },

  // 获取任务统计
  getTaskStats: async () => {
    const response = await apiClient.get('/tasks/stats')
    return response.data
  },

  // 清除任务历史
  clearTaskHistory: async (taskName?: string) => {
    const params = taskName ? { task_name: taskName } : {}
    const response = await apiClient.delete('/tasks/history/clear', { params })
    return response.data
  },
}
