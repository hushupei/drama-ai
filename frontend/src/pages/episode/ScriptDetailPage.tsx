import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Button, Spin, Tag, Space, Divider, Empty, Switch, Typography } from 'antd'
import { ArrowLeftOutlined, PlayCircleOutlined } from '@ant-design/icons'
import { useEpisode } from '@/hooks'

const { Text, Paragraph } = Typography

interface ScriptScene {
  scene_name?: string
  setting?: string
  dialogues?: Array<{
    character?: string
    emotion?: string
    line?: string
  }>
}

export default function ScriptDetailPage() {
  const { projectId, episodeId } = useParams<{ projectId: string; episodeId: string }>()
  const navigate = useNavigate()
  const { data: episode, isLoading } = useEpisode(projectId || '', episodeId || '')
  const [showRaw, setShowRaw] = useState(false)

  if (isLoading) {
    return <div style={{ textAlign: 'center', padding: 50 }}><Spin size="large" /></div>
  }

  if (!episode) {
    return <Empty description="剧集不存在" />
  }

  const scriptContent = episode.scriptContent
  if (!scriptContent) {
    return (
      <div>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(`/projects/${projectId}`)} style={{ marginBottom: 16 }}>
          返回
        </Button>
        <Empty description="该剧集尚未生成剧本">
          <Button type="primary" onClick={() => navigate(`/projects/${projectId}/episodes/${episodeId}/generate`)}>
            去生成剧本
          </Button>
        </Empty>
      </div>
    )
  }

  let script: { scenes?: ScriptScene[] } | null = null
  try {
    script = JSON.parse(scriptContent)
  } catch {
    // not valid JSON, show raw
  }

  const statusMap: Record<string, { label: string; color: string }> = {
    DRAFT: { label: '草稿', color: 'default' },
    SCRIPT_GENERATING: { label: '剧本生成中', color: 'processing' },
    SCRIPT_READY: { label: '剧本就绪', color: 'success' },
    VIDEO_GENERATING: { label: '视频生成中', color: 'warning' },
    COMPLETED: { label: '已完成', color: 'success' },
    FAILED: { label: '失败', color: 'error' },
  }

  return (
    <div>
      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(`/projects/${projectId}`)} style={{ marginBottom: 16 }}>
        返回
      </Button>

      <Card
        title={`剧本: ${episode.title || `第 ${episode.episodeNumber} 集`}`}
        extra={
          <Space>
            <Switch
              checkedChildren="JSON"
              unCheckedChildren="格式化"
              checked={showRaw}
              onChange={setShowRaw}
            />
            {episode.videoUrl ? (
              <Button
                type="primary"
                icon={<PlayCircleOutlined />}
                onClick={() => navigate(`/projects/${projectId}/episodes/${episodeId}/preview`)}
              >
                预览视频
              </Button>
            ) : (
              <Button
                type="primary"
                onClick={() => navigate(`/projects/${projectId}/episodes/${episodeId}/generate`)}
              >
                渲染视频
              </Button>
            )}
          </Space>
        }
      >
        <Space wrap style={{ marginBottom: 16 }}>
          <Text type="secondary">剧集: 第 {episode.episodeNumber} 集</Text>
          <Tag color={statusMap[episode.status]?.color}>
            {statusMap[episode.status]?.label}
          </Tag>
          {episode.duration && <Text type="secondary">时长: {episode.duration}秒</Text>}
        </Space>
        <Divider />

        {showRaw ? (
          <pre style={{ whiteSpace: 'pre-wrap', maxHeight: '70vh', overflow: 'auto', background: '#f5f5f5', padding: 16, borderRadius: 8 }}>
            {scriptContent}
          </pre>
        ) : script?.scenes ? (
          <div style={{ maxHeight: '70vh', overflow: 'auto' }}>
            {script.scenes.map((scene, idx) => (
              <Card
                key={idx}
                size="small"
                title={scene.scene_name || `场景 ${idx + 1}`}
                style={{ marginBottom: 12 }}
                extra={scene.setting && <Text type="secondary">{scene.setting}</Text>}
              >
                {scene.dialogues?.map((dialogue, dIdx) => (
                  <div key={dIdx} style={{ marginBottom: 8 }}>
                    {dialogue.character ? (
                      <Space style={{ marginBottom: 2 }}>
                        <Tag color="blue">{dialogue.character}</Tag>
                        {dialogue.emotion && (
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            ({dialogue.emotion})
                          </Text>
                        )}
                      </Space>
                    ) : (
                      <Tag style={{ marginBottom: 2 }}>旁白</Tag>
                    )}
                    <Paragraph style={{ margin: 0, paddingLeft: 12, lineHeight: 1.8 }}>
                      {dialogue.line || ''}
                    </Paragraph>
                  </div>
                ))}
              </Card>
            ))}
          </div>
        ) : (
          <pre style={{ whiteSpace: 'pre-wrap', maxHeight: '70vh', overflow: 'auto', background: '#f5f5f5', padding: 16, borderRadius: 8 }}>
            {scriptContent}
          </pre>
        )}
      </Card>
    </div>
  )
}
