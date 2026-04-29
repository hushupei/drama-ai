import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import {
  Card,
  Button,
  Spin,
  Tag,
  Progress,
  Table,
  Space,
  Modal,
  message,
  Tabs,
  Checkbox,
  Badge,
} from 'antd'
import {
  ArrowLeftOutlined,
  ThunderboltOutlined,
  EyeOutlined,
  ReloadOutlined,
  PlayCircleOutlined,
  FileTextOutlined,
  ExperimentOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  SyncOutlined,
} from '@ant-design/icons'
import { useProject, useEpisodes, useChapters, usePublishProject, useBatchGenerate, useBatchRender, useGenerateScript, useRenderVideo } from '@/hooks'
import { taskApi } from '@/api/task'
import ChapterContentModal from '@/pages/novel/ChapterContentModal'
import type { Chapter, Episode } from '@/types'

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  DRAFT: { label: '草稿', color: 'default' },
  SCRIPT_GENERATING: { label: '剧本生成中', color: 'processing' },
  SCRIPT_READY: { label: '剧本就绪', color: 'cyan' },
  VIDEO_GENERATING: { label: '视频生成中', color: 'processing' },
  COMPLETED: { label: '已完成', color: 'green' },
  FAILED: { label: '失败', color: 'red' },
}

const PROJECT_STATUS_MAP: Record<string, { label: string; color: string }> = {
  DRAFT: { label: '草稿', color: 'default' },
  IN_PROGRESS: { label: '进行中', color: 'blue' },
  COMPLETED: { label: '已完成', color: 'green' },
  PUBLISHED: { label: '已发布', color: 'purple' },
  ARCHIVED: { label: '已归档', color: 'red' },
}

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') || 'chapters'
  const projectId = id || ''

  const { data: project, isLoading: projectLoading, refetch: refetchProject } = useProject(projectId)
  const { data: episodes = [], isLoading: episodesLoading, refetch: refetchEpisodes } = useEpisodes(projectId)
  const novelId = project?.novelId || ''
  const { data: chapters = [], isLoading: chaptersLoading } = useChapters(novelId)
  const publishProject = usePublishProject()
  const batchGenerate = useBatchGenerate()
  const batchRender = useBatchRender()
  const generateScript = useGenerateScript()
  const renderVideo = useRenderVideo()

  const [excludedChapterIds, setExcludedChapterIds] = useState<Set<string>>(new Set())
  const [chapterModalChapterId, setChapterModalChapterId] = useState<string | null>(null)
  const [chapterModalOpen, setChapterModalOpen] = useState(false)
  const [publishModalOpen, setPublishModalOpen] = useState(false)
  const [oneClickLoading, setOneClickLoading] = useState(false)
  const [generatingEpisodes, setGeneratingEpisodes] = useState<Set<string>>(new Set())
  const [renderingEpisodes, setRenderingEpisodes] = useState<Set<string>>(new Set())

  function setTab(tab: string) {
    setSearchParams({ tab })
  }

  // Poll function for task status
  const pollTask = useCallback((taskId: string, label: string, onSuccess: () => void) => {
    const interval = setInterval(async () => {
      try {
        const res = await taskApi.getTaskStatus(taskId)
        const status = res.status || res.data?.status
        if (status === 'SUCCESS') {
          clearInterval(interval)
          message.success(`${label} 完成`)
          onSuccess()
        } else if (status === 'FAILURE') {
          clearInterval(interval)
          message.error(`${label} 失败：${res.error || res.data?.error || '未知错误'}`)
          onSuccess()
        }
      } catch {
        // keep polling
      }
    }, 3000)
    return interval
  }, [])

  // Handle single episode script generation
  async function handleGenerateSingle(ep: Episode) {
    if (!project || !novelId) return
    setGeneratingEpisodes((prev) => new Set(prev).add(ep.id))
    try {
      const res = await generateScript.mutateAsync({
        chapter_id: ep.chapter?.id || '',
        episode_id: ep.id,
        project_id: projectId,
        novel_id: novelId,
        style: 'mixed',
        character_count: 0,
      })
      const taskId = res.task_id || (res as any).data?.task_id
      if (taskId) {
        pollTask(taskId, `第${ep.episodeNumber}集剧本生成`, () => {
          setGeneratingEpisodes((prev) => {
            const next = new Set(prev)
            next.delete(ep.id)
            return next
          })
          refetchEpisodes()
        })
      }
    } catch {
      message.error('生成请求失败')
      setGeneratingEpisodes((prev) => {
        const next = new Set(prev)
        next.delete(ep.id)
        return next
      })
    }
  }

  // Handle single episode video rendering
  async function handleRenderSingle(ep: Episode) {
    if (!project) return
    setRenderingEpisodes((prev) => new Set(prev).add(ep.id))
    try {
      const res = await renderVideo.mutateAsync({
        script_id: '',
        episode_id: ep.id,
        project_id: projectId,
        resolution: '1080p',
        duration_target: 60,
      })
      const taskId = res.task_id || (res as any).data?.task_id
      if (taskId) {
        pollTask(taskId, `第${ep.episodeNumber}集视频渲染`, () => {
          setRenderingEpisodes((prev) => {
            const next = new Set(prev)
            next.delete(ep.id)
            return next
          })
          refetchEpisodes()
        })
      }
    } catch {
      message.error('渲染请求失败')
      setRenderingEpisodes((prev) => {
        const next = new Set(prev)
        next.delete(ep.id)
        return next
      })
    }
  }

  // Batch generate all scripts
  async function handleBatchGenerate() {
    if (!projectId) return
    try {
      const chapterIds = chapters
        .filter((ch: Chapter) => !excludedChapterIds.has(ch.id))
        .map((ch: Chapter) => ch.id)
      const res = await batchGenerate.mutateAsync({ projectId, chapterIds: chapterIds.length > 0 ? chapterIds : undefined })
      message.success(`批量生成已提交：${res.data?.totalRequested || 0} 个任务`)
      refetchEpisodes()
    } catch {
      message.error('批量生成请求失败')
    }
  }

  // Batch render all videos
  async function handleBatchRender() {
    if (!projectId) return
    try {
      const res = await batchRender.mutateAsync(projectId)
      message.success(`批量渲染已提交：${res.data?.totalRequested || 0} 个任务`)
      refetchEpisodes()
    } catch {
      message.error('批量渲染请求失败')
    }
  }

  // One-click: generate all → poll → render all → poll → notify
  async function handleOneClickAll() {
    if (!projectId) return
    setOneClickLoading(true)
    try {
      const chapterIds = chapters
        .filter((ch: Chapter) => !excludedChapterIds.has(ch.id))
        .map((ch: Chapter) => ch.id)

      message.info('正在批量生成剧本...')
      const genRes = await batchGenerate.mutateAsync({ projectId, chapterIds: chapterIds.length > 0 ? chapterIds : undefined })
      const genTotal = genRes.data?.totalRequested || 0
      message.info(`剧本生成已提交（${genTotal} 个任务），请等待完成后手动渲染视频`)
      refetchEpisodes()
    } catch {
      message.error('一键操作失败')
    }
    setOneClickLoading(false)
  }

  // Publish project
  async function handlePublish() {
    if (!projectId || !project) return
    try {
      await publishProject.mutateAsync({ id: projectId })
      message.success('发布成功！')
      setPublishModalOpen(false)
      refetchProject()
    } catch {
      message.error('发布失败')
    }
  }

  // Auto-refresh episodes when there are generating tasks
  useEffect(() => {
    const hasGenerating = episodes.some(
      (ep: Episode) => ep.status === 'SCRIPT_GENERATING' || ep.status === 'VIDEO_GENERATING'
    )
    if (!hasGenerating) return

    const interval = setInterval(() => {
      refetchEpisodes()
    }, 5000)

    return () => clearInterval(interval)
  }, [episodes, refetchEpisodes])

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

  const totalEpisodes = project.totalEpisodes || episodes.length || 0
  const completedEpisodes = episodes.filter((ep: Episode) => ep.status === 'COMPLETED').length
  const failedEpisodes = episodes.filter((ep: Episode) => ep.status === 'FAILED').length
  const progressPercent = totalEpisodes > 0 ? Math.round((completedEpisodes / totalEpisodes) * 100) : 0
  const isPublished = project.status === 'PUBLISHED'
  const canPublish = project.status === 'COMPLETED'

  const scriptReadyCount = episodes.filter(
    (ep: Episode) => ep.status === 'SCRIPT_READY' || ep.status === 'COMPLETED' || ep.status === 'VIDEO_GENERATING'
  ).length
  const videoCompletedCount = episodes.filter((ep: Episode) => ep.status === 'COMPLETED').length

  // Chapter table columns
  const chapterColumns = [
    {
      title: '',
      key: 'included',
      width: 50,
      render: (_: unknown, record: Chapter) => (
        <Checkbox
          checked={!excludedChapterIds.has(record.id)}
          onChange={(e) => {
            setExcludedChapterIds((prev) => {
              const next = new Set(prev)
              if (e.target.checked) {
                next.delete(record.id)
              } else {
                next.add(record.id)
              }
              return next
            })
          }}
        />
      ),
    },
    {
      title: '序号',
      dataIndex: 'chapterNumber',
      key: 'chapterNumber',
      width: 80,
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      render: (title: string | null) => title || '(无标题)',
    },
    {
      title: '字数',
      dataIndex: 'wordCount',
      key: 'wordCount',
      width: 100,
      render: (count: number) => (count || 0).toLocaleString(),
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_: unknown, record: Chapter) => {
        const matchingEpisode = episodes.find((ep: Episode) => ep.chapter?.id === record.id)
        return (
          <Space>
            <Button
              type="link"
              icon={<EyeOutlined />}
              onClick={() => {
                setChapterModalChapterId(record.id)
                setChapterModalOpen(true)
              }}
            >
              查看原文
            </Button>
            {matchingEpisode && (
              <Button
                type="link"
                icon={<ThunderboltOutlined />}
                loading={generatingEpisodes.has(matchingEpisode.id)}
                onClick={() => handleGenerateSingle(matchingEpisode)}
              >
                生成剧本
              </Button>
            )}
          </Space>
        )
      },
    },
  ]

  // Script table columns
  const scriptColumns = [
    {
      title: '集数',
      dataIndex: 'episodeNumber',
      key: 'episodeNumber',
      width: 80,
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
      width: 130,
      render: (status: string) => {
        const item = STATUS_MAP[status]
        const icon = status === 'SCRIPT_GENERATING' ? <SyncOutlined spin /> : undefined
        return item ? <Tag color={item.color} icon={icon}>{item.label}</Tag> : <Tag>{status}</Tag>
      },
    },
    {
      title: '剧本字数',
      key: 'scriptWordCount',
      width: 100,
      render: (_: unknown, record: Episode) => {
        const count = record.scriptContent?.length || 0
        return count > 0 ? count.toLocaleString() : '-'
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_: unknown, record: Episode) => (
        <Space>
          {(record.status === 'SCRIPT_READY' || record.status === 'VIDEO_GENERATING' || record.status === 'COMPLETED') && (
            <Button
              type="link"
              icon={<FileTextOutlined />}
              onClick={() => navigate(`/projects/${projectId}/episodes/${record.id}/script`)}
            >
              查看剧本
            </Button>
          )}
          <Button
            type="link"
            icon={<ReloadOutlined />}
            loading={generatingEpisodes.has(record.id)}
            onClick={() => handleGenerateSingle(record)}
          >
            重新生成
          </Button>
          {record.status === 'SCRIPT_READY' && (
            <Button
              type="link"
              icon={<PlayCircleOutlined />}
              loading={renderingEpisodes.has(record.id)}
              onClick={() => handleRenderSingle(record)}
            >
              生成视频
            </Button>
          )}
        </Space>
      ),
    },
  ]

  // Video table columns
  const videoColumns = [
    {
      title: '集数',
      dataIndex: 'episodeNumber',
      key: 'episodeNumber',
      width: 80,
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
      width: 130,
      render: (status: string) => {
        const item = STATUS_MAP[status]
        const icon = status === 'VIDEO_GENERATING' ? <SyncOutlined spin /> : undefined
        return item ? <Tag color={item.color} icon={icon}>{item.label}</Tag> : <Tag>{status}</Tag>
      },
    },
    {
      title: '时长',
      dataIndex: 'duration',
      key: 'duration',
      width: 100,
      render: (duration: number | null) => {
        if (!duration) return '-'
        const m = Math.floor(duration / 60)
        const s = duration % 60
        return `${m}分${s}秒`
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_: unknown, record: Episode) => (
        <Space>
          {record.videoUrl && record.status === 'COMPLETED' && (
            <Button
              type="link"
              icon={<PlayCircleOutlined />}
              onClick={() => navigate(`/projects/${projectId}/episodes/${record.id}/preview`)}
            >
              播放预览
            </Button>
          )}
          <Button
            type="link"
            icon={<ReloadOutlined />}
            loading={renderingEpisodes.has(record.id)}
            onClick={() => handleRenderSingle(record)}
          >
            重新渲染
          </Button>
        </Space>
      ),
    },
  ]

  const tabItems = [
    {
      key: 'chapters',
      label: '章节选择',
      children: (
        <div>
          <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#666' }}>
              已选择 {chapters.length - excludedChapterIds.size}/{chapters.length} 章
            </span>
            <Space>
              <Button
                size="small"
                onClick={() => setExcludedChapterIds(new Set())}
              >
                全选
              </Button>
              <Button
                size="small"
                onClick={() => setExcludedChapterIds(new Set(chapters.map((c: Chapter) => c.id)))}
              >
                取消全选
              </Button>
            </Space>
          </div>
          <Table
            columns={chapterColumns}
            dataSource={chapters}
            rowKey="id"
            loading={chaptersLoading}
            pagination={false}
            size="middle"
          />
        </div>
      ),
    },
    {
      key: 'scripts',
      label: (
        <span>
          剧本 ({scriptReadyCount}/{episodes.length})
        </span>
      ),
      children: (
        <div>
          <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Space>
              <Button
                type="primary"
                icon={<ThunderboltOutlined />}
                onClick={handleBatchGenerate}
                loading={batchGenerate.isPending}
              >
                全部生成
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={handleBatchGenerate}
                disabled={failedEpisodes === 0}
              >
                重试失败项
              </Button>
            </Space>
            <Space>
              <Badge status="success" text={`就绪: ${scriptReadyCount}`} />
              <Badge status="error" text={`失败: ${failedEpisodes}`} />
            </Space>
          </div>
          <Table
            columns={scriptColumns}
            dataSource={episodes}
            rowKey="id"
            loading={episodesLoading}
            pagination={false}
            size="middle"
          />
        </div>
      ),
    },
    {
      key: 'videos',
      label: (
        <span>
          视频 ({videoCompletedCount}/{episodes.length})
        </span>
      ),
      children: (
        <div>
          <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Space>
              <Button
                type="primary"
                icon={<ExperimentOutlined />}
                onClick={handleBatchRender}
                loading={batchRender.isPending}
              >
                全部渲染
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={handleBatchRender}
                disabled={failedEpisodes === 0}
              >
                重试失败项
              </Button>
            </Space>
            <Space>
              <Badge status="success" text={`已完成: ${videoCompletedCount}`} />
              <Badge status="error" text={`失败: ${failedEpisodes}`} />
            </Space>
          </div>
          <Table
            columns={videoColumns}
            dataSource={episodes}
            rowKey="id"
            loading={episodesLoading}
            pagination={false}
            size="middle"
          />
        </div>
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

      {/* Fixed Header */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1, minWidth: 200 }}>
            <h2 style={{ margin: 0 }}>{project.name}</h2>
            {(() => {
              const item = PROJECT_STATUS_MAP[project.status]
              return item ? <Tag color={item.color}>{item.label}</Tag> : <Tag>{project.status}</Tag>
            })()}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ minWidth: 160 }}>
              <Progress
                percent={progressPercent}
                size="small"
                format={() => `${completedEpisodes}/${totalEpisodes} 集`}
              />
            </div>

            {isPublished ? (
              <Space>
                <Tag icon={<CheckCircleOutlined />} color="purple">已发布</Tag>
                <Button
                  type="link"
                  icon={<EyeOutlined />}
                  onClick={() => navigate(`/dramas`)}
                >
                  查看作品
                </Button>
              </Space>
            ) : (
              <Space>
                <Button
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  onClick={() => setPublishModalOpen(true)}
                  disabled={!canPublish}
                >
                  发布作品
                </Button>
                <Button
                  icon={<ThunderboltOutlined />}
                  onClick={handleOneClickAll}
                  loading={oneClickLoading}
                >
                  一键生成全部
                </Button>
              </Space>
            )}
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <Card>
        <Tabs activeKey={activeTab} onChange={setTab} items={tabItems} />
      </Card>

      {/* Publish confirmation modal */}
      <Modal
        title="确认发布"
        open={publishModalOpen}
        onOk={handlePublish}
        onCancel={() => setPublishModalOpen(false)}
        confirmLoading={publishProject.isPending}
        okText="确认发布"
        cancelText="取消"
      >
        <div>
          <p>即将发布项目 <strong>{project.name}</strong></p>
          <p>发布后作品将公开展示在短剧作品页面中。</p>
          <p>已完成剧集：{completedEpisodes}/{totalEpisodes}</p>
          {failedEpisodes > 0 && (
            <p style={{ color: '#ff4d4f' }}>
              <ExclamationCircleOutlined /> 有 {failedEpisodes} 集失败，是否继续发布？
            </p>
          )}
        </div>
      </Modal>

      {/* Chapter content modal */}
      <ChapterContentModal
        novelId={novelId}
        chapterId={chapterModalChapterId}
        chapters={chapters}
        open={chapterModalOpen}
        onClose={() => setChapterModalOpen(false)}
      />
    </div>
  )
}
