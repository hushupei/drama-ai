import { Layout, Menu, Button, Avatar, Dropdown } from 'antd'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { BookOutlined, ProjectOutlined, UserOutlined, LogoutOutlined, ClockCircleOutlined } from '@ant-design/icons'
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
      key: '/tasks/history',
      icon: <ClockCircleOutlined />,
      label: '定时任务',
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

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider theme="light" width={200}>
        <div style={{ padding: '16px', fontSize: '18px', fontWeight: 'bold' }}>
          短剧生成平台
        </div>
        <Menu
          mode="inline"
          selectedKeys={[
  location.pathname.startsWith('/novels') ? '/novels' :
  location.pathname.startsWith('/projects') ? '/projects' :
  location.pathname.startsWith('/tasks') ? '/tasks/history' : ''
]}
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
