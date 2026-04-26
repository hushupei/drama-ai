import { useParams, useNavigate } from 'react-router-dom'
import {
  Card,
  Button,
  Spin,
  Descriptions,
  Tag,
  Space,
  Empty,
  message,
} from 'antd'
import {
  ArrowLeftOutlined,
  DownloadOutlined,
  ShareAltOutlined,
  PlayCircleOutlined,
} from '@ant-design/icons'
import { useEpisode, useVideoPreviewUrl } from '@/hooks'

export default function VideoPreviewPage() {
  const { projectId, episodeId } = useParams<{ projectId: string; episodeId: string }>()
  const navigate = useNavigate()

  const { data: episode, isLoading } = useEpisode(projectId || '', episodeId || '')
  useVideoPreviewUrl(projectId || '', episodeId || '')

  const handleDownload = () => {
    if (episode?.videoUrl) {
      const link = document.createElement('a')
      link.href = episode.videoUrl
      link.download = `${episode.title}.mp4`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      message.success('开始下载')
    }
  }

  const handleShare = () => {
    if (episode?.videoUrl) {
      navigator.clipboard.writeText(window.location.href)
      message.success('链接已复制到剪贴板')
    }
  }

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    )
  }

  if (!episode) {
    return <div>剧集不存在</div>
  }

  const statusMap: Record<string, { label: string; color: string }> = {
    pending: { label: '待处理', color: 'default' },
    script_generated: { label: '剧本已生成', color: 'processing' },
    rendering: { label: '渲染中', color: 'warning' },
    completed: { label: '已完成', color: 'success' },
    failed: { label: '失败', color: 'error' },
  }

  return (
    <div>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate(`/projects/${projectId}`)}
        style={{ marginBottom: 16 }}
      >
        返回项目
      </Button>

      <Card
        title={`${episode.title} - 视频预览`}
        extra={
          <Space>
            <Button
              icon={<DownloadOutlined />}
              onClick={handleDownload}
              disabled={!episode.videoUrl}
            >
              下载
            </Button>
            <Button
              icon={<ShareAltOutlined />}
              onClick={handleShare}
              disabled={!episode.videoUrl}
            >
              分享
            </Button>
          </Space>
        }
      >
        <Descriptions bordered column={2} style={{ marginBottom: 24 }}>
          <Descriptions.Item label="集数">第 {episode.episodeNumber} 集</Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag color={statusMap[episode.status]?.color}>
              {statusMap[episode.status]?.label}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="时长">
            {episode.duration ? `${episode.duration} 秒` : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="创建时间">
            {new Date(episode.createdAt).toLocaleString()}
          </Descriptions.Item>
        </Descriptions>

        {episode.videoUrl ? (
          <div style={{ textAlign: 'center' }}>
            <video
              src={episode.videoUrl}
              controls
              style={{
                width: '100%',
                maxWidth: '800px',
                maxHeight: '500px',
                borderRadius: '8px',
              }}
              poster="/video-poster.png"
            />
          </div>
        ) : (
          <Empty
            image={<PlayCircleOutlined style={{ fontSize: 64, color: '#d9d9d9' }} />}
            description="视频尚未生成"
          >
            <Button
              type="primary"
              onClick={() => navigate(`/projects/${projectId}/episodes/${episodeId}/generate`)}
            >
              去生成视频
            </Button>
          </Empty>
        )}
      </Card>
    </div>
  )
}
