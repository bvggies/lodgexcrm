import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, Alert } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { loginUser } from '../../store/slices/authSlice';
import { useNavigate } from 'react-router-dom';

const { Title } = Typography;

const LoginPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isLoading, error } = useAppSelector((state) => state.auth);
  const [form] = Form.useForm();

  const onFinish = async (values: { email: string; password: string }) => {
    const result = await dispatch(loginUser(values));
    if (loginUser.fulfilled.match(result)) {
      navigate('/');
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Card style={{ width: 400, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
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

          <div style={{ textAlign: 'center', marginTop: 16, color: '#666' }}>
            <p>Demo credentials:</p>
            <p style={{ fontSize: 12 }}>admin@lodgexcrm.com / admin123</p>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default LoginPage;
