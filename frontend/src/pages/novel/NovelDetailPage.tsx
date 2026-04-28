import { useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Card,
  Descriptions,
  Button,
  Spin,
  Tabs,
  Table,
  Input,
  Space,
  Tag,
  message,
} from 'antd'
import {
  ArrowLeftOutlined,
  PlayCircleOutlined,
  ReloadOutlined,
  EyeOutlined,
} from '@ant-design/icons'
import { useNovel, useChapters } from '@/hooks'
import { taskApi } from '@/api/task'
import type { Chapter } from '@/types'
import ChapterContentModal from './ChapterContentModal'

const PAGE_SIZE = 20

export default function NovelDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const novelId = id || ''

  const { data: novel, isLoading } = useNovel(novelId)
  const { data: chapters = [], isLoading: chaptersLoading } = useChapters(novelId)

  const [searchText, setSearchText] = useState('')
  const [parsing, setParsing] = useState(false)
  const [viewChapterId, setViewChapterId] = useState<string | null>(null)
  const [chapterModalOpen, setChapterModalOpen] = useState(false)

  const openChapter = useCallback((chapterId: string) => {
    setViewChapterId(chapterId)
    setChapterModalOpen(true)
  }, [])

  async function handleParse() {
    if (!novelId || !novel) return
    setParsing(true)
    try {
      const res = await taskApi.createParseTask({ novel_id: novelId, storage_path: novel.filePath })
      const taskId = res.task_id || res.data?.task_id
      if (!taskId) {
        message.error('解析任务创建失败')
        setParsing(false)
        return
      }

      message.info('解析任务已创建，正在解析中...')
      pollTask(taskId)
    } catch {
      message.error('解析任务创建失败')
      setParsing(false)
    }
  }

  function pollTask(taskId: string) {
    const interval = setInterval(async () => {
      try {
        const res = await taskApi.getTaskStatus(taskId)
        const status = res.status || res.data?.status
        if (status === 'SUCCESS') {
          clearInterval(interval)
          setParsing(false)
          message.success('解析完成！')
          window.location.reload()
        } else if (status === 'FAILURE') {
          clearInterval(interval)
          setParsing(false)
          message.error('解析失败：' + ((res.error || res.data?.error) || '未知错误'))
        }
      } catch {
        // keep polling
      }
    }, 3000)
  }

  function getStatusTag(status: string) {
    const map: Record<string, { label: string; color: string }> = {
      UPLOADED: { label: '已上传', color: 'default' },
      PARSING: { label: '解析中', color: 'processing' },
      PARSED: { label: '已解析', color: 'success' },
      PROCESSING: { label: '处理中', color: 'warning' },
      COMPLETED: { label: '已完成', color: 'success' },
    }
    const item = map[status]
    return item ? <Tag color={item.color}>{item.label}</Tag> : <Tag>{status}</Tag>
  }

  const canParse = novel && (novel.status === 'UPLOADED' || novel.status === 'FAILED')

  const filteredChapters = chapters.filter((ch: Chapter) => {
    if (!searchText) return true
    return (
      (ch.title || '').includes(searchText) ||
      String(ch.chapterNumber).includes(searchText)
    )
  })

  const chapterColumns = [
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
      width: 100,
      render: (_: unknown, record: Chapter) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => openChapter(record.id)}
        >
          查看
        </Button>
      ),
    },
  ]

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    )
  }

  if (!novel) {
    return <div>小说不存在</div>
  }

  const tabItems = [
    {
      key: 'info',
      label: '基本信息',
      children: (
        <Card>
          <Descriptions bordered column={2}>
            <Descriptions.Item label="书名">{novel.title}</Descriptions.Item>
            <Descriptions.Item label="作者">{novel.author}</Descriptions.Item>
            <Descriptions.Item label="状态">
              {getStatusTag(novel.status)}
            </Descriptions.Item>
            <Descriptions.Item label="总章节">
              {chapters.length || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="创建时间">
              {new Date(novel.createdAt).toLocaleString()}
            </Descriptions.Item>
            <Descriptions.Item label="更新时间">
              {new Date(novel.updatedAt).toLocaleString()}
            </Descriptions.Item>
            <Descriptions.Item label="简介" span={2}>
              {novel.description || '暂无简介'}
            </Descriptions.Item>
          </Descriptions>
          <div style={{ marginTop: 16 }}>
            <Space>
              {canParse && (
                <Button
                  type="primary"
                  icon={<PlayCircleOutlined />}
                  onClick={handleParse}
                  loading={parsing}
                >
                  {parsing ? '解析中...' : '开始解析'}
                </Button>
              )}
              {novel.status === 'PARSED' || novel.status === 'COMPLETED' ? (
                <Button icon={<ReloadOutlined />} onClick={handleParse} loading={parsing}>
                  重新解析
                </Button>
              ) : null}
              {novel.status === 'PARSING' && (
                <Tag color="processing">AI 正在解析中，请稍候...</Tag>
              )}
            </Space>
          </div>
        </Card>
      ),
    },
    {
      key: 'chapters',
      label: `章节列表 (${chapters.length})`,
      children: (
        <Card>
          <Input.Search
            placeholder="搜索章节标题或序号"
            allowClear
            onChange={(e) => setSearchText(e.target.value)}
            style={{ marginBottom: 16, maxWidth: 400 }}
          />
          <Table
            columns={chapterColumns}
            dataSource={filteredChapters}
            rowKey="id"
            loading={chaptersLoading}
            pagination={{
              pageSize: PAGE_SIZE,
              showSizeChanger: false,
              showTotal: (total) => `共 ${total} 章`,
            }}
            size="middle"
          />
        </Card>
      ),
    },
  ]

  return (
    <div>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/novels')}
        style={{ marginBottom: 16 }}
      >
        返回列表
      </Button>

      <Card title={novel.title}>
        <Tabs items={tabItems} />
      </Card>

      <ChapterContentModal
        novelId={novelId}
        chapterId={viewChapterId}
        chapters={chapters}
        open={chapterModalOpen}
        onClose={() => setChapterModalOpen(false)}
      />
    </div>
  )
}
