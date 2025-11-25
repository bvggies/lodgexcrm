import React, { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Space,
  Tag,
  Typography,
  Input,
  Modal,
  Form,
  message,
  Popconfirm,
  Switch,
  InputNumber,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { guestsApi, Guest } from '../../services/api/guestsApi';
import type { ColumnsType } from 'antd/es/table';

const { Title } = Typography;

const GuestsPage: React.FC = () => {
  const navigate = useNavigate();
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadGuests();
  }, [searchText]);

  const loadGuests = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (searchText) params.search = searchText;

      const response = await guestsApi.getAll(params);
      setGuests(response.data.data.guests);
    } catch (error) {
      message.error('Failed to load guests');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingGuest(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (guest: Guest) => {
    setEditingGuest(guest);
    form.setFieldsValue(guest);
    setIsModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await guestsApi.delete(id);
      message.success('Guest deleted successfully');
      loadGuests();
    } catch (error) {
      message.error('Failed to delete guest');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editingGuest) {
        await guestsApi.update(editingGuest.id, values);
        message.success('Guest updated successfully');
      } else {
        await guestsApi.create(values);
        message.success('Guest created successfully');
      }
      setIsModalVisible(false);
      loadGuests();
    } catch (error: any) {
      message.error(error.response?.data?.error?.message || 'Operation failed');
    }
  };

  const columns: ColumnsType<Guest> = [
    {
      title: 'Name',
      key: 'name',
      render: (_, record) => `${record.firstName} ${record.lastName}`,
      sorter: (a, b) =>
        `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`),
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
      title: 'Total Spend',
      dataIndex: 'totalSpend',
      key: 'totalSpend',
      render: (amount: any) => {
        const numAmount = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
        return `${numAmount.toFixed(2)} AED`;
      },
      sorter: (a, b) => Number(a.totalSpend || 0) - Number(b.totalSpend || 0),
    },
    {
      title: 'Blacklist',
      dataIndex: 'blacklist',
      key: 'blacklist',
      render: (blacklist: boolean) => (
        <Tag color={blacklist ? 'red' : 'green'}>{blacklist ? 'Yes' : 'No'}</Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            Edit
          </Button>
          <Button type="link" onClick={() => navigate(`/guests/${record.id}`)}>
            View
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this guest?"
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
          Guests
        </Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          Add Guest
        </Button>
      </div>

      <Input
        placeholder="Search guests by name, email, or phone..."
        prefix={<SearchOutlined />}
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        style={{ width: 400, marginBottom: 16 }}
        allowClear
      />

      <div>
        <Table
          columns={columns}
          dataSource={guests}
          loading={loading}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </div>

      <Modal
        title={editingGuest ? 'Edit Guest' : 'Create Guest'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onOk={() => form.submit()}
        width={600}
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
            rules={[{ type: 'email', message: 'Please enter a valid email' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="Phone">
            <Input />
          </Form.Item>
          <Form.Item name="nationality" label="Nationality">
            <Input />
          </Form.Item>
          <Form.Item name="blacklist" label="Blacklist" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="totalSpend" label="Total Spend (AED)">
            <InputNumber style={{ width: '100%' }} min={0} step={0.01} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default GuestsPage;
