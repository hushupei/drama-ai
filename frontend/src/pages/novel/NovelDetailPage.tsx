import { useParams, useNavigate } from 'react-router-dom'
import { Card, Descriptions, Button, Spin } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { useNovel } from '@/hooks'

export default function NovelDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: novel, isLoading } = useNovel(id || '')

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
        <Descriptions bordered column={2}>
          <Descriptions.Item label="作者">{novel.author}</Descriptions.Item>
          <Descriptions.Item label="状态">{novel.status}</Descriptions.Item>
          <Descriptions.Item label="创建时间">
            {new Date(novel.createdAt).toLocaleString()}
          </Descriptions.Item>
          <Descriptions.Item label="更新时间">
            {new Date(novel.updatedAt).toLocaleString()}
          </Descriptions.Item>
          <Descriptions.Item label="简介" span={2}>
            {novel.summary || '暂无简介'}
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  )
}
