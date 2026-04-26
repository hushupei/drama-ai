import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Card,
  Button,
  Spin,
  Form,
  Input,
  Select,
  Steps,
  message,
  List,
  Checkbox,
  Tag,
  Space,
  Divider,
} from 'antd'
import {
  ArrowLeftOutlined,
  PlayCircleOutlined,
  FileTextOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons'
import { useEpisode, useGenerateScript, useRenderVideo } from '@/hooks'
import type { CheckboxChangeEvent } from 'antd/es/checkbox'

const { Step } = Steps
const { TextArea } = Input

interface ScriptFormValues {
  style: 'dramatic' | 'comedy' | 'suspense' | 'romantic'
  duration: number
}

export default function EpisodeGeneratePage() {
  const { projectId, episodeId } = useParams<{ projectId: string; episodeId: string }>()
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const [currentStep, setCurrentStep] = useState(0)
  const [selectedChapters, setSelectedChapters] = useState<string[]>([])
  const [selectedCharacters, setSelectedCharacters] = useState<string[]>([])

  const { data: episode, isLoading } = useEpisode(projectId || '', episodeId || '')
  const generateScript = useGenerateScript(projectId || '', episodeId || '')
  const renderVideo = useRenderVideo(projectId || '', episodeId || '')

  // Mock data - in real implementation, fetch from API
  const chapters = [
    { id: '1', title: '第一章', content: '第一章内容摘要...' },
    { id: '2', title: '第二章', content: '第二章内容摘要...' },
  ]

  const characters = [
    { id: '1', name: '主角A', description: '故事主角' },
    { id: '2', name: '配角B', description: '重要配角' },
  ]

  const handleChapterSelect = (e: CheckboxChangeEvent, chapterId: string) => {
    if (e.target.checked) {
      setSelectedChapters([...selectedChapters, chapterId])
    } else {
      setSelectedChapters(selectedChapters.filter((id) => id !== chapterId))
    }
  }

  const handleCharacterSelect = (e: CheckboxChangeEvent, characterId: string) => {
    if (e.target.checked) {
      setSelectedCharacters([...selectedCharacters, characterId])
    } else {
      setSelectedCharacters(selectedCharacters.filter((id) => id !== characterId))
    }
  }

  const handleGenerateScript = async (values: ScriptFormValues) => {
    if (selectedChapters.length === 0) {
      message.error('请至少选择一个章节')
      return
    }

    try {
      await generateScript.mutateAsync({
        chapterIds: selectedChapters,
        characterIds: selectedCharacters,
        style: values.style,
        duration: values.duration,
      })
      message.success('剧本生成成功')
      setCurrentStep(1)
    } catch {
      message.error('剧本生成失败')
    }
  }

  const handleRenderVideo = async () => {
    try {
      await renderVideo.mutateAsync()
      message.success('开始渲染视频')
      setCurrentStep(2)
    } catch {
      message.error('视频渲染失败')
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

  const steps = [
    {
      title: '生成剧本',
      icon: <FileTextOutlined />,
      content: (
        <Card title="选择素材">
          <Divider orientation="left">选择章节</Divider>
          <List
            dataSource={chapters}
            renderItem={(chapter) => (
              <List.Item>
                <Checkbox
                  onChange={(e) => handleChapterSelect(e, chapter.id)}
                  checked={selectedChapters.includes(chapter.id)}
                >
                  <Space direction="vertical" style={{ marginLeft: 8 }}>
                    <strong>{chapter.title}</strong>
                    <span style={{ color: '#666' }}>{chapter.content}</span>
                  </Space>
                </Checkbox>
              </List.Item>
            )}
          />

          <Divider orientation="left">选择角色</Divider>
          <List
            dataSource={characters}
            renderItem={(character) => (
              <List.Item>
                <Checkbox
                  onChange={(e) => handleCharacterSelect(e, character.id)}
                  checked={selectedCharacters.includes(character.id)}
                >
                  <Space direction="vertical" style={{ marginLeft: 8 }}>
                    <strong>{character.name}</strong>
                    <Tag color="blue">{character.description}</Tag>
                  </Space>
                </Checkbox>
              </List.Item>
            )}
          />

          <Divider orientation="left">生成设置</Divider>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleGenerateScript}
            initialValues={{ style: 'dramatic', duration: 60 }}
          >
            <Form.Item name="style" label="剧本风格">
              <Select
                options={[
                  { value: 'dramatic', label: '戏剧性' },
                  { value: 'comedy', label: '喜剧' },
                  { value: 'suspense', label: '悬疑' },
                  { value: 'romantic', label: '浪漫' },
                ]}
              />
            </Form.Item>

            <Form.Item name="duration" label="目标时长（秒）">
              <Select
                options={[
                  { value: 30, label: '30秒' },
                  { value: 60, label: '60秒' },
                  { value: 90, label: '90秒' },
                  { value: 120, label: '120秒' },
                ]}
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={generateScript.isPending}
                disabled={selectedChapters.length === 0}
              >
                生成剧本
              </Button>
            </Form.Item>
          </Form>
        </Card>
      ),
    },
    {
      title: '编辑剧本',
      icon: <FileTextOutlined />,
      content: (
        <Card title="剧本内容">
          <TextArea
            rows={15}
            defaultValue={episode.scriptContent || '剧本内容将显示在这里...'}
          />
          <div style={{ marginTop: 16, textAlign: 'right' }}>
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
          {episode.status === 'rendering' ? (
            <div style={{ textAlign: 'center', padding: '50px' }}>
              <Spin size="large" />
              <p style={{ marginTop: 16 }}>视频渲染中...</p>
            </div>
          ) : episode.videoUrl ? (
            <div>
              <video
                src={episode.videoUrl}
                controls
                style={{ width: '100%', maxHeight: '400px' }}
              />
              <div style={{ marginTop: 16, textAlign: 'right' }}>
                <Button type="primary" icon={<PlayCircleOutlined />}>
                  预览视频
                </Button>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '50px' }}>
              <p>准备好渲染视频了吗？</p>
              <Button
                type="primary"
                icon={<VideoCameraOutlined />}
                onClick={handleRenderVideo}
                loading={renderVideo.isPending}
              >
                开始渲染
              </Button>
            </div>
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
        <Steps current={currentStep} style={{ marginBottom: 24 }}>
          {steps.map((step) => (
            <Step key={step.title} title={step.title} icon={step.icon} />
          ))}
        </Steps>

        {steps[currentStep].content}
      </Card>
    </div>
  )
}
