import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Card,
  Row,
  Col,
  Input,
  Select,
  Empty,
  Tag,
  Skeleton,
} from 'antd'
import {
  PlayCircleOutlined,
  ClockCircleOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { useDramas } from '@/hooks'
import type { Drama } from '@/types'

const { Meta } = Card

function timeAgo(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diff = now - then
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  const months = Math.floor(days / 30)

  if (months > 0) return `${months}个月前`
  if (days > 0) return `${days}天前`
  if (hours > 0) return `${hours}小时前`
  if (minutes > 0) return `${minutes}分钟前`
  return '刚刚'
}

function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  if (hours > 0) return `${hours}小时${minutes}分`
  return `${minutes}分钟`
}

export default function DramaListPage() {
  const navigate = useNavigate()
  const [keyword, setKeyword] = useState('')
  const [sort, setSort] = useState<'latest' | 'earliest'>('latest')

  const { data: dramasData, isLoading } = useDramas({ keyword: keyword || undefined })

  const dramas = dramasData?.data?.content || []

  const sortedDramas = [...dramas].sort((a, b) => {
    const aTime = new Date(a.publishedAt).getTime()
    const bTime = new Date(b.publishedAt).getTime()
    return sort === 'latest' ? bTime - aTime : aTime - bTime
  })

  const loadingCards = Array.from({ length: 6 }, (_, i) => (
    <Col key={i} xs={24} sm={12} md={8}>
      <Card>
        <Skeleton.Image style={{ width: '100%', height: 200 }} active />
        <Skeleton active paragraph={{ rows: 2 }} />
      </Card>
    </Col>
  ))

  return (
    <div>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <h2 style={{ margin: 0 }}>短剧作品</h2>
        <div style={{ display: 'flex', gap: 12 }}>
          <Input.Search
            placeholder="搜索短剧名称"
            allowClear
            onSearch={(val) => setKeyword(val)}
            onChange={(e) => { if (!e.target.value) setKeyword('') }}
            style={{ width: 240 }}
          />
          <Select
            value={sort}
            onChange={setSort}
            style={{ width: 140 }}
            options={[
              { value: 'latest', label: '最新发布' },
              { value: 'earliest', label: '最早发布' },
            ]}
          />
        </div>
      </div>

      {isLoading ? (
        <Row gutter={[16, 16]}>{loadingCards}</Row>
      ) : sortedDramas.length === 0 ? (
        <Empty description="还没有短剧作品" />
      ) : (
        <Row gutter={[16, 16]}>
          {sortedDramas.map((drama: Drama) => (
            <Col key={drama.id} xs={24} sm={12} md={8}>
              <Card
                hoverable
                onClick={() => navigate(`/dramas/${drama.id}`)}
                cover={
                  drama.coverUrl ? (
                    <div style={{ height: 200, overflow: 'hidden' }}>
                      <img
                        src={drama.coverUrl}
                        alt={drama.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                  ) : (
                    <div
                      style={{
                        height: 200,
                        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <PlayCircleOutlined style={{ fontSize: 48, color: 'rgba(255,255,255,0.6)' }} />
                    </div>
                  )
                }
              >
                <Meta
                  title={drama.name}
                  description={
                    <div>
                      <div style={{ marginBottom: 4, color: '#666' }}>
                        <UserOutlined style={{ marginRight: 4 }} />
                        {drama.author}
                      </div>
                      <div style={{ marginBottom: 8 }}>
                        <Tag color="blue">{drama.episodeCount}集</Tag>
                        <span style={{ fontSize: 12, color: '#999' }}>
                          <ClockCircleOutlined style={{ marginRight: 4 }} />
                          {formatDuration(drama.totalDuration)}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: '#999' }}>
                        {timeAgo(drama.publishedAt)}
                      </div>
                    </div>
                  }
                />
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  )
}
