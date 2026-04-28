import { useState, useEffect } from 'react'
import { Table, Card, Tag, Button, Space, Statistic, Row, Col, Select, Badge, Typography } from 'antd'
import { ReloadOutlined, DeleteOutlined, ClockCircleOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons'

const { Text, Paragraph } = Typography
import { taskApi } from '@/api'

interface TaskHistoryItem {
  task_id: string
  task_name: string
  status: 'running' | 'success' | 'failure'
  started_at: string
  completed_at?: string
  args?: string
  kwargs?: string
  result?: any
  error?: string
  duration_ms?: number
}

interface TaskStats {
  total: number
  success: number
  failure: number
  running: number
  by_task: Record<string, { total: number; success: number; failure: number }>
}

const TYPE_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  parse_novel: { label: '解析小说', color: 'blue', icon: '📖' },
  generate_script: { label: '生成剧本', color: 'purple', icon: '📝' },
  render_video: { label: '渲染视频', color: 'cyan', icon: '🎬' },
  sync_novel_parsing_status: { label: '同步解析状态', color: 'green', icon: '🔄' },
  generate_statistics_report: { label: '统计报告', color: 'orange', icon: '📊' },
  cleanup_old_logs: { label: '清理日志', color: 'default', icon: '🧹' },
}

function formatDuration(ms: number | undefined): string {
  if (!ms) return '-'
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  const mins = Math.floor(ms / 60000)
  const secs = Math.floor((ms % 60000) / 1000)
  return `${mins}m ${secs}s`
}

function classifyError(error: string): string {
  if (!error) return error
  if (error.includes('NoSuchKey') || error.includes('does not exist')) {
    return '文件不存在，可能已被删除'
  }
  if (error.includes("codec can't decode") || error.toLowerCase().includes('encoding')) {
    return '文件编码不支持，请上传 UTF-8 编码的文件'
  }
  if (error.includes('LLM') || error.includes('OpenAI') || error.toLowerCase().includes('model')) {
    return 'AI 服务异常，请稍后重试'
  }
  if (error.toLowerCase().includes('timeout')) {
    return '任务执行超时'
  }
  if (error.toLowerCase().includes('connection refused')) {
    return '服务连接失败，请检查服务状态'
  }
  return error
}

