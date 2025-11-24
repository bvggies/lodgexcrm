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
  const isGuest = user?.role === 'guest';
  const isStaff = user?.role !== 'guest' && user?.role !== 'admin';

  const getMenuItems = (): MenuProps['items'] => {
    // Guest menu - only dashboard
    if (isGuest) {
      return [
        {
          key: '/guest/dashboard',
          icon: <DashboardOutlined />,
          label: 'Dashboard',
        },
      ];
    }

    // Staff menu - dashboard and tasks
    if (isStaff) {
      const items: MenuProps['items'] = [
        {
          key: '/staff/dashboard',
          icon: <DashboardOutlined />,
          label: 'Dashboard',
        },
      ];

      // Add cleaning tasks if user is cleaner
      if (user?.role === 'cleaner') {
        items.push({
          key: '/cleaning',
          icon: <ToolOutlined />,
          label: 'Cleaning Tasks',
        });
      }

      // Add maintenance tasks if user is maintenance
      if (user?.role === 'maintenance') {
        items.push({
          key: '/maintenance',
          icon: <ToolOutlined />,
          label: 'Maintenance Tasks',
        });
      }

      return items;
    }

    // Admin menu - full access
    return [
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
      {
        key: '/import',
        icon: <UploadOutlined />,
        label: 'Data Import',
      },
    ];
  };

  const menuItems = getMenuItems();

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Profile',
    },
    {
      key: 'settings',
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

  const handleUserMenuClick: MenuProps['onClick'] = ({ key }) => {
    if (key === 'logout') {
      dispatch(logout());
      navigate('/login');
    } else if (key === 'settings') {
      navigate('/settings');
    } else if (key === 'profile') {
      // Navigate to settings page with profile tab
      navigate('/settings?tab=profile');
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme="dark"
        width={250}
        style={{ display: 'flex', flexDirection: 'column' }}
      >
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
            padding: '0 12px',
          }}
        >
          {collapsed ? (
            <span style={{ fontSize: 20, fontWeight: 'bold' }}>CH</span>
          ) : (
            <>
              <img
                src="/chlogo.png"
                alt="Creative Homes Vacation Rental LLC"
                style={{ height: 32, width: 'auto', flexShrink: 0 }}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 'bold',
                  lineHeight: 1.2,
                  textAlign: 'center',
                  whiteSpace: 'normal',
                  wordBreak: 'break-word',
                }}
              >
                Creative Homes Vacation Rental LLC
              </span>
            </>
          )}
        </motion.div>
        <div style={{ flex: 1, overflow: 'auto' }}>
          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[location.pathname]}
            items={menuItems}
            onClick={handleMenuClick}
            style={{ borderRight: 0 }}
          />
        </div>
        {/* Bottom section with notifications and profile */}
        <div
          style={{
            borderTop: '1px solid #334155',
            padding: collapsed ? '8px' : '12px',
            background: '#1e293b',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {/* Notifications */}
            <div style={{ width: '100%' }}>
              <NotificationsDropdown collapsed={collapsed} />
            </div>
            {/* Profile */}
            <Dropdown
              menu={{
                items: userMenuItems,
                onClick: handleUserMenuClick,
              }}
              placement={collapsed ? 'bottomRight' : 'topRight'}
              trigger={['click']}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                  gap: 8,
                  padding: '8px 12px',
                  borderRadius: '6px',
                  transition: 'background-color 0.2s',
                  color: '#e2e8f0',
                  width: '100%',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <Avatar icon={<UserOutlined />} size={collapsed ? 'default' : 'small'} />
                {!collapsed && (
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, lineHeight: 1.2 }}>
                      {user?.firstName} {user?.lastName}
                    </div>
                    <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.2 }}>
                      {user?.email}
                    </div>
                  </div>
                )}
              </div>
            </Dropdown>
          </div>
        </div>
      </Sider>
      <Layout style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Header
          style={{
            background: '#1e293b',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            borderBottom: '1px solid #334155',
            flexShrink: 0,
          }}
        >
          <GlobalSearch />
        </Header>
        <Content style={{ flex: 1, overflow: 'auto' }}>{children}</Content>
      </Layout>
    </Layout>
  );
};

export default AppLayout;
