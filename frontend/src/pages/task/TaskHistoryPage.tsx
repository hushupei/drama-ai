import { useState, useEffect } from 'react'
import { Table, Card, Tag, Button, Space, Statistic, Row, Col, Select, Badge } from 'antd'
import { ReloadOutlined, DeleteOutlined, ClockCircleOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons'
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

export default function TaskHistoryPage() {
  const [history, setHistory] = useState<TaskHistoryItem[]>([])
  const [running, setRunning] = useState<TaskHistoryItem[]>([])
  const [stats, setStats] = useState<TaskStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<string>('all')

  const fetchData = async () => {
    setLoading(true)
    try {
      const [historyRes, runningRes, statsRes] = await Promise.all([
        taskApi.getTaskHistory(filter === 'all' ? undefined : filter),
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
  }, [filter])

  const handleClearHistory = async () => {
    try {
      await taskApi.clearTaskHistory(filter === 'all' ? undefined : filter)
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

  const getTaskNameLabel = (name: string) => {
    const labels: Record<string, string> = {
      'sync_novel_parsing_status': '同步小说解析状态',
      'generate_statistics_report': '生成统计报告',
      'cleanup_old_logs': '清理旧日志',
    }
    return labels[name] || name
  }

  const columns = [
    {
      title: '任务ID',
      dataIndex: 'task_id',
      key: 'task_id',
      width: 220,
      render: (id: string) => <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{id}</span>,
    },
    {
      title: '任务名称',
      dataIndex: 'task_name',
      key: 'task_name',
      render: (name: string) => getTaskNameLabel(name),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => getStatusTag(status),
    },
    {
      title: '开始时间',
      dataIndex: 'started_at',
      key: 'started_at',
      width: 180,
      render: (time: string) => new Date(time).toLocaleString(),
    },
    {
      title: '完成时间',
      dataIndex: 'completed_at',
      key: 'completed_at',
      width: 180,
      render: (time: string) => time ? new Date(time).toLocaleString() : '-',
    },
    {
      title: '耗时',
      dataIndex: 'duration_ms',
      key: 'duration_ms',
      width: 100,
      render: (ms: number) => ms ? `${ms}ms` : '-',
    },
    {
      title: '结果/错误',
      key: 'result',
      render: (_: any, record: TaskHistoryItem) => {
        if (record.error) {
          return <span style={{ color: '#ff4d4f', fontSize: 12 }}>{record.error.substring(0, 100)}</span>
        }
        if (record.result && typeof record.result === 'object') {
          return <span style={{ fontSize: 12 }}>{JSON.stringify(record.result).substring(0, 100)}</span>
        }
        return <span style={{ fontSize: 12 }}>{String(record.result || '-')}</span>
      },
    },
  ]

  return (
    <div>
      <h2>定时任务执行记录</h2>

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
                  <strong>{getTaskNameLabel(task.task_name)}</strong>
                  <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{task.task_id}</span>
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
            value={filter}
            onChange={setFilter}
            style={{ width: 200 }}
            options={[
              { value: 'all', label: '全部任务' },
              { value: 'sync_novel_parsing_status', label: '同步小说解析状态' },
              { value: 'generate_statistics_report', label: '生成统计报告' },
              { value: 'cleanup_old_logs', label: '清理旧日志' },
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
        dataSource={history}
        rowKey="task_id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />
    </div>
  )
}
