import { useState } from 'react'
import { Table, Button, Space, Popconfirm, Modal, Form, Input, Select, Tag, Progress } from 'antd'
import { PlusOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useProjects, useDeleteProject, useCreateProject, useNovels } from '@/hooks'
import type { Project } from '@/types'

export default function ProjectListPage() {
  const navigate = useNavigate()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [form] = Form.useForm()
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(10)

  const { data: projectData, isLoading } = useProjects({ page, size })
  const projects = projectData?.content || []
  const total = projectData?.total || 0
  const { data: novels } = useNovels()
  const deleteProject = useDeleteProject()
  const createProject = useCreateProject()

  const handleCreate = async (values: { name: string; type: string; novelId: string }) => {
    try {
      const result = await createProject.mutateAsync(values)
      if (result.success) {
        setIsModalOpen(false)
        form.resetFields()
      }
    } catch {
      // Error handled by mutation
    }
  }

  const columns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => {
        const typeMap: Record<string, string> = {
          'SINGLE_EPISODE': '单集',
          'MULTI_EPISODE': '多集',
          'SERIES': '系列'
        }
        return typeMap[type] || type
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusMap: Record<string, { label: string; color: string }> = {
          DRAFT: { label: '草稿', color: 'default' },
          IN_PROGRESS: { label: '进行中', color: 'blue' },
          COMPLETED: { label: '已完成', color: 'green' },
          PUBLISHED: { label: '已发布', color: 'purple' },
          ARCHIVED: { label: '已归档', color: 'red' },
        }
        const item = statusMap[status]
        return item ? <Tag color={item.color}>{item.label}</Tag> : <Tag>{status}</Tag>
      },
    },
    {
      title: '进度',
      key: 'progress',
      render: (_: unknown, record: Project) => {
        const total = record.totalEpisodes || record.episodes?.length || 0
        const completed = record.episodes?.filter((ep) => ep.status === 'COMPLETED').length || 0
        const percent = total > 0 ? Math.round((completed / total) * 100) : 0
        return (
          <div style={{ minWidth: 120 }}>
            <Progress percent={percent} size="small" format={() => `${completed}/${total}`} />
          </div>
        )
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: Project) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/projects/${record.id}`)}
          >
            查看
          </Button>
          <Popconfirm
            title="确认删除"
            description="删除后无法恢复，是否继续？"
            onConfirm={() => deleteProject.mutate(record.id)}
            okText="确认"
            cancelText="取消"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <h2>项目管理</h2>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setIsModalOpen(true)}
        >
          创建项目
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={projects || []}
        rowKey="id"
        loading={isLoading}
        pagination={{
          current: page + 1,
          pageSize: size,
          total: total,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条`,
          onChange: (newPage, newSize) => {
            setPage(newPage - 1)
            if (newSize !== size) {
              setSize(newSize)
              setPage(0)
            }
          },
        }}
      />

      <Modal
        title="创建项目"
        open={isModalOpen}
        onOk={() => form.submit()}
        onCancel={() => setIsModalOpen(false)}
        confirmLoading={createProject.isPending}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreate}
        >
          <Form.Item
            name="name"
            label="项目名称"
            rules={[{ required: true, message: '请输入项目名称' }]}
          >
            <Input placeholder="输入项目名称" />
          </Form.Item>

          <Form.Item
            name="type"
            label="项目类型"
            rules={[{ required: true, message: '请选择项目类型' }]}
          >
            <Select placeholder="选择项目类型">
              <Select.Option value="SINGLE_EPISODE">单集</Select.Option>
              <Select.Option value="SERIES">系列</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="novelId"
            label="关联小说"
            rules={[{ required: true, message: '请选择关联小说' }]}
          >
            <Select placeholder="选择小说">
              {novels?.map(novel => (
                <Select.Option key={novel.id} value={novel.id}>
                  {novel.title}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
