import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Card,
  Button,
  Spin,
  Table,
  Tag,
  Space,
  Modal,
  Form,
  Input,
  message,
  Avatar,
  Popconfirm,
} from 'antd'
import {
  ArrowLeftOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  UserOutlined,
} from '@ant-design/icons'
import {
  useCharacters,
  useCreateCharacter,
  useUpdateCharacter,
  useDeleteCharacter,
  useConfirmCharacter,
} from '@/hooks'
import type { Character } from '@/types'

interface CharacterFormValues {
  name: string
  description?: string
  personality?: string
  avatarUrl?: string
}

export default function CharacterManagePage() {
  const { novelId } = useParams<{ novelId: string }>()
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null)

  const { data: characters, isLoading } = useCharacters(novelId || '')
  const createCharacter = useCreateCharacter(novelId || '')
  const updateCharacter = useUpdateCharacter(novelId || '', editingCharacter?.id || '')
  const deleteCharacter = useDeleteCharacter(novelId || '')
  const confirmCharacter = useConfirmCharacter(novelId || '')

  const handleCreate = () => {
    setEditingCharacter(null)
    form.resetFields()
    setIsModalOpen(true)
  }

  const handleEdit = (character: Character) => {
    setEditingCharacter(character)
    form.setFieldsValue({
      name: character.name,
      description: character.description || '',
      personality: character.personality || '',
      avatarUrl: character.avatarUrl || '',
    })
    setIsModalOpen(true)
  }

  const handleSubmit = async (values: CharacterFormValues) => {
    try {
      const data = {
        novelId: novelId || '',
        name: values.name,
        description: values.description,
        personality: values.personality,
        avatarUrl: values.avatarUrl,
      }

      if (editingCharacter) {
        await updateCharacter.mutateAsync(data)
        message.success('角色更新成功')
      } else {
        await createCharacter.mutateAsync(data)
        message.success('角色创建成功')
      }
      setIsModalOpen(false)
    } catch {
      message.error('操作失败')
    }
  }

  const handleDelete = async (characterId: string) => {
    try {
      await deleteCharacter.mutateAsync(characterId)
      message.success('角色删除成功')
    } catch {
      message.error('删除失败')
    }
  }

  const handleConfirm = async (characterId: string) => {
    try {
      await confirmCharacter.mutateAsync(characterId)
      message.success('角色已确认')
    } catch {
      message.error('确认失败')
    }
  }

  const columns = [
    {
      title: '头像',
      key: 'avatar',
      width: 80,
      render: (_: unknown, record: Character) => (
        <Avatar
          src={record.avatarUrl}
          icon={<UserOutlined />}
          size="large"
        />
      ),
    },
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '性格',
      dataIndex: 'personality',
      key: 'personality',
      ellipsis: true,
    },
    {
      title: '状态',
      key: 'status',
      render: (_: unknown, record: Character) =>
        record.status === 'ACTIVE' ? (
          <Tag color="success">已激活</Tag>
        ) : (
          <Tag color="warning">未激活</Tag>
        ),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: unknown, record: Character) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
          {record.status === 'INACTIVE' && (
            <Button
              type="text"
              icon={<CheckCircleOutlined />}
              onClick={() => handleConfirm(record.id)}
            />
          )}
          <Popconfirm
            title="确认删除"
            description={`确定要删除角色 "${record.name}" 吗？`}
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
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

  return (
    <div>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate(`/novels/${novelId}`)}
        style={{ marginBottom: 16 }}
      >
        返回小说详情
      </Button>

      <Card
        title="角色管理"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            新增角色
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={characters || []}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title={editingCharacter ? '编辑角色' : '新增角色'}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={createCharacter.isPending || updateCharacter.isPending}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="name"
            label="角色名称"
            rules={[{ required: true, message: '请输入角色名称' }]}
          >
            <Input placeholder="请输入角色名称" />
          </Form.Item>

          <Form.Item name="description" label="角色描述">
            <Input.TextArea rows={3} placeholder="请输入角色描述" />
          </Form.Item>

          <Form.Item name="personality" label="性格描述">
            <Input placeholder="如：勇敢、聪明、善良" />
          </Form.Item>

          <Form.Item name="avatarUrl" label="头像URL">
            <Input placeholder="请输入头像图片URL" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