export default function TaskHistoryPage() {
  const [history, setHistory] = useState<TaskHistoryItem[]>([])
  const [running, setRunning] = useState<TaskHistoryItem[]>([])
  const [stats, setStats] = useState<TaskStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const fetchData = async () => {
    setLoading(true)
    try {
      const [historyRes, runningRes, statsRes] = await Promise.all([
        taskApi.getTaskHistory(typeFilter === 'all' ? undefined : typeFilter),
        taskApi.getRunningTasks(),
        taskApi.getTaskStats(),
      ])
      setHistory(historyRes)
      setRunning(runningRes)
      setStats(statsRes)
    } catch (error) {
      console.error('Failed to fetch task data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [typeFilter])

  const handleClearHistory = async () => {
    try {
      await taskApi.clearTaskHistory(typeFilter === 'all' ? undefined : typeFilter)
      fetchData()
    } catch (error) {
      console.error('Failed to clear history:', error)
    }
  }

  const getStatusTag = (status: string) => {
    switch (status) {
      case 'running':
        return <Tag icon={<ClockCircleOutlined />} color="processing">运行中</Tag>
      case 'success':
        return <Tag icon={<CheckCircleOutlined />} color="success">成功</Tag>
      case 'failure':
        return <Tag icon={<CloseCircleOutlined />} color="error">失败</Tag>
      default:
        return <Tag>{status}</Tag>
    }
  }

  const getTypePrefix = (name: string) => {
    const config = TYPE_CONFIG[name]
    return config ? config.label : name
  }

  const getTypeColor = (name: string) => {
    const config = TYPE_CONFIG[name]
    return config ? config.color : 'default'
  }

  const getTypeIcon = (name: string) => {
    const config = TYPE_CONFIG[name]
    return config ? config.icon : '📌'
  }

  const filteredHistory = statusFilter === 'all'
    ? history
    : history.filter(item => item.status === statusFilter)

  const columns = [
    {
      title: '任务标识',
      dataIndex: 'task_id',
      key: 'task_id',
      width: 220,
      render: (id: string, record: TaskHistoryItem) => (
        <Space size={4}>
          <Tag color={getTypeColor(record.task_name)} style={{ fontSize: 11 }}>
            {getTypeIcon(record.task_name)} {getTypePrefix(record.task_name)}
          </Tag>
          <Text code style={{ fontSize: 11 }}>{id ? id.slice(0, 8) : ''}...</Text>
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (status: string) => getStatusTag(status),
    },
    {
      title: '开始时间',
      dataIndex: 'started_at',
      key: 'started_at',
      width: 170,
      sorter: (a: TaskHistoryItem, b: TaskHistoryItem) =>
        new Date(a.started_at).getTime() - new Date(b.started_at).getTime(),
      defaultSortOrder: 'descend' as const,
      render: (time: string) => time ? new Date(time).toLocaleString() : '-',
    },
    {
      title: '完成时间',
      dataIndex: 'completed_at',
      key: 'completed_at',
      width: 170,
      render: (time: string) => time ? new Date(time).toLocaleString() : '-',
    },
    {
      title: '耗时',
      dataIndex: 'duration_ms',
      key: 'duration_ms',
      width: 100,
      sorter: (a: TaskHistoryItem, b: TaskHistoryItem) =>
        (a.duration_ms || 0) - (b.duration_ms || 0),
      render: (ms: number) => formatDuration(ms),
    },
    {
      title: '结果',
      key: 'result',
      ellipsis: true,
      render: (_: any, record: TaskHistoryItem) => {
        if (record.error) {
          return (
            <Paragraph
              type="danger"
              style={{ fontSize: 12, marginBottom: 0 }}
              ellipsis={{ rows: 2, expandable: true, symbol: '展开' }}
            >
              {classifyError(record.error)}
            </Paragraph>
          )
        }
        if (record.result && typeof record.result === 'object') {
          const summary = record.result.total_chapters
            ? `解析完成: ${record.result.total_chapters} 章, ${(record.result.total_word_count || 0).toLocaleString()} 字`
            : record.result.title
              ? `剧本: ${record.result.title}`
              : JSON.stringify(record.result)
          return (
            <Paragraph
              style={{ fontSize: 12, marginBottom: 0 }}
              ellipsis={{ rows: 2, expandable: true, symbol: '展开' }}
            >
              {summary}
            </Paragraph>
          )
        }
        return <Text style={{ fontSize: 12 }}>{String(record.result || '-')}</Text>
      },
    },
  ]

  return (
    <div>
      <h2>任务执行记录</h2>

      {stats && (
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="总任务数"
                value={stats.total}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="成功"
                value={stats.success}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="失败"
                value={stats.failure}
                valueStyle={{ color: '#ff4d4f' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="运行中"
                value={stats.running}
                valueStyle={{ color: '#faad14' }}
                prefix={stats.running > 0 ? <Badge status="processing" /> : null}
              />
            </Card>
          </Col>
        </Row>
      )}

      {running.length > 0 && (
        <Card title="运行中任务" style={{ marginBottom: 24 }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            {running.map(task => (
              <div key={task.task_id} style={{ padding: 8, background: '#f6ffed', borderRadius: 4 }}>
                <Space>
                  <Badge status="processing" />
                  <Tag color={getTypeColor(task.task_name)}>{getTypePrefix(task.task_name)}</Tag>
                  <Text code style={{ fontSize: 11 }}>{task.task_id ? task.task_id.slice(0, 8) : ''}...</Text>
                  <span>开始于: {new Date(task.started_at).toLocaleString()}</span>
                </Space>
              </div>
            ))}
          </Space>
        </Card>
      )}

      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Space>
          <Select
            value={typeFilter}
            onChange={setTypeFilter}
            style={{ width: 160 }}
            options={[
              { value: 'all', label: '全部类型' },
              { value: 'parse_novel', label: '📖 解析小说' },
              { value: 'generate_script', label: '📝 生成剧本' },
              { value: 'render_video', label: '🎬 渲染视频' },
              { value: 'sync_novel_parsing_status', label: '🔄 同步状态' },
              { value: 'generate_statistics_report', label: '📊 统计报告' },
              { value: 'cleanup_old_logs', label: '🧹 清理日志' },
            ]}
          />
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 140 }}
            options={[
              { value: 'all', label: '全部状态' },
              { value: 'running', label: '运行中' },
              { value: 'success', label: '成功' },
              { value: 'failure', label: '失败' },
            ]}
          />
          <Button icon={<ReloadOutlined />} onClick={fetchData} loading={loading}>
            刷新
          </Button>
        </Space>
        <Button icon={<DeleteOutlined />} danger onClick={handleClearHistory}>
          清除历史
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={filteredHistory}
        rowKey="task_id"
        loading={loading}
        pagination={{
          pageSize: 15,
          showSizeChanger: true,
          pageSizeOptions: ['10', '15', '30', '50'],
          showTotal: (total) => `共 ${total} 条`,
        }}
      />
    </div>
  )
}
