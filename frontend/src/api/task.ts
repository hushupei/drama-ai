import { aiClient } from './client'

export const taskApi = {
  // 获取任务执行历史
  getTaskHistory: async (taskName?: string) => {
    const params = taskName ? { task_name: taskName } : {}
    const response = await aiClient.get('/tasks/history', { params })
    return response.data
  },

  // 获取运行中任务
  getRunningTasks: async () => {
    const response = await aiClient.get('/tasks/running')
    return response.data
  },

  // 获取任务统计
  getTaskStats: async () => {
    const response = await aiClient.get('/tasks/stats')
    return response.data
  },

  // 清除任务历史
  clearTaskHistory: async (taskName?: string) => {
    const params = taskName ? { task_name: taskName } : {}
    const response = await aiClient.delete('/tasks/history/clear', { params })
    return response.data
  },

  // 获取单个任务状态
  getTaskStatus: async (taskId: string) => {
    const response = await aiClient.get(`/tasks/${taskId}`)
    return response.data
  },

  // 创建剧本生成任务
  createGenerateTask: async (data: {
    script_id: string
    episode_id: string
    project_id: string
    novel_id: string
    style: 'dialogue' | 'narrative' | 'mixed'
    character_count: number
  }) => {
    const response = await aiClient.post('/tasks/generate', data)
    return response.data
  },

  // 创建视频渲染任务
  createRenderTask: async (data: {
    script_id: string
    episode_id: string
    project_id: string
    resolution: '720p' | '1080p' | '4k'
    duration_target: number
  }) => {
    const response = await aiClient.post('/tasks/render', data)
    return response.data
  },

  // 创建小说解析任务
  createParseTask: async (data: { novel_id: string }) => {
    const response = await aiClient.post('/tasks/parse', data)
    return response.data
  },
}
