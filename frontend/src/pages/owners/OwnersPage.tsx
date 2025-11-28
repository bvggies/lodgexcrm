import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Typography, Input, Modal, Form, message, Popconfirm } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  FileTextOutlined,
  PhoneOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';
import { ownersApi, Owner } from '../../services/api/ownersApi';
import { useCalling } from '../../contexts/CallingContext';
import { useTranslation } from 'react-i18next';

const { Title } = Typography;

const OwnersPage: React.FC = () => {
  const navigate = useNavigate();
  const { openDialer } = useCalling();
  const { t } = useTranslation();
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
      message.error(t('owners.failedToLoad'));
    } finally {
      setLoading(false);
    }
  };

  const columns: ColumnsType<Owner> = [
    {
      title: t('common.name'),
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: t('common.email'),
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: t('common.phone'),
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: t('common.actions'),
      key: 'actions',
      render: (_, record) => (
        <Space>
          {record.phone && (
            <Button
              type="link"
              icon={<PhoneOutlined />}
              onClick={() => openDialer(record.phone || '')}
              style={{ color: '#52c41a' }}
            >
              {t('owners.call')}
            </Button>
          )}
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            {t('common.edit')}
          </Button>
          <Button
            type="link"
            icon={<FileTextOutlined />}
            onClick={() => navigate(`/owners/${record.id}/statements`)}
          >
            {t('menu.statements')}
          </Button>
          <Popconfirm
            title={t('common.deleteConfirm')}
            onConfirm={() => handleDelete(record.id)}
            okText={t('common.yes')}
            cancelText={t('common.no')}
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              {t('common.delete')}
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
      message.success(t('owners.ownerDeleted'));
      loadOwners();
    } catch (error: any) {
      message.error(error.response?.data?.error?.message || t('owners.failedToDelete'));
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editingOwner) {
        await ownersApi.update(editingOwner.id, values);
        message.success(t('owners.ownerUpdated'));
      } else {
        await ownersApi.create(values);
        message.success(t('owners.ownerCreated'));
      }
      setIsModalVisible(false);
      loadOwners();
    } catch (error: any) {
      message.error(error.response?.data?.error?.message || t('common.operationFailed'));
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
          {t('owners.title')}
        </Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          {t('owners.addOwner')}
        </Button>
      </div>

      <Input
        placeholder={t('owners.searchOwners')}
        prefix={<SearchOutlined />}
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        style={{ width: 400, marginBottom: 16 }}
        allowClear
      />

      <div>
        <Table
          columns={columns}
          dataSource={owners}
          loading={loading}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </div>

      <Modal
        title={editingOwner ? t('owners.editOwner') : t('owners.addOwner')}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onOk={() => form.submit()}
        width={600}
        okText={t('common.save')}
        cancelText={t('common.cancel')}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="name"
            label={t('common.name')}
            rules={[{ required: true, message: t('common.name') + ' ' + t('common.required') }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="email"
            label={t('common.email')}
            rules={[{ type: 'email', message: t('auth.pleaseEnterValidEmail') }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="phone" label={t('common.phone')}>
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default OwnersPage;
