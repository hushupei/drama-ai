import { useState, useEffect } from 'react'
import { Modal, Spin, Button, Space, Typography } from 'antd'
import { LeftOutlined, RightOutlined } from '@ant-design/icons'
import type { Chapter } from '@/types'
import { chapterApi } from '@/api/chapter'

interface ChapterContentModalProps {
  novelId: string
  chapterId: string | null
  chapters: Chapter[]
  open: boolean
  onClose: () => void
}

export default function ChapterContentModal({
  novelId,
  chapterId,
  chapters,
  open,
  onClose,
}: ChapterContentModalProps) {
  const [content, setContent] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [currentIdx, setCurrentIdx] = useState(-1)

  useEffect(() => {
    if (!open || !chapterId) return
    const idx = chapters.findIndex((c) => c.id === chapterId)
    setCurrentIdx(idx)
    fetchContent(chapterId)
  }, [open, chapterId])

  async function fetchContent(id: string) {
    setLoading(true)
    try {
      const res = await chapterApi.getChapter(novelId, id)
      setContent(res.success && res.data ? res.data.content || '' : null)
    } catch {
      setContent(null)
    }
    setLoading(false)
  }

  function goChapter(delta: number) {
    const newIdx = currentIdx + delta
    if (newIdx < 0 || newIdx >= chapters.length) return
    const ch = chapters[newIdx]
    setCurrentIdx(newIdx)
    fetchContent(ch.id)
  }

  const chapter = chapters[currentIdx]
  const wordCount = content ? content.length : 0

  return (
    <Modal
      title={chapter ? `第 ${chapter.chapterNumber} 章：${chapter.title || ''}` : '章节内容'}
      open={open}
      onCancel={onClose}
      width={800}
      footer={
        <Space>
          <Button
            icon={<LeftOutlined />}
            disabled={currentIdx <= 0}
            onClick={() => goChapter(-1)}
          >
            上一章
          </Button>
          <Typography.Text type="secondary">字数: {wordCount.toLocaleString()}</Typography.Text>
          <Button
            icon={<RightOutlined />}
            disabled={currentIdx >= chapters.length - 1}
            onClick={() => goChapter(1)}
          >
            下一章
          </Button>
          <Button onClick={onClose}>关闭</Button>
        </Space>
      }
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <Spin size="large" />
        </div>
      ) : (
        <div
          style={{
            maxHeight: '60vh',
            overflow: 'auto',
            whiteSpace: 'pre-wrap',
            lineHeight: 2,
            fontSize: 15,
          }}
        >
          {content || '暂无内容'}
        </div>
      )}
    </Modal>
  )
}
