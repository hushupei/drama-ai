import { useState } from 'react'
import { Table, Button, Space, Popconfirm, Upload, message } from 'antd'
import { PlusOutlined, DeleteOutlined, UploadOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useNovels, useDeleteNovel, useCreateNovel } from '@/hooks'
import type { Novel } from '@/types'

export default function NovelListPage() {
  const navigate = useNavigate()
  const { data: novels, isLoading } = useNovels()
  const deleteNovel = useDeleteNovel()
  const createNovel = useCreateNovel()

  const handleUpload = async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('title', file.name.replace(/\.[^/.]+$/, ''))

    try {
      const result = await createNovel.mutateAsync(formData)
      if (result.success) {
        message.success('小说上传成功')
      } else {
        message.error(result.error || '上传失败')
      }
    } catch {
      message.error('上传失败')
    }
    return false
  }

  const columns = [
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: '作者',
      dataIndex: 'author',
      key: 'author',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
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
      render: (_: unknown, record: Novel) => (
        <Space>
          <Button
            type="link"
            onClick={() => navigate(`/novels/${record.id}`)}
          >
            查看
          </Button>
          <Popconfirm
            title="确认删除"
            description="删除后无法恢复，是否继续？"
            onConfirm={() => deleteNovel.mutate(record.id)}
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
        <h2>小说管理</h2>
        <Upload
          accept=".txt,.doc,.docx,.pdf"
          beforeUpload={handleUpload}
          showUploadList={false}
        >
          <Button type="primary" icon={<UploadOutlined />} loading={createNovel.isPending}>
            上传小说
          </Button>
        </Upload>
      </div>
      <Table
        columns={columns}
        dataSource={novels || []}
        rowKey="id"
        loading={isLoading}
      />
    </div>
  )
}
