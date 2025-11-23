import React, { useState } from 'react';
import { Layout, Menu, Avatar, Dropdown } from 'antd';
import { motion } from 'framer-motion';
import {
  DashboardOutlined,
  HomeOutlined,
  UserOutlined,
  CalendarOutlined,
  TeamOutlined,
  ToolOutlined,
  DollarOutlined,
  UsergroupAddOutlined,
  BarChartOutlined,
  FileTextOutlined,
  LogoutOutlined,
  SettingOutlined,
  RobotOutlined,
  InboxOutlined,
  AppstoreOutlined,
  ApiOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { logout } from '../../store/slices/authSlice';
import NotificationsDropdown from '../NotificationsDropdown';
import GlobalSearch from '../GlobalSearch';
import type { MenuProps } from 'antd';

const { Header, Sider, Content } = Layout;

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const isAdmin = user?.role === 'admin';

  const menuItems: MenuProps['items'] = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
    {
      key: '/properties',
      icon: <HomeOutlined />,
      label: 'Properties',
    },
    {
      key: '/units',
      icon: <AppstoreOutlined />,
      label: 'Units',
    },
    {
      key: '/guests',
      icon: <UserOutlined />,
      label: 'Guests',
    },
    {
      key: '/bookings',
      icon: <CalendarOutlined />,
      label: 'Bookings',
    },
    ...(user?.role === 'owner_view' || user?.email
      ? [
          {
            key: '/my-bookings',
            icon: <CalendarOutlined />,
            label: 'My Bookings',
          },
        ]
      : []),
    {
      key: '/owners',
      icon: <TeamOutlined />,
      label: 'Owners',
    },
    {
      key: '/cleaning',
      icon: <ToolOutlined />,
      label: 'Cleaning',
    },
    {
      key: '/maintenance',
      icon: <ToolOutlined />,
      label: 'Maintenance',
    },
    {
      key: '/finance',
      icon: <DollarOutlined />,
      label: 'Finance',
    },
    {
      key: '/staff',
      icon: <UsergroupAddOutlined />,
      label: 'Staff',
    },
    {
      key: '/analytics',
      icon: <BarChartOutlined />,
      label: 'Analytics',
    },
    {
      key: '/audit',
      icon: <FileTextOutlined />,
      label: 'Audit Log',
    },
    {
      key: '/integrations',
      icon: <ApiOutlined />,
      label: 'Integrations',
    },
    {
      key: '/automations',
      icon: <RobotOutlined />,
      label: 'Automations',
    },
    {
      key: '/archive',
      icon: <InboxOutlined />,
      label: 'Archive',
    },
    ...(isAdmin
      ? [
          {
            key: '/import',
            icon: <UploadOutlined />,
            label: 'Data Import',
          },
        ]
      : []),
  ];

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Profile',
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: 'Settings',
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      danger: true,
    },
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  const handleUserMenuClick = ({ key }: { key: string }) => {
    if (key === 'logout') {
      dispatch(logout());
      navigate('/login');
    } else if (key === '/settings' || key === 'settings') {
      navigate('/settings');
    } else if (key === 'profile') {
      // Navigate to settings page with profile tab
      navigate('/settings?tab=profile');
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed} theme="dark" width={250}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            gap: 8,
          }}
        >
          {collapsed ? (
            <span style={{ fontSize: 20, fontWeight: 'bold' }}>LC</span>
          ) : (
            <>
              <img
                src="/logo.svg"
                alt="Lodgex CRM"
                style={{ height: 32, width: 'auto', filter: 'brightness(0) invert(1)' }}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              <span style={{ fontSize: 16, fontWeight: 'bold' }}>Lodgex CRM</span>
            </>
          )}
        </motion.div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            background: '#1e293b',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            borderBottom: '1px solid #334155',
          }}
        >
          <GlobalSearch />
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <NotificationsDropdown />
            <Dropdown
              menu={{
                items: userMenuItems,
                onClick: handleUserMenuClick,
              }}
              placement="bottomRight"
              trigger={['click']}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                  gap: 8,
                  padding: '4px 8px',
                  borderRadius: '4px',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <Avatar icon={<UserOutlined />} />
                <span style={{ color: '#e2e8f0' }}>
                  {user?.firstName} {user?.lastName}
                </span>
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content>{children}</Content>
      </Layout>
    </Layout>
  );
};

export default AppLayout;
