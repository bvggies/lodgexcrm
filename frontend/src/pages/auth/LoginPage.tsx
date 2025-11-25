import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, Alert, Space, Divider } from 'antd';
import {
  UserOutlined,
  LockOutlined,
  CrownOutlined,
  TeamOutlined,
  HomeOutlined,
  UserAddOutlined,
  ToolOutlined,
} from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { loginUser } from '../../store/slices/authSlice';
import { useNavigate } from 'react-router-dom';
import { useMobile } from '../../hooks/useMobile';
import ThemeToggle from '../../components/ThemeToggle';

const { Title, Text } = Typography;

interface DemoAccount {
  email: string;
  password: string;
  role: string;
  icon: React.ReactNode;
  color: string;
}

const demoAccounts: DemoAccount[] = [
  {
    email: 'admin@lodgexcrm.com',
    password: 'admin123',
    role: 'Admin',
    icon: <CrownOutlined />,
    color: '#ff4d4f',
  },
  {
    email: 'owner@lodgexcrm.com',
    password: 'owner123',
    role: 'Owner',
    icon: <HomeOutlined />,
    color: '#1890ff',
  },
  {
    email: 'assistant@lodgexcrm.com',
    password: 'assistant123',
    role: 'Assistant',
    icon: <TeamOutlined />,
    color: '#52c41a',
  },
  {
    email: 'cleaner@lodgexcrm.com',
    password: 'cleaner123',
    role: 'Cleaner',
    icon: <ToolOutlined />,
    color: '#faad14',
  },
  {
    email: 'maintenance@lodgexcrm.com',
    password: 'maintenance123',
    role: 'Maintenance',
    icon: <ToolOutlined />,
    color: '#722ed1',
  },
  {
    email: 'guest1@example.com',
    password: 'guest123',
    role: 'Guest',
    icon: <UserAddOutlined />,
    color: '#13c2c2',
  },
];

const LoginPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isLoading, error } = useAppSelector((state) => state.auth);
  const isMobile = useMobile();
  const [form] = Form.useForm();

  const onFinish = async (values: { email: string; password: string }) => {
    const result = await dispatch(loginUser(values));
    if (loginUser.fulfilled.match(result)) {
      const user = result.payload.user;
      // Redirect based on role
      if (user.role === 'guest') {
        navigate('/guest/dashboard');
      } else if (user.role === 'admin') {
        navigate('/');
      } else if (user.role === 'owner_view') {
        navigate('/owner/dashboard');
      } else {
        // staff roles (assistant, cleaner, maintenance)
        navigate('/staff/dashboard');
      }
    }
  };

  const handleDemoLogin = async (account: DemoAccount) => {
    // Fill form fields
    form.setFieldsValue({
      email: account.email,
      password: account.password,
    });

    // Submit the form
    const values = { email: account.email, password: account.password };
    const result = await dispatch(loginUser(values));
    if (loginUser.fulfilled.match(result)) {
      const user = result.payload.user;
      // Redirect based on role
      if (user.role === 'guest') {
        navigate('/guest/dashboard');
      } else if (user.role === 'admin') {
        navigate('/');
      } else if (user.role === 'owner_view') {
        navigate('/owner/dashboard');
      } else {
        // staff roles (assistant, cleaner, maintenance)
        navigate('/staff/dashboard');
      }
    }
  };

  // Background image - you can replace this with your own image
  // Option 1: Use a local image from public folder (e.g., '/real-estate-bg.jpg')
  // Option 2: Use the Unsplash URL below
  // To use a local image, place it in frontend/public/ and change the path below
  const backgroundImage =
    'https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1973&q=80';

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Gradient Overlay */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background:
            'linear-gradient(135deg, rgba(102, 126, 234, 0.85) 0%, rgba(118, 75, 162, 0.85) 100%)',
          zIndex: 1,
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: isMobile ? 12 : 24,
          right: isMobile ? 12 : 24,
          zIndex: 2,
        }}
      >
        <ThemeToggle />
      </div>
      <div
        style={{
          width: '100%',
          padding: isMobile ? '12px' : '0',
          position: 'relative',
          zIndex: 2,
        }}
      >
        <Card
          style={{
            width: isMobile ? '100%' : 500,
            maxWidth: '90vw',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            backgroundColor: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: isMobile ? 24 : 32 }}>
            <div style={{ marginBottom: 16 }}>
              <img
                src="/logo.svg"
                alt="Lodgex CRM"
                style={{ height: 50, width: 'auto' }}
                onError={(e) => {
                  // Fallback if logo doesn't load
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
            <Title level={2} style={{ marginTop: 16 }}>
              Lodgex CRM
            </Title>
            <p style={{ color: '#666' }}>Sign in to your account</p>
          </div>

          {error && (
            <Alert message={error} type="error" showIcon closable style={{ marginBottom: 24 }} />
          )}

          <Form form={form} name="login" onFinish={onFinish} layout="vertical" size="large">
            <Form.Item
              name="email"
              rules={[
                { required: true, message: 'Please input your email!' },
                { type: 'email', message: 'Please enter a valid email!' },
              ]}
            >
              <Input prefix={<UserOutlined />} placeholder="Email" />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: 'Please input your password!' }]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="Password" />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" block loading={isLoading}>
                Sign In
              </Button>
            </Form.Item>
          </Form>

          <Divider>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Or try a demo account
            </Text>
          </Divider>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
              gap: 8,
              marginTop: 16,
            }}
          >
            {demoAccounts.map((account) => (
              <Button
                key={account.email}
                icon={account.icon}
                onClick={() => handleDemoLogin(account)}
                loading={isLoading}
                block
                style={{
                  height: 'auto',
                  padding: '8px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  borderColor: account.color,
                  color: account.color,
                }}
              >
                <div style={{ textAlign: 'left', flex: 1 }}>
                  <div style={{ fontWeight: 500, fontSize: 13 }}>{account.role}</div>
                  <div style={{ fontSize: 10, opacity: 0.7, marginTop: 2 }}>
                    {account.email.split('@')[0]}
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
