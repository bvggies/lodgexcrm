import React, { useState } from 'react';
import {
  Card,
  Typography,
  Form,
  Input,
  Switch,
  Button,
  Select,
  Divider,
  Space,
  message,
  Tabs,
  InputNumber,
  Avatar,
  Descriptions,
} from 'antd';
import {
  SettingOutlined,
  BellOutlined,
  SecurityScanOutlined,
  GlobalOutlined,
  SaveOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useSearchParams } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { storage } from '../../utils/storage';
import { usersApi } from '../../services/api/usersApi';
import { getCurrentUser } from '../../store/slices/authSlice';

const { Title, Text } = Typography;
const { Option } = Select;

const SettingsPage: React.FC = () => {
  const [form] = Form.useForm();
  const [profileForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const { user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'profile';
  const [isProfileEditMode, setIsProfileEditMode] = useState(false);

  // Load saved settings from localStorage
  React.useEffect(() => {
    if (user?.id) {
      const settingsKey = `user_settings_${user.id}`;
      const savedSettings = storage.getItem(settingsKey);
      if (savedSettings) {
        try {
          const settings = JSON.parse(savedSettings);
          form.setFieldsValue(settings);
        } catch (error) {
          console.error('Failed to load settings:', error);
        }
      }
      // Load user profile data
      profileForm.setFieldsValue({
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        email: user.email,
      });
    }
  }, [user?.id, form, profileForm]);

  const handleTabChange = (key: string) => {
    setSearchParams({ tab: key });
  };

  const handleSave = async (values: any) => {
    try {
      setLoading(true);

      // Save settings to localStorage (backend API can be added later)
      const settingsKey = `user_settings_${user?.id}`;
      const existingSettings = JSON.parse(localStorage.getItem(settingsKey) || '{}');
      const updatedSettings = { ...existingSettings, ...values };
      localStorage.setItem(settingsKey, JSON.stringify(updatedSettings));

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      message.success('Settings saved successfully');
    } catch (error) {
      message.error('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (values: any) => {
    try {
      setProfileLoading(true);
      const updateData: any = { ...values };
      // Only include password if it was provided
      if (!updateData.password || updateData.password.trim() === '') {
        delete updateData.password;
      }
      await usersApi.updateProfile(updateData);
      message.success('Profile updated successfully');
      setIsProfileEditMode(false);
      // Refresh user data
      await dispatch(getCurrentUser());
    } catch (error: any) {
      message.error(error.response?.data?.error?.message || 'Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const tabItems = [
    {
      key: 'profile',
      label: (
        <span>
          <UserOutlined /> Profile
        </span>
      ),
      children: (
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <Title level={4} style={{ margin: 0 }}>User Profile</Title>
            {!isProfileEditMode && (
              <Button type="primary" onClick={() => setIsProfileEditMode(true)}>
                Edit Profile
              </Button>
            )}
          </div>
          {isProfileEditMode ? (
            <Form form={profileForm} layout="vertical" onFinish={handleUpdateProfile}>
              <Form.Item
                name="firstName"
                label="First Name"
                rules={[{ required: true, message: 'Please enter first name' }]}
              >
                <Input />
              </Form.Item>
              <Form.Item
                name="lastName"
                label="Last Name"
                rules={[{ required: true, message: 'Please enter last name' }]}
              >
                <Input />
              </Form.Item>
              <Form.Item name="email" label="Email">
                <Input disabled />
              </Form.Item>
              <Form.Item name="phone" label="Phone">
                <Input />
              </Form.Item>
              <Form.Item
                name="password"
                label="New Password"
                rules={[{ min: 8, message: 'Password must be at least 8 characters' }]}
                help="Leave empty to keep current password"
              >
                <Input.Password placeholder="Enter new password (optional)" />
              </Form.Item>
              <Form.Item>
                <Space>
                  <Button type="primary" htmlType="submit" loading={profileLoading}>
                    Save Changes
                  </Button>
                  <Button onClick={() => setIsProfileEditMode(false)}>Cancel</Button>
                </Space>
              </Form.Item>
            </Form>
          ) : (
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <Avatar size={64} icon={<UserOutlined />} />
                <div>
                  <Title level={4} style={{ margin: 0 }}>
                    {user?.firstName} {user?.lastName}
                  </Title>
                  <Text type="secondary">{user?.email}</Text>
                </div>
              </div>
              <Descriptions bordered column={1}>
                <Descriptions.Item label="First Name">{user?.firstName || 'N/A'}</Descriptions.Item>
                <Descriptions.Item label="Last Name">{user?.lastName || 'N/A'}</Descriptions.Item>
                <Descriptions.Item label="Email">{user?.email || 'N/A'}</Descriptions.Item>
                <Descriptions.Item label="Role">
                  <span style={{ textTransform: 'capitalize' }}>{user?.role || 'N/A'}</span>
                </Descriptions.Item>
                <Descriptions.Item label="Phone">{user?.phone || 'N/A'}</Descriptions.Item>
              </Descriptions>
            </Space>
          )}
        </Card>
      ),
    },
    {
      key: 'general',
      label: (
        <span>
          <GlobalOutlined /> General
        </span>
      ),
      children: (
        <Form form={form} layout="vertical" onFinish={handleSave} initialValues={{}}>
          <Card>
            <Title level={4}>General Settings</Title>
            <Form.Item name="companyName" label="Company Name">
              <Input placeholder="Enter company name" />
            </Form.Item>
            <Form.Item name="timezone" label="Timezone">
              <Select
                placeholder="Select timezone"
                defaultValue="Asia/Dubai"
                getPopupContainer={() => document.body}
              >
                <Option value="Asia/Dubai">Asia/Dubai (GMT+4)</Option>
                <Option value="UTC">UTC (GMT+0)</Option>
                <Option value="America/New_York">America/New_York (GMT-5)</Option>
              </Select>
            </Form.Item>
            <Form.Item name="currency" label="Default Currency">
              <Select
                placeholder="Select currency"
                defaultValue="AED"
                getPopupContainer={() => document.body}
              >
                <Option value="AED">AED - UAE Dirham</Option>
                <Option value="USD">USD - US Dollar</Option>
                <Option value="EUR">EUR - Euro</Option>
              </Select>
            </Form.Item>
            <Form.Item name="dateFormat" label="Date Format">
              <Select
                placeholder="Select date format"
                defaultValue="DD/MM/YYYY"
                getPopupContainer={() => document.body}
              >
                <Option value="DD/MM/YYYY">DD/MM/YYYY</Option>
                <Option value="MM/DD/YYYY">MM/DD/YYYY</Option>
                <Option value="YYYY-MM-DD">YYYY-MM-DD</Option>
              </Select>
            </Form.Item>
          </Card>
        </Form>
      ),
    },
    {
      key: 'notifications',
      label: (
        <span>
          <BellOutlined /> Notifications
        </span>
      ),
      children: (
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Card>
            <Title level={4}>Notification Settings</Title>
            <Form.Item name="emailNotifications" valuePropName="checked" initialValue={true}>
              <Space>
                <Switch />
                <Text>Enable email notifications</Text>
              </Space>
            </Form.Item>
            <Form.Item name="smsNotifications" valuePropName="checked" initialValue={false}>
              <Space>
                <Switch />
                <Text>Enable SMS notifications</Text>
              </Space>
            </Form.Item>
            <Divider />
            <Title level={5}>Notification Types</Title>
            <Form.Item name="newBookingNotification" valuePropName="checked" initialValue={true}>
              <Space>
                <Switch />
                <Text>New booking notifications</Text>
              </Space>
            </Form.Item>
            <Form.Item
              name="taskAssignmentNotification"
              valuePropName="checked"
              initialValue={true}
            >
              <Space>
                <Switch />
                <Text>Task assignment notifications</Text>
              </Space>
            </Form.Item>
            <Form.Item
              name="paymentReminderNotification"
              valuePropName="checked"
              initialValue={true}
            >
              <Space>
                <Switch />
                <Text>Payment reminder notifications</Text>
              </Space>
            </Form.Item>
          </Card>
        </Form>
      ),
    },
    {
      key: 'security',
      label: (
        <span>
          <SecurityScanOutlined /> Security
        </span>
      ),
      children: (
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Card>
            <Title level={4}>Security Settings</Title>
            <Form.Item name="sessionTimeout" label="Session Timeout (minutes)">
              <InputNumber min={5} max={480} defaultValue={30} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="requireTwoFactor" valuePropName="checked" initialValue={false}>
              <Space>
                <Switch />
                <Text>Require two-factor authentication</Text>
              </Space>
            </Form.Item>
            <Form.Item name="passwordExpiry" label="Password Expiry (days)">
              <InputNumber min={0} max={365} defaultValue={90} style={{ width: '100%' }} />
            </Form.Item>
            <Divider />
            <Title level={5}>API Settings</Title>
            <Form.Item name="apiKey" label="API Key">
              <Input.Password placeholder="Enter API key" />
            </Form.Item>
            <Form.Item name="apiSecret" label="API Secret">
              <Input.Password placeholder="Enter API secret" />
            </Form.Item>
          </Card>
        </Form>
      ),
    },
    {
      key: 'automations',
      label: (
        <span>
          <SettingOutlined /> Automations
        </span>
      ),
      children: (
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Card>
            <Title level={4}>Automation Settings</Title>
            <Form.Item name="autoScheduleCleaning" valuePropName="checked" initialValue={true}>
              <Space>
                <Switch />
                <Text>Auto-schedule cleaning tasks after checkout</Text>
              </Space>
            </Form.Item>
            <Form.Item name="autoSendWelcomeEmail" valuePropName="checked" initialValue={true}>
              <Space>
                <Switch />
                <Text>Auto-send welcome email to new guests</Text>
              </Space>
            </Form.Item>
            <Form.Item name="autoCreateMaintenance" valuePropName="checked" initialValue={false}>
              <Space>
                <Switch />
                <Text>Auto-create maintenance tasks for long stays</Text>
              </Space>
            </Form.Item>
            <Form.Item name="longStayDays" label="Long Stay Threshold (days)">
              <InputNumber min={1} max={365} defaultValue={30} style={{ width: '100%' }} />
            </Form.Item>
          </Card>
        </Form>
      ),
    },
  ];

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
        }}
      >
        <Title level={2} style={{ margin: 0 }}>
          Settings
        </Title>
        <Button
          type="primary"
          icon={<SaveOutlined />}
          onClick={() => form.submit()}
          loading={loading}
          size="large"
        >
          Save All Settings
        </Button>
      </div>

      <Tabs items={tabItems} size="large" activeKey={activeTab} onChange={handleTabChange} />
    </div>
  );
};

export default SettingsPage;
