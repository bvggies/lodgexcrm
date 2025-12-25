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
  InputNumber,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  UserOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { usersApi, User } from '../../services/api/usersApi';
import { useTranslation } from 'react-i18next';

const { Title } = Typography;
const { Option } = Select;

const UsersPage: React.FC = () => {
  const { t } = useTranslation();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [roleFilter, setRoleFilter] = useState<string | undefined>();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadUsers();
  }, [searchText, roleFilter]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (searchText) params.search = searchText;
      if (roleFilter) params.role = roleFilter;

      const response = await usersApi.getAll(params);
      setUsers(response.data.data.users);
    } catch (error) {
      message.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const columns: ColumnsType<User> = [
    {
      title: 'Name',
      key: 'name',
      render: (_, record) => `${record.firstName} ${record.lastName}`,
      sorter: (a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      sorter: (a, b) => (a.email || '').localeCompare(b.email || ''),
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => {
        const colorMap: Record<string, string> = {
          admin: 'red',
          assistant: 'blue',
          cleaner: 'green',
          maintenance: 'orange',
          owner_view: 'purple',
          guest: 'cyan',
        };
        return <Tag color={colorMap[role] || 'default'}>{role.toUpperCase()}</Tag>;
      },
      filters: [
        { text: 'Admin', value: 'admin' },
        { text: 'Assistant', value: 'assistant' },
        { text: 'Cleaner', value: 'cleaner' },
        { text: 'Maintenance', value: 'maintenance' },
        { text: 'Owner View', value: 'owner_view' },
        { text: 'Guest', value: 'guest' },
      ],
      onFilter: (value, record) => record.role === value,
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'red'}>{isActive ? 'Active' : 'Inactive'}</Tag>
      ),
      filters: [
        { text: 'Active', value: true },
        { text: 'Inactive', value: false },
      ],
      onFilter: (value, record) => record.isActive === value,
    },
    {
      title: 'Last Login',
      dataIndex: 'lastLogin',
      key: 'lastLogin',
      render: (lastLogin: string) => (lastLogin ? new Date(lastLogin).toLocaleDateString() : 'Never'),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            size="small"
          >
            Edit
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this user?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="link" danger icon={<DeleteOutlined />} size="small">
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const handleCreate = () => {
    setEditingUser(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    form.setFieldsValue({
      ...user,
      password: '', // Don't pre-fill password
    });
    setIsModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await usersApi.delete(id);
      message.success('User deleted successfully');
      loadUsers();
    } catch (error: any) {
      message.error(error.response?.data?.error?.message || 'Failed to delete user');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editingUser) {
        // Only include password if it was provided
        const updateData: any = { ...values };
        if (!updateData.password || updateData.password.trim() === '') {
          delete updateData.password;
        }
        await usersApi.update(editingUser.id, updateData);
        message.success('User updated successfully');
      } else {
        await usersApi.create(values);
        message.success('User created successfully');
      }
      setIsModalVisible(false);
      loadUsers();
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
          <UserOutlined /> User Management
        </Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          Create User
        </Button>
      </div>

      <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
        <Input
          placeholder="Search users..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 300 }}
          allowClear
        />
        <Select
          placeholder="Filter by role"
          value={roleFilter}
          onChange={setRoleFilter}
          allowClear
          style={{ width: 200 }}
          getPopupContainer={() => document.body}
        >
          <Option value="admin">Admin</Option>
          <Option value="assistant">Assistant</Option>
          <Option value="cleaner">Cleaner</Option>
          <Option value="maintenance">Maintenance</Option>
          <Option value="owner_view">Owner View</Option>
          <Option value="guest">Guest</Option>
        </Select>
      </Space>

      <Table
        columns={columns}
        dataSource={users}
        loading={loading}
        rowKey="id"
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={editingUser ? 'Edit User' : 'Create User'}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        width={600}
        okText="Save"
        cancelText="Cancel"
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
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
            rules={[
              { required: true, message: 'Please enter email' },
              { type: 'email', message: 'Please enter a valid email' },
            ]}
          >
            <Input disabled={!!editingUser} />
          </Form.Item>
          <Form.Item
            name="password"
            label="Password"
            rules={[
              { required: !editingUser, message: 'Please enter password' },
              { min: 8, message: 'Password must be at least 8 characters' },
            ]}
            help={editingUser ? 'Leave empty to keep current password' : undefined}
          >
            <Input.Password placeholder={editingUser ? 'Enter new password (optional)' : 'Enter password'} />
          </Form.Item>
          <Form.Item name="role" label="Role" rules={[{ required: true }]}>
            <Select getPopupContainer={() => document.body}>
              <Option value="admin">Admin</Option>
              <Option value="assistant">Assistant</Option>
              <Option value="cleaner">Cleaner</Option>
              <Option value="maintenance">Maintenance</Option>
              <Option value="owner_view">Owner View</Option>
              <Option value="guest">Guest</Option>
            </Select>
          </Form.Item>
          <Form.Item name="phone" label="Phone">
            <Input />
          </Form.Item>
          <Form.Item name="isActive" label="Active" valuePropName="checked" initialValue={true}>
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UsersPage;

