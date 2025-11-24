import React, { useEffect, useState } from 'react';
import {
  Row,
  Col,
  Card,
  Statistic,
  Typography,
  Table,
  Tag,
  Button,
  Space,
  Modal,
  Form,
  Input,
  message,
  Tabs,
  Descriptions,
  Spin,
  Select,
} from 'antd';
import {
  UserOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ToolOutlined,
  HistoryOutlined,
  BarChartOutlined,
  EditOutlined,
} from '@ant-design/icons';
import { useAppSelector } from '../../store/hooks';
import { authApi } from '../../services/api/authApi';
import { cleaningApi, CleaningTask } from '../../services/api/cleaningApi';
import { maintenanceApi, MaintenanceTask } from '../../services/api/maintenanceApi';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import GlassCard from '../../components/animations/GlassCard';

const { Title, Text } = Typography;
const { Option } = Select;

const StaffDashboardPage: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);
  const [cleaningTasks, setCleaningTasks] = useState<CleaningTask[]>([]);
  const [maintenanceTasks, setMaintenanceTasks] = useState<MaintenanceTask[]>([]);
  const [isProfileModalVisible, setIsProfileModalVisible] = useState(false);
  const [profileForm] = Form.useForm();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([loadCleaningTasks(), loadMaintenanceTasks()]);
    } catch (error) {
      message.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadCleaningTasks = async () => {
    try {
      if (user?.id) {
        const response = await cleaningApi.getAll({ cleanerId: user.id });
        setCleaningTasks(response.data.data.tasks || []);
      }
    } catch (error) {
      console.error('Failed to load cleaning tasks:', error);
    }
  };

  const loadMaintenanceTasks = async () => {
    try {
      if (user?.id) {
        const response = await maintenanceApi.getAll({ assignedToId: user.id });
        setMaintenanceTasks(response.data.data.tasks || []);
      }
    } catch (error) {
      console.error('Failed to load maintenance tasks:', error);
    }
  };

  const handleUpdateProfile = async (values: any) => {
    try {
      // Note: This would need a user update endpoint
      message.success('Profile update functionality coming soon');
      setIsProfileModalVisible(false);
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to update profile');
    }
  };

  const getActiveCleaningTasks = () => {
    return cleaningTasks.filter(
      (task) => task.status === 'not_started' || task.status === 'in_progress'
    );
  };

  const getCompletedCleaningTasks = () => {
    return cleaningTasks.filter((task) => task.status === 'completed');
  };

  const getActiveMaintenanceTasks = () => {
    return maintenanceTasks.filter(
      (task) => task.status === 'open' || task.status === 'in_progress'
    );
  };

  const getCompletedMaintenanceTasks = () => {
    return maintenanceTasks.filter((task) => task.status === 'completed');
  };

  const cleaningColumns: ColumnsType<CleaningTask> = [
    {
      title: 'Property',
      key: 'property',
      render: (_, record) => record?.property?.name || 'N/A',
    },
    {
      title: 'Unit',
      key: 'unit',
      render: (_, record) => record?.unit?.unitCode || 'N/A',
    },
    {
      title: 'Scheduled Date',
      dataIndex: 'scheduledDate',
      key: 'scheduledDate',
      render: (date: string) => (date ? dayjs(date).format('MMM DD, YYYY') : 'N/A'),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colorMap: Record<string, string> = {
          not_started: 'default',
          in_progress: 'processing',
          completed: 'success',
        };
        return <Tag color={colorMap[status] || 'default'}>{status?.replace('_', ' ').toUpperCase()}</Tag>;
      },
    },
  ];

  const maintenanceColumns: ColumnsType<MaintenanceTask> = [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: 'Property',
      key: 'property',
      render: (_, record) => record?.property?.name || 'N/A',
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => type?.toUpperCase(),
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority: string) => {
        const colorMap: Record<string, string> = {
          low: 'default',
          medium: 'processing',
          high: 'warning',
          urgent: 'error',
        };
        return <Tag color={colorMap[priority] || 'default'}>{priority?.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colorMap: Record<string, string> = {
          open: 'default',
          in_progress: 'processing',
          completed: 'success',
        };
        return <Tag color={colorMap[status] || 'default'}>{status?.replace('_', ' ').toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => (date ? dayjs(date).format('MMM DD, YYYY') : 'N/A'),
    },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  const activeCleaning = getActiveCleaningTasks();
  const completedCleaning = getCompletedCleaningTasks();
  const activeMaintenance = getActiveMaintenanceTasks();
  const completedMaintenance = getCompletedMaintenanceTasks();

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <Title level={2}>Welcome back, {user?.firstName}!</Title>
        <Text type="secondary">Manage your tasks and profile</Text>
      </div>

      {/* Statistics */}
      <Row gutter={[20, 20]} style={{ marginBottom: 32 }}>
        <Col xs={24} sm={12} md={6}>
          <GlassCard>
            <Statistic
              title="Active Cleaning Tasks"
              value={activeCleaning.length}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </GlassCard>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <GlassCard>
            <Statistic
              title="Completed Cleaning"
              value={completedCleaning.length}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </GlassCard>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <GlassCard>
            <Statistic
              title="Active Maintenance"
              value={activeMaintenance.length}
              prefix={<ToolOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </GlassCard>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <GlassCard>
            <Statistic
              title="Completed Maintenance"
              value={completedMaintenance.length}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </GlassCard>
        </Col>
      </Row>

      {/* Actions */}
      <Row gutter={[20, 20]} style={{ marginBottom: 32 }}>
        <Col span={24}>
          <Card>
            <Space>
              <Button
                icon={<UserOutlined />}
                size="large"
                onClick={() => {
                  profileForm.setFieldsValue({
                    firstName: user?.firstName,
                    lastName: user?.lastName,
                    email: user?.email,
                    phone: user?.phone,
                  });
                  setIsProfileModalVisible(true);
                }}
              >
                Update Profile
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Tasks Tabs */}
      <Card title="My Tasks" style={{ marginBottom: 32 }}>
        <Tabs
          defaultActiveKey="cleaning"
          items={[
            {
              key: 'cleaning',
              label: `Cleaning Tasks (${cleaningTasks.length})`,
              children: (
                <Tabs
                  defaultActiveKey="active"
                  items={[
                    {
                      key: 'active',
                      label: `Active (${activeCleaning.length})`,
                      children: (
                        <Table
                          columns={cleaningColumns}
                          dataSource={activeCleaning}
                          rowKey="id"
                          pagination={{ pageSize: 10 }}
                        />
                      ),
                    },
                    {
                      key: 'completed',
                      label: `Completed (${completedCleaning.length})`,
                      children: (
                        <Table
                          columns={cleaningColumns}
                          dataSource={completedCleaning}
                          rowKey="id"
                          pagination={{ pageSize: 10 }}
                        />
                      ),
                    },
                  ]}
                />
              ),
            },
            {
              key: 'maintenance',
              label: `Maintenance Tasks (${maintenanceTasks.length})`,
              children: (
                <Tabs
                  defaultActiveKey="active"
                  items={[
                    {
                      key: 'active',
                      label: `Active (${activeMaintenance.length})`,
                      children: (
                        <Table
                          columns={maintenanceColumns}
                          dataSource={activeMaintenance}
                          rowKey="id"
                          pagination={{ pageSize: 10 }}
                        />
                      ),
                    },
                    {
                      key: 'completed',
                      label: `Completed (${completedMaintenance.length})`,
                      children: (
                        <Table
                          columns={maintenanceColumns}
                          dataSource={completedMaintenance}
                          rowKey="id"
                          pagination={{ pageSize: 10 }}
                        />
                      ),
                    },
                  ]}
                />
              ),
            },
          ]}
        />
      </Card>

      {/* Update Profile Modal */}
      <Modal
        title="Update Profile"
        open={isProfileModalVisible}
        onCancel={() => {
          setIsProfileModalVisible(false);
          profileForm.resetFields();
        }}
        footer={null}
        width={600}
      >
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
          <Form.Item
            name="email"
            label="Email"
            rules={[{ type: 'email', message: 'Please enter a valid email' }]}
          >
            <Input disabled />
          </Form.Item>
          <Form.Item name="phone" label="Phone">
            <Input />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Update Profile
              </Button>
              <Button
                onClick={() => {
                  setIsProfileModalVisible(false);
                  profileForm.resetFields();
                }}
              >
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default StaffDashboardPage;

