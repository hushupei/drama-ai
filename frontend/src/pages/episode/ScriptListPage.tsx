import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Table, Button, Tag, Select, Input, Space } from 'antd'
import { EyeOutlined, PlayCircleOutlined } from '@ant-design/icons'
import { useProjects } from '@/hooks'

export default function ScriptListPage() {
  const navigate = useNavigate()
  const { data: projectData } = useProjects()
  const projects = projectData?.content || []

  const [statusFilter, setStatusFilter] = useState<string>('')
  const [searchText, setSearchText] = useState('')

  const rows: Array<{
    key: string
    projectName: string
    episodeTitle: string
    episodeNumber: number
    chapterName: string
    status: string
    projectId: string
    episodeId: string
    hasVideo: boolean
  }> = []

  for (const project of projects) {
    const episodes = project.episodes || []
    for (const ep of episodes) {
      if (searchText && !(ep.title || '').includes(searchText) && !project.name.includes(searchText)) continue
      if (statusFilter && ep.status !== statusFilter) continue
      rows.push({
        key: `${project.id}-${ep.id}`,
        projectName: project.name,
        episodeTitle: ep.title || `第 ${ep.episodeNumber} 集`,
        episodeNumber: ep.episodeNumber,
        chapterName: ep.chapter?.title || '-',
        status: ep.status,
        projectId: project.id,
        episodeId: ep.id,
        hasVideo: !!ep.videoUrl,
      })
    }
  }

  const statusMap: Record<string, { label: string; color: string }> = {
    PENDING: { label: '待处理', color: 'default' },
    GENERATING_SCRIPT: { label: '剧本生成中', color: 'processing' },
    GENERATING_SCENES: { label: '场景生成中', color: 'processing' },
    GENERATING_AUDIO: { label: '音频生成中', color: 'warning' },
    RENDERING_VIDEO: { label: '渲染中', color: 'warning' },
    COMPLETED: { label: '已完成', color: 'success' },
    FAILED: { label: '失败', color: 'error' },
  }

  const columns = [
    { title: '项目', dataIndex: 'projectName', key: 'projectName' },
    { title: '剧集', dataIndex: 'episodeTitle', key: 'episodeTitle' },
    { title: '章节', dataIndex: 'chapterName', key: 'chapterName' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (s: string) => <Tag color={statusMap[s]?.color}>{statusMap[s]?.label || s}</Tag>,
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, r: typeof rows[0]) => (
        <Space>
          <Button type="link" icon={<EyeOutlined />}
            onClick={() => navigate(`/projects/${r.projectId}/episodes/${r.episodeId}/script`)}>
            剧本
          </Button>
          {r.hasVideo && (
            <Button type="link" icon={<PlayCircleOutlined />}
              onClick={() => navigate(`/projects/${r.projectId}/episodes/${r.episodeId}/preview`)}>
              视频
            </Button>
          )}
          {!r.hasVideo && (
            <Button type="link"
              onClick={() => navigate(`/projects/${r.projectId}/episodes/${r.episodeId}/generate`)}>
              生成
            </Button>
          )}
        </Space>
      ),
    },
  ]

  return (
    <Card title="剧本管理">
      <Space style={{ marginBottom: 16 }}>
        <Input.Search
          placeholder="搜索项目或剧集"
          allowClear
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 300 }}
        />
        <Select
          placeholder="筛选状态"
          allowClear
          style={{ width: 160 }}
          value={statusFilter || undefined}
          onChange={(v) => setStatusFilter(v || '')}
          options={Object.entries(statusMap).map(([k, v]) => ({ value: k, label: v.label }))}
        />
      </Space>
      <Table columns={columns} dataSource={rows} pagination={{ pageSize: 20, showTotal: (t) => `共 ${t} 条` }} />
    </Card>
  )
}
