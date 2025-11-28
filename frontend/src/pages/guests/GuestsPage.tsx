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
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  PhoneOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { guestsApi, Guest } from '../../services/api/guestsApi';
import { useCalling } from '../../contexts/CallingContext';
import { useTranslation } from 'react-i18next';
import type { ColumnsType } from 'antd/es/table';

const { Title } = Typography;

const GuestsPage: React.FC = () => {
  const navigate = useNavigate();
  const { openDialer } = useCalling();
  const { t } = useTranslation();
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
      message.error(t('guests.failedToLoad'));
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
      message.success(t('guests.guestDeleted'));
      loadGuests();
    } catch (error: any) {
      message.error(error.response?.data?.error?.message || t('guests.failedToDelete'));
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editingGuest) {
        await guestsApi.update(editingGuest.id, values);
        message.success(t('guests.guestUpdated'));
      } else {
        await guestsApi.create(values);
        message.success(t('guests.guestCreated'));
      }
      setIsModalVisible(false);
      loadGuests();
    } catch (error: any) {
      message.error(error.response?.data?.error?.message || t('common.operationFailed'));
    }
  };

  const columns: ColumnsType<Guest> = [
    {
      title: t('common.name'),
      key: 'name',
      render: (_, record) => `${record.firstName} ${record.lastName}`,
      sorter: (a, b) =>
        `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`),
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
        <Tag color={blacklist ? 'red' : 'green'}>
          {blacklist ? t('common.yes') : t('common.no')}
        </Tag>
      ),
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
              onClick={() => openDialer(record.phone || '', record.id)}
              style={{ color: '#52c41a' }}
            >
              {t('guests.call')}
            </Button>
          )}
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            {t('common.edit')}
          </Button>
          <Button type="link" onClick={() => navigate(`/guests/${record.id}`)}>
            {t('common.view')}
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
          {t('guests.title')}
        </Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          {t('guests.addGuest')}
        </Button>
      </div>

      <Input
        placeholder={t('guests.searchGuests')}
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
