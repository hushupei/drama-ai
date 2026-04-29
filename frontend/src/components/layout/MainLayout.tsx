import { Layout, Menu, Button, Avatar, Dropdown } from 'antd'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { BookOutlined, ProjectOutlined, UserOutlined, LogoutOutlined, ClockCircleOutlined, PlayCircleOutlined } from '@ant-design/icons'
import { useAuthStore } from '@/stores'

const { Header, Sider, Content } = Layout

export default function MainLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuthStore()

  const menuItems = [
    {
      key: '/novels',
      icon: <BookOutlined />,
      label: '小说管理',
    },
    {
      key: '/projects',
      icon: <ProjectOutlined />,
      label: '项目管理',
    },
    {
      key: '/dramas',
      icon: <PlayCircleOutlined />,
      label: '短剧作品',
    },
    {
      key: '/tasks/history',
      icon: <ClockCircleOutlined />,
      label: '任务历史',
    },
  ]

  const userMenuItems = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: () => {
        logout()
        navigate('/login')
      },
    },
  ]

  function getSelectedKey() {
    if (location.pathname.startsWith('/novels')) return '/novels'
    if (location.pathname.startsWith('/projects')) return '/projects'
    if (location.pathname.startsWith('/dramas')) return '/dramas'
    if (location.pathname.startsWith('/tasks')) return '/tasks/history'
    return ''
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider theme="light" width={200}>
        <div style={{ padding: '16px', fontSize: '18px', fontWeight: 'bold' }}>
          短剧生成平台
        </div>
        <Menu
          mode="inline"
          selectedKeys={[getSelectedKey()]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Button type="text">
              <Avatar icon={<UserOutlined />} style={{ marginRight: 8 }} />
              {user?.username}
            </Button>
          </Dropdown>
        </Header>
        <Content style={{ margin: '24px', padding: '24px', background: '#fff', borderRadius: '8px' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
