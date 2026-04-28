import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Card,
  Button,
  Spin,
  Form,
  Input,
  InputNumber,
  Select,
  Steps,
  message,
  Space,
  Progress,
} from 'antd'
import {
  ArrowLeftOutlined,
  PlayCircleOutlined,
  FileTextOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons'
import { useEpisode, useGenerateScript, useRenderVideo, useProject, useChapters } from '@/hooks'
import { taskApi } from '@/api/task'

const { Step } = Steps
const { TextArea } = Input

export default function EpisodeGeneratePage() {
  const { projectId, episodeId } = useParams<{ projectId: string; episodeId: string }>()
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const [renderForm] = Form.useForm()
  const [currentStep, setCurrentStep] = useState(0)
  const [generating, setGenerating] = useState(false)
  const [rendering, setRendering] = useState(false)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const { data: episode, isLoading, refetch: refetchEpisode } = useEpisode(projectId || '', episodeId || '')
  const { data: project } = useProject(projectId || '')
  const novelId = project?.novelId || ''
  const { data: chapters = [], isLoading: chaptersLoading } = useChapters(novelId)
  const generateScript = useGenerateScript()
  const renderVideo = useRenderVideo()

  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [])

  const startPolling = (taskId: string, onComplete: () => void, onError: (err: string) => void) => {
    if (pollingRef.current) clearInterval(pollingRef.current)
    pollingRef.current = setInterval(async () => {
      try {
        const result = await taskApi.getTaskStatus(taskId)
        if (result.status === 'SUCCESS') {
          clearInterval(pollingRef.current!)
          pollingRef.current = null
          onComplete()
        } else if (result.status === 'FAILURE') {
          clearInterval(pollingRef.current!)
          pollingRef.current = null
          onError(result.error || 'Task failed')
        }
      } catch {
        // Keep polling on network errors
      }
    }, 3000)
  }

  const handleGenerateScript = async (values: {
    chapter_id: string
    style: 'dialogue' | 'narrative' | 'mixed'
    character_count: number
  }) => {
    if (!novelId) {
      message.error('无法获取小说信息')
      return
    }

    setGenerating(true)
    try {
      const { task_id } = await generateScript.mutateAsync({
        chapter_id: values.chapter_id,
        episode_id: episodeId || '',
        project_id: projectId || '',
        novel_id: novelId,
        style: values.style,
        character_count: values.character_count,
      })
      message.success('剧本生成任务已提交')

      startPolling(
        task_id,
        () => {
          setGenerating(false)
          message.success('剧本生成完成')
          refetchEpisode()
          setCurrentStep(1)
        },
        (err) => {
          setGenerating(false)
          message.error(`剧本生成失败: ${err}`)
        },
      )
    } catch {
      setGenerating(false)
      message.error('提交剧本生成任务失败')
    }
  }

  const handleRenderVideo = async (values: {
    resolution: '720p' | '1080p' | '4k'
    duration_target: number
  }) => {
    setRendering(true)
    try {
      const { task_id } = await renderVideo.mutateAsync({
        script_id: episodeId || '',
        episode_id: episodeId || '',
        project_id: projectId || '',
        resolution: values.resolution,
        duration_target: values.duration_target,
      })
      message.success('视频渲染任务已提交')

      startPolling(
        task_id,
        () => {
          setRendering(false)
          message.success('视频渲染完成')
          refetchEpisode()
        },
        (err) => {
          setRendering(false)
          message.error(`视频渲染失败: ${err}`)
        },
      )
    } catch {
      setRendering(false)
      message.error('提交视频渲染任务失败')
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

  const taskInProgress = generating || rendering

  const steps = [
    {
      title: '生成剧本',
      icon: <FileTextOutlined />,
      content: (
        <Card title="剧本生成设置">
          {chaptersLoading ? (
            <Spin />
          ) : (
            <Form
              form={form}
              layout="vertical"
              onFinish={handleGenerateScript}
              initialValues={{ style: 'mixed', character_count: 2 }}
            >
              <Form.Item
                name="chapter_id"
                label="选择章节"
                rules={[{ required: true, message: '请选择章节' }]}
              >
                <Select
                  placeholder="选择要改编的章节"
                  options={chapters.map((ch) => ({
                    value: ch.id,
                    label: ch.title || `第${ch.chapterNumber}章`,
                  }))}
                />
              </Form.Item>

              <Form.Item name="style" label="剧本风格">
                <Select
                  options={[
                    { value: 'dialogue', label: '对白为主' },
                    { value: 'narrative', label: '叙事为主' },
                    { value: 'mixed', label: '混合风格' },
                  ]}
                />
              </Form.Item>

              <Form.Item name="character_count" label="出场角色数">
                <InputNumber min={1} max={10} />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={generating}
                  disabled={taskInProgress || !novelId}
                >
                  生成剧本
                </Button>
              </Form.Item>
            </Form>
          )}

          {generating && (
            <div style={{ textAlign: 'center', padding: '24px' }}>
              <Spin />
              <p style={{ marginTop: 12 }}>剧本生成中，请稍候...</p>
            </div>
          )}
        </Card>
      ),
    },
    {
      title: '查看剧本',
      icon: <FileTextOutlined />,
      content: (
        <Card title="剧本内容">
          <TextArea
            rows={20}
            value={episode.scriptContent || '剧本尚未生成'}
            readOnly
            style={{ fontFamily: 'monospace' }}
          />
          <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between' }}>
            <Button onClick={() => setCurrentStep(0)}>返回修改</Button>
            <Button type="primary" onClick={() => setCurrentStep(2)}>
              确认并渲染视频
            </Button>
          </div>
        </Card>
      ),
    },
    {
      title: '渲染视频',
      icon: <VideoCameraOutlined />,
      content: (
        <Card title="视频渲染">
          {episode.videoUrl ? (
            <div style={{ textAlign: 'center' }}>
              <video
                src={episode.videoUrl}
                controls
                style={{ width: '100%', maxHeight: '400px', borderRadius: '8px' }}
              />
              <div style={{ marginTop: 16 }}>
                <Space>
                  <Button
                    type="primary"
                    icon={<PlayCircleOutlined />}
                    onClick={() => navigate(`/projects/${projectId}/episodes/${episodeId}/preview`)}
                  >
                    预览视频
                  </Button>
                  <Button onClick={() => setCurrentStep(1)}>返回编辑</Button>
                </Space>
              </div>
            </div>
          ) : rendering ? (
            <div style={{ textAlign: 'center', padding: '50px' }}>
              <Spin size="large" />
              <p style={{ marginTop: 16 }}>视频渲染中，请稍候...</p>
              <Progress percent={99} status="active" style={{ maxWidth: 400, margin: '16px auto' }} />
            </div>
          ) : (
            <Form
              form={renderForm}
              layout="vertical"
              onFinish={handleRenderVideo}
              initialValues={{ resolution: '1080p', duration_target: 60 }}
            >
              <Form.Item name="resolution" label="分辨率">
                <Select
                  options={[
                    { value: '720p', label: '720p' },
                    { value: '1080p', label: '1080p' },
                    { value: '4k', label: '4K' },
                  ]}
                />
              </Form.Item>

              <Form.Item name="duration_target" label="目标时长（秒）">
                <InputNumber min={30} max={300} />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  icon={<VideoCameraOutlined />}
                  htmlType="submit"
                  loading={rendering}
                  disabled={taskInProgress}
                >
                  开始渲染
                </Button>
              </Form.Item>
            </Form>
          )}
        </Card>
      ),
    },
  ]

  return (
    <div>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate(`/projects/${projectId}`)}
        style={{ marginBottom: 16 }}
      >
        返回项目
      </Button>

      <Card title={`${episode.title} - 剧集生成`}>
        <Steps current={currentStep} onChange={(step) => !taskInProgress && setCurrentStep(step)} style={{ marginBottom: 24 }}>
          {steps.map((step) => (
            <Step key={step.title} title={step.title} icon={step.icon} />
          ))}
        </Steps>

        {steps[currentStep].content}
      </Card>
    </div>
  )
}
