import React from 'react';
import { Form, Input, Button, Typography, Alert, Space, Divider, Card } from 'antd';
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
import LanguageSwitcher from '../../components/LanguageSwitcher';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();

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

  // Background image
  const backgroundImage =
    'https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1973&q=80';

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        position: 'relative',
      }}
    >
      {/* Left Side - Branding Section */}
      <div
        style={{
          width: isMobile ? '100%' : '50%',
          height: isMobile ? '40vh' : '100vh',
          position: 'relative',
          backgroundImage: `url(${backgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
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
              'linear-gradient(135deg, rgba(102, 126, 234, 0.9) 0%, rgba(118, 75, 162, 0.9) 100%)',
            zIndex: 1,
          }}
        />

        {/* Branding Content */}
        <div
          style={{
            position: 'relative',
            zIndex: 2,
            textAlign: 'center',
            color: 'white',
            padding: isMobile ? '20px' : '40px',
          }}
        >
          <div style={{ marginBottom: 24 }}>
            <img
              src="/logo.svg"
              alt="Lodgex CRM"
              style={{
                height: isMobile ? 60 : 80,
                width: 'auto',
                filter: 'brightness(0) invert(1)',
              }}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
          <Title
            level={1}
            style={{
              color: 'white',
              marginBottom: 16,
              fontSize: isMobile ? 32 : 48,
              fontWeight: 'bold',
            }}
          >
            Lodgex CRM
          </Title>
          <Text
            style={{
              color: 'rgba(255, 255, 255, 0.9)',
              fontSize: isMobile ? 16 : 20,
              display: 'block',
              marginBottom: 8,
            }}
          >
            Property Management System
          </Text>
          <Text
            style={{
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: isMobile ? 14 : 16,
              display: 'block',
            }}
          >
            Manage your properties, bookings, and guests with ease
          </Text>
        </div>
      </div>

      {/* Right Side - Login Form Section */}
      <div
        style={{
          width: isMobile ? '100%' : '50%',
          height: isMobile ? 'auto' : '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f5f5f5',
          padding: isMobile ? '24px' : '40px',
          position: 'relative',
        }}
      >
        {/* Theme and Language Toggle */}
        <div
          style={{
            position: 'absolute',
            top: isMobile ? 16 : 24,
            right: isMobile ? 16 : 24,
            zIndex: 10,
          }}
        >
          <Space size="small">
            <LanguageSwitcher />
            <ThemeToggle />
          </Space>
        </div>

        {/* Login Card */}
        <Card
          style={{
            width: '100%',
            maxWidth: 480,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            borderRadius: 8,
            border: 'none',
          }}
          bodyStyle={{ padding: isMobile ? 24 : 40 }}
        >
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <Title level={2} style={{ marginBottom: 8, fontSize: isMobile ? 24 : 28 }}>
              Welcome Back
            </Title>
            <Text type="secondary" style={{ fontSize: 14 }}>
              {t('auth.signInToAccount')}
            </Text>
          </div>

          {error && (
            <Alert
              message={error}
              type="error"
              showIcon
              closable
              style={{ marginBottom: 24 }}
            />
          )}

          <Form
            form={form}
            name="login"
            onFinish={onFinish}
            layout="vertical"
            size="large"
            autoComplete="off"
          >
            <Form.Item
              name="email"
              rules={[
                { required: true, message: t('auth.pleaseInputEmail') },
                { type: 'email', message: t('auth.pleaseEnterValidEmail') },
              ]}
            >
              <Input
                prefix={<UserOutlined style={{ color: '#bfbfbf' }} />}
                placeholder={t('auth.email')}
                style={{ height: 48 }}
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: t('auth.pleaseInputPassword') }]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: '#bfbfbf' }} />}
                placeholder={t('auth.password')}
                style={{ height: 48 }}
              />
            </Form.Item>

            <Form.Item style={{ marginBottom: 16 }}>
              <Button
                type="primary"
                htmlType="submit"
                block
                loading={isLoading}
                style={{
                  height: 48,
                  fontSize: 16,
                  fontWeight: 500,
                  borderRadius: 6,
                }}
              >
                {t('auth.signIn')}
              </Button>
            </Form.Item>
          </Form>

          <Divider style={{ margin: '24px 0' }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Or try a demo account
            </Text>
          </Divider>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
              gap: 12,
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
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  borderColor: account.color,
                  color: account.color,
                  borderRadius: 6,
                }}
              >
                <div style={{ textAlign: 'left', flex: 1, marginLeft: 8 }}>
                  <div style={{ fontWeight: 500, fontSize: 13 }}>{account.role}</div>
                  <div style={{ fontSize: 11, opacity: 0.7, marginTop: 2 }}>
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
