import { useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Card,
  Button,
  Spin,
  Empty,
  Tag,
  Switch,
  Result,
} from 'antd'
import {
  ArrowLeftOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  ClockCircleOutlined,
  UserOutlined,
  CalendarOutlined,
} from '@ant-design/icons'
import { useDrama } from '@/hooks'
import type { DramaEpisode } from '@/types'

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default function DramaDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: dramaData, isLoading, isError } = useDrama(id || '')
  const drama = dramaData?.data
  const [autoPlay, setAutoPlay] = useState(false)
  const [playingEpisodeId, setPlayingEpisodeId] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  function handlePlay(episode: DramaEpisode) {
    if (playingEpisodeId === episode.id) {
      setPlayingEpisodeId(null)
      return
    }
    setPlayingEpisodeId(episode.id)
    setTimeout(() => {
      videoRef.current?.play()
    }, 100)
  }

  function handleVideoEnded() {
    if (!autoPlay || !drama) return
    const episodes = drama.episodes || []
    const currentIndex = episodes.findIndex((ep) => ep.id === playingEpisodeId)
    const nextEpisode = episodes[currentIndex + 1]
    if (nextEpisode) {
      setPlayingEpisodeId(nextEpisode.id)
      setTimeout(() => {
        videoRef.current?.play()
      }, 100)
    } else {
      setPlayingEpisodeId(null)
    }
  }

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    )
  }

  if (isError || !drama) {
    return (
      <Result
        status="404"
        title="短剧不存在"
        subTitle="该短剧可能已被删除或链接无效"
        extra={
          <Button type="primary" onClick={() => navigate('/dramas')}>
            返回列表
          </Button>
        }
      />
    )
  }

  const episodes = drama.episodes || []

  return (
    <div>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/dramas')}
        style={{ marginBottom: 16 }}
      >
        返回列表
      </Button>

      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <div style={{ flexShrink: 0, width: 240, height: 320, borderRadius: 8, overflow: 'hidden' }}>
            {drama.coverUrl ? (
              <img
                src={drama.coverUrl}
                alt={drama.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <PlayCircleOutlined style={{ fontSize: 56, color: 'rgba(255,255,255,0.5)' }} />
              </div>
            )}
          </div>
          <div style={{ flex: 1, minWidth: 280 }}>
            <h1 style={{ marginBottom: 12 }}>{drama.name}</h1>
            <div style={{ marginBottom: 8 }}>
              <UserOutlined style={{ marginRight: 6 }} />
              <span style={{ fontSize: 15, color: '#555' }}>{drama.author}</span>
            </div>
            <div style={{ marginBottom: 8, display: 'flex', gap: 16, flexWrap: 'wrap', color: '#666' }}>
              <span>
                <Tag color="blue">{drama.episodeCount} 集</Tag>
              </span>
              <span>
                <ClockCircleOutlined style={{ marginRight: 4 }} />
                总时长 {formatDuration(drama.totalDuration)}
              </span>
              <span>
                <CalendarOutlined style={{ marginRight: 4 }} />
                发布于 {formatDate(drama.publishedAt)}
              </span>
            </div>
            {drama.description && (
              <p style={{ color: '#666', lineHeight: 1.8, marginTop: 12 }}>{drama.description}</p>
            )}
          </div>
        </div>
      </Card>

      <Card
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>剧集列表（{episodes.length}）</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 14, color: '#666' }}>自动播放下一集</span>
              <Switch checked={autoPlay} onChange={setAutoPlay} />
            </div>
          </div>
        }
      >
        {playingEpisodeId && (
          <div style={{ marginBottom: 16, background: '#000', borderRadius: 8, overflow: 'hidden' }}>
            {(() => {
              const ep = episodes.find((e) => e.id === playingEpisodeId)
              if (!ep) return null
              return (
                <video
                  ref={videoRef}
                  controls
                  autoPlay
                  onEnded={handleVideoEnded}
                  style={{ width: '100%', maxHeight: 480 }}
                  src={ep.videoUrl}
                />
              )
            })()}
          </div>
        )}

        {episodes.length === 0 ? (
          <Empty description="暂无剧集" />
        ) : (
          <div>
            {episodes.map((ep: DramaEpisode) => (
              <div
                key={ep.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  borderBottom: '1px solid #f0f0f0',
                  background: playingEpisodeId === ep.id ? '#e6f7ff' : undefined,
                  borderRadius: playingEpisodeId === ep.id ? 4 : 0,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <Tag color="blue" style={{ minWidth: 64, textAlign: 'center' }}>
                    第 {ep.episodeNumber} 集
                  </Tag>
                  <span style={{ fontWeight: 500 }}>{ep.title}</span>
                  <span style={{ color: '#999', fontSize: 13 }}>
                    {formatDuration(ep.duration)}
                  </span>
                </div>
                <Button
                  type={playingEpisodeId === ep.id ? 'default' : 'primary'}
                  icon={playingEpisodeId === ep.id ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
                  onClick={() => handlePlay(ep)}
                >
                  {playingEpisodeId === ep.id ? '暂停' : '播放'}
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
