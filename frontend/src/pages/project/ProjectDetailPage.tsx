import { useParams, useNavigate } from 'react-router-dom'
import { Card, Descriptions, Button, Spin, Tabs, Table } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { useProject, useEpisodes } from '@/hooks'

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: project, isLoading: projectLoading } = useProject(id || '')
  const { data: episodes, isLoading: episodesLoading } = useEpisodes(id || '')

  if (projectLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    )
  }

  if (!project) {
    return <div>项目不存在</div>
  }

  const episodeColumns = [
    {
      title: '集数',
      dataIndex: 'episodeNumber',
      key: 'episodeNumber',
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
    },
    {
      title: '时长',
      dataIndex: 'duration',
      key: 'duration',
      render: (duration: number | null) => duration ? `${duration}秒` : '-',
    },
  ]

  const items = [
    {
      key: 'info',
      label: '项目信息',
      children: (
        <Descriptions bordered column={2}>
          <Descriptions.Item label="名称">{project.name}</Descriptions.Item>
          <Descriptions.Item label="类型">
            {project.type === 'episode' ? '单集' : '系列'}
          </Descriptions.Item>
          <Descriptions.Item label="状态">{project.status}</Descriptions.Item>
          <Descriptions.Item label="创建时间">
            {new Date(project.createdAt).toLocaleString()}
          </Descriptions.Item>
        </Descriptions>
      ),
    },
    {
      key: 'episodes',
      label: `剧集列表 (${episodes?.length || 0})`,
      children: (
        <Table
          columns={episodeColumns}
          dataSource={episodes || []}
          rowKey="id"
          loading={episodesLoading}
        />
      ),
    },
  ]

  return (
    <div>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/projects')}
        style={{ marginBottom: 16 }}
      >
        返回列表
      </Button>

      <Card>
        <Tabs items={items} />
      </Card>
    </div>
  )
}
