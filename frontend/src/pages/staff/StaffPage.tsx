import React, { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Space,
  Tag,
  Typography,
  Input,
  Select,
  Modal,
  Form,
  message,
  Popconfirm,
  Switch,
  Descriptions,
  Tabs,
  Spin,
  Empty,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  UserOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { staffApi, Staff } from '../../services/api/staffApi';

const { Title } = Typography;
const { Option } = Select;

const StaffPage: React.FC = () => {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [roleFilter, setRoleFilter] = useState<string | undefined>();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isProfileModalVisible, setIsProfileModalVisible] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [taskHistory, setTaskHistory] = useState<any[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    loadStaff();
  }, [searchText, roleFilter]);

  const loadStaff = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (searchText) params.search = searchText;
      if (roleFilter) params.role = roleFilter;

      const response = await staffApi.getAll(params);
      setStaff(response.data.data.staff);
    } catch (error) {
      message.error('Failed to load staff');
    } finally {
      setLoading(false);
    }
  };

  const columns: ColumnsType<Staff> = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => {
        const colors: Record<string, string> = {
          admin: 'red',
          assistant: 'blue',
          cleaner: 'green',
          maintenance: 'orange',
          owner_view: 'purple',
        };
        return <Tag color={colors[role] || 'default'}>{role.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'red'}>{isActive ? 'Active' : 'Inactive'}</Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button type="link" icon={<EyeOutlined />} onClick={() => handleViewProfile(record)}>
            View Profile
          </Button>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            Edit
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this staff member?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const handleCreate = () => {
    setEditingStaff(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleViewProfile = async (staffMember: Staff) => {
    setSelectedStaff(staffMember);
    setIsProfileModalVisible(true);
    setLoadingTasks(true);
    try {
      const response = await staffApi.getTasks(staffMember.id);
      setTaskHistory(response.data.data || []);
    } catch (error) {
      console.error('Failed to load task history');
      setTaskHistory([]);
    } finally {
      setLoadingTasks(false);
    }
  };

  const handleEdit = (staffMember: Staff) => {
    setEditingStaff(staffMember);
    form.setFieldsValue(staffMember);
    setIsModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await staffApi.delete(id);
      message.success('Staff member deleted successfully');
      loadStaff();
    } catch (error: any) {
      message.error(error.response?.data?.error?.message || 'Failed to delete staff member');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editingStaff) {
        await staffApi.update(editingStaff.id, values);
        message.success('Staff member updated successfully');
      } else {
        await staffApi.create(values);
        message.success('Staff member created successfully');
      }
      setIsModalVisible(false);
      loadStaff();
    } catch (error: any) {
      message.error(error.response?.data?.error?.message || 'Operation failed');
    }
  };

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
          Staff
        </Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          Add Staff
        </Button>
      </div>

      <Space style={{ marginBottom: 16 }}>
        <Input
          placeholder="Search staff..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 300 }}
          allowClear
        />
        <Select
          placeholder="Filter by role"
          style={{ width: 200 }}
          allowClear
          value={roleFilter}
          onChange={setRoleFilter}
        >
          <Option value="admin">Admin</Option>
          <Option value="assistant">Assistant</Option>
          <Option value="cleaner">Cleaner</Option>
          <Option value="maintenance">Maintenance</Option>
          <Option value="owner_view">Owner View</Option>
        </Select>
      </Space>

      <Table
        columns={columns}
        dataSource={staff}
        loading={loading}
        rowKey="id"
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={editingStaff ? 'Edit Staff Member' : 'Create Staff Member'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onOk={() => form.submit()}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: 'Please enter name' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="role" label="Role" rules={[{ required: true }]}>
            <Select getPopupContainer={() => document.body}>
              <Option value="admin">Admin</Option>
              <Option value="assistant">Assistant</Option>
              <Option value="cleaner">Cleaner</Option>
              <Option value="maintenance">Maintenance</Option>
              <Option value="owner_view">Owner View</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="email"
            label="Email"
            rules={[{ type: 'email', message: 'Please enter a valid email' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="Phone">
            <Input />
          </Form.Item>
          <Form.Item name="isActive" label="Active" valuePropName="checked" initialValue={true}>
            <Switch />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={
          <Space>
            <UserOutlined />
            <span>Staff Profile: {selectedStaff?.name}</span>
          </Space>
        }
        open={isProfileModalVisible}
        onCancel={() => setIsProfileModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsProfileModalVisible(false)}>
            Close
          </Button>,
        ]}
        width={800}
      >
        {selectedStaff && (
          <Tabs
            items={[
              {
                key: 'details',
                label: 'Contact Details',
                children: (
                  <Descriptions column={1} bordered>
                    <Descriptions.Item label="Name">{selectedStaff.name}</Descriptions.Item>
                    <Descriptions.Item label="Email">
                      {selectedStaff.email || 'N/A'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Phone">
                      {selectedStaff.phone || 'N/A'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Role">
                      <Tag
                        color={
                          selectedStaff.role === 'admin'
                            ? 'red'
                            : selectedStaff.role === 'assistant'
                              ? 'blue'
                              : selectedStaff.role === 'cleaner'
                                ? 'green'
                                : selectedStaff.role === 'maintenance'
                                  ? 'orange'
                                  : 'purple'
                        }
                      >
                        {selectedStaff.role.toUpperCase()}
                      </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Status">
                      <Tag color={selectedStaff.isActive ? 'success' : 'default'}>
                        {selectedStaff.isActive ? 'Active' : 'Inactive'}
                      </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Created At">
                      {new Date(selectedStaff.createdAt).toLocaleDateString()}
                    </Descriptions.Item>
                  </Descriptions>
                ),
              },
              {
                key: 'tasks',
                label: 'Task Assignment History',
                children: (
                  <Spin spinning={loadingTasks}>
                    {taskHistory.length > 0 ? (
                      <Table
                        dataSource={taskHistory}
                        rowKey="id"
                        pagination={{ pageSize: 5 }}
                        columns={[
                          {
                            title: 'Task Type',
                            dataIndex: 'type',
                            key: 'type',
                            render: (type: string) => (
                              <Tag color={type === 'cleaning' ? 'blue' : 'orange'}>
                                {type?.toUpperCase() || 'N/A'}
                              </Tag>
                            ),
                          },
                          {
                            title: 'Title',
                            dataIndex: 'title',
                            key: 'title',
                          },
                          {
                            title: 'Status',
                            dataIndex: 'status',
                            key: 'status',
                            render: (status: string) => (
                              <Tag
                                color={
                                  status === 'completed'
                                    ? 'success'
                                    : status === 'in_progress'
                                      ? 'processing'
                                      : 'default'
                                }
                              >
                                {status?.replace('_', ' ').toUpperCase() || 'N/A'}
                              </Tag>
                            ),
                          },
                          {
                            title: 'Assigned Date',
                            dataIndex: 'createdAt',
                            key: 'createdAt',
                            render: (date: string) =>
                              date ? new Date(date).toLocaleDateString() : 'N/A',
                          },
                        ]}
                      />
                    ) : (
                      <Empty description="No task history available" />
                    )}
                  </Spin>
                ),
              },
            ]}
          />
        )}
      </Modal>
    </div>
  );
};

export default StaffPage;
