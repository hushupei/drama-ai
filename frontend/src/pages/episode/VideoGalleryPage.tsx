import { useNavigate } from 'react-router-dom'
import { Card, Row, Col, Tag, Button, Spin, Empty, Statistic } from 'antd'
import { PlayCircleOutlined, DownloadOutlined, EyeOutlined } from '@ant-design/icons'
import { useProjects, useVideoPreviewUrl } from '@/hooks'

export default function VideoGalleryPage() {
  const navigate = useNavigate()
  const { data: projectData, isLoading } = useProjects()
  const projects = projectData?.content || []

  const videos: Array<{
    key: string
    projectName: string
    episodeTitle: string
    episodeNumber: number
    status: string
    duration: number | null
    videoUrl: string
    projectId: string
    episodeId: string
  }> = []

  for (const project of projects) {
    const episodes = project.episodes || []
    for (const ep of episodes) {
      if (!ep.videoUrl) continue
      videos.push({
        key: `${project.id}-${ep.id}`,
        projectName: project.name,
        episodeTitle: ep.title || `第 ${ep.episodeNumber} 集`,
        episodeNumber: ep.episodeNumber,
        status: ep.status,
        duration: ep.duration || null,
        videoUrl: ep.videoUrl,
        projectId: project.id,
        episodeId: ep.id,
      })
    }
  }

  const completedVideos = videos.filter((v) => v.status === 'COMPLETED').length

  if (isLoading) {
    return <div style={{ textAlign: 'center', padding: 50 }}><Spin size="large" /></div>
  }

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}><Card><Statistic title="总视频" value={videos.length} /></Card></Col>
        <Col span={6}><Card><Statistic title="已完成" value={completedVideos} valueStyle={{ color: '#3f8600' }} /></Card></Col>
      </Row>

      {videos.length === 0 ? (
        <Empty description="暂无视频作品，请先生成剧本并渲染视频" />
      ) : (
        <Row gutter={[16, 16]}>
          {videos.map((v) => {
            const previewUrl = useVideoPreviewUrl(v.videoUrl)
            const statusMap: Record<string, { label: string; color: string }> = {
              COMPLETED: { label: '已完成', color: 'success' },
              RENDERING_VIDEO: { label: '渲染中', color: 'warning' },
              FAILED: { label: '失败', color: 'error' },
            }
            return (
              <Col key={v.key} xs={24} sm={12} md={8} lg={6}>
                <Card
                  hoverable
                  cover={
                    <div style={{
                      height: 160, background: '#1a1a2e',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <PlayCircleOutlined style={{ fontSize: 48, color: '#fff' }} />
                    </div>
                  }
                  actions={[
                    <Button type="link" icon={<EyeOutlined />}
                      onClick={() => navigate(`/projects/${v.projectId}/episodes/${v.episodeId}/preview`)}>
                      预览
                    </Button>,
                    <Button type="link" icon={<DownloadOutlined />}
                      onClick={() => { const a = document.createElement('a'); a.href = previewUrl; a.download = ''; a.click() }}>
                      下载
                    </Button>,
                  ]}
                >
                  <Card.Meta
                    title={
                      <span>
                        {v.projectName}
                        <Tag color={statusMap[v.status]?.color} style={{ marginLeft: 8 }}>
                          {statusMap[v.status]?.label || v.status}
                        </Tag>
                      </span>
                    }
                    description={
                      <div>
                        <div>{v.episodeTitle}</div>
                        {v.duration && <div>时长: {Math.floor(v.duration / 60)}分{v.duration % 60}秒</div>}
                        <Button type="link" size="small"
                          onClick={() => navigate(`/projects/${v.projectId}/episodes/${v.episodeId}/script`)}
                          style={{ padding: 0 }}>
                          查看剧本
                        </Button>
                      </div>
                    }
                  />
                </Card>
              </Col>
            )
          })}
        </Row>
      )}
    </div>
  )
}
