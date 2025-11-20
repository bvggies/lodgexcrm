import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Typography, Input, Modal, Form, message, Popconfirm } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { ColumnsType } from 'antd/es/table';
import { ownersApi, Owner } from '../../services/api/ownersApi';
import FadeIn from '../../components/animations/FadeIn';

const { Title } = Typography;

const OwnersPage: React.FC = () => {
  const navigate = useNavigate();
  const [owners, setOwners] = useState<Owner[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingOwner, setEditingOwner] = useState<Owner | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadOwners();
  }, [searchText]);

  const loadOwners = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (searchText) params.search = searchText;

      const response = await ownersApi.getAll(params);
      setOwners(response.data.data.owners);
    } catch (error) {
      message.error('Failed to load owners');
    } finally {
      setLoading(false);
    }
  };

  const columns: ColumnsType<Owner> = [
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
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            Edit
          </Button>
          <Button
            type="link"
            icon={<FileTextOutlined />}
            onClick={() => navigate(`/owners/${record.id}/statements`)}
          >
            Statements
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this owner?"
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
    setEditingOwner(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (owner: Owner) => {
    setEditingOwner(owner);
    form.setFieldsValue(owner);
    setIsModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await ownersApi.delete(id);
      message.success('Owner deleted successfully');
      loadOwners();
    } catch (error: any) {
      message.error(error.response?.data?.error?.message || 'Failed to delete owner');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editingOwner) {
        await ownersApi.update(editingOwner.id, values);
        message.success('Owner updated successfully');
      } else {
        await ownersApi.create(values);
        message.success('Owner created successfully');
      }
      setIsModalVisible(false);
      loadOwners();
    } catch (error: any) {
      message.error(error.response?.data?.error?.message || 'Operation failed');
    }
  };

  return (
    <div>
      <FadeIn>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 24,
          }}
        >
          <Title level={2} style={{ margin: 0 }}>
            Owners
          </Title>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            Add Owner
          </Button>
        </div>

        <Input
          placeholder="Search owners..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 400, marginBottom: 16 }}
          allowClear
        />
      </FadeIn>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
        <Table
          columns={columns}
          dataSource={owners}
          loading={loading}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </motion.div>

      <Modal
        title={editingOwner ? 'Edit Owner' : 'Create Owner'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onOk={() => form.submit()}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="name"
            label="Owner Name"
            rules={[{ required: true, message: 'Please enter owner name' }]}
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
        </Form>
      </Modal>
    </div>
  );
};

export default OwnersPage;
