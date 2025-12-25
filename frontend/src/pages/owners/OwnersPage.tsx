import React, { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Space,
  Typography,
  Input,
  Modal,
  Form,
  message,
  Popconfirm,
  Tabs,
  Card,
  Statistic,
  Tag,
  Select,
  Checkbox,
  Spin,
  Empty,
  Descriptions,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  FileTextOutlined,
  PhoneOutlined,
  HomeOutlined,
  AppstoreOutlined,
  DollarOutlined,
  EyeOutlined,
  CheckOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';
import { ownersApi, Owner } from '../../services/api/ownersApi';
import { propertiesApi, Property } from '../../services/api/propertiesApi';
import { useCalling } from '../../contexts/CallingContext';
import { useTranslation } from 'react-i18next';

const { Title, Text } = Typography;
const { Option } = Select;

const OwnersPage: React.FC = () => {
  const navigate = useNavigate();
  const { openDialer } = useCalling();
  const { t } = useTranslation();
  const [owners, setOwners] = useState<Owner[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [editingOwner, setEditingOwner] = useState<Owner | null>(null);
  const [selectedOwner, setSelectedOwner] = useState<Owner | null>(null);
  const [ownerDetails, setOwnerDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [allProperties, setAllProperties] = useState<Property[]>([]);
  const [loadingProperties, setLoadingProperties] = useState(false);
  const [assigningProperties, setAssigningProperties] = useState(false);
  const [selectedPropertyIds, setSelectedPropertyIds] = useState<string[]>([]);
  const [form] = Form.useForm();
  const [assignForm] = Form.useForm();

  useEffect(() => {
    loadOwners();
  }, [searchText]);

  useEffect(() => {
    if (isDetailModalVisible && selectedOwner) {
      loadOwnerDetails(selectedOwner.id);
      loadAllProperties();
    }
  }, [isDetailModalVisible, selectedOwner]);

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

  const loadOwnerDetails = async (id: string) => {
    try {
      setLoadingDetails(true);
      const response = await ownersApi.getDetails(id);
      setOwnerDetails(response.data.data);
    } catch (error: any) {
      message.error(error.response?.data?.error?.message || 'Failed to load owner details');
    } finally {
      setLoadingDetails(false);
    }
  };

  const loadAllProperties = async () => {
    try {
      setLoadingProperties(true);
      const response = await propertiesApi.getAll();
      setAllProperties(response.data.data.properties);
    } catch (error) {
      message.error('Failed to load properties');
    } finally {
      setLoadingProperties(false);
    }
  };

  const handleViewDetails = (owner: Owner) => {
    setSelectedOwner(owner);
    setIsDetailModalVisible(true);
    setSelectedPropertyIds([]);
  };

  const handleAssignProperties = async () => {
    if (selectedPropertyIds.length === 0) {
      message.warning('Please select at least one property');
      return;
    }

    try {
      setAssigningProperties(true);
      await ownersApi.assignProperties(selectedOwner!.id, selectedPropertyIds);
      message.success(`Successfully assigned ${selectedPropertyIds.length} properties`);
      setSelectedPropertyIds([]);
      loadOwnerDetails(selectedOwner!.id);
      loadOwners();
    } catch (error: any) {
      message.error(error.response?.data?.error?.message || 'Failed to assign properties');
    } finally {
      setAssigningProperties(false);
    }
  };

  const handleUnassignProperty = async (propertyId: string, newOwnerId: string) => {
    try {
      await ownersApi.unassignProperty(selectedOwner!.id, propertyId, newOwnerId);
      message.success('Property reassigned successfully');
      loadOwnerDetails(selectedOwner!.id);
      loadOwners();
    } catch (error: any) {
      message.error(error.response?.data?.error?.message || 'Failed to reassign property');
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
      title: 'Properties',
      key: 'properties',
      render: (_, record: any) => (
        <Tag color="blue">{record._count?.properties || 0}</Tag>
      ),
    },
    {
      title: t('common.actions'),
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetails(record)}
          >
            View Details
          </Button>
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

  const propertiesColumns: ColumnsType<any> = [
    {
      title: 'Property Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
    },
    {
      title: 'Units',
      key: 'units',
      render: (_, record) => <Tag>{record._count?.units || 0}</Tag>,
    },
    {
      title: 'Bookings',
      key: 'bookings',
      render: (_, record) => <Tag>{record._count?.bookings || 0}</Tag>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>{status.toUpperCase()}</Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Select
          placeholder="Reassign to..."
          style={{ width: 200 }}
          onChange={(newOwnerId) => handleUnassignProperty(record.id, newOwnerId)}
        >
          {owners
            .filter((o) => o.id !== selectedOwner?.id)
            .map((owner) => (
              <Option key={owner.id} value={owner.id}>
                {owner.name}
              </Option>
            ))}
        </Select>
      ),
    },
  ];

  const unitsColumns: ColumnsType<any> = [
    {
      title: 'Unit Code',
      dataIndex: 'unitCode',
      key: 'unitCode',
    },
    {
      title: 'Property',
      key: 'property',
      render: (_, record) => `${record.property.name} (${record.property.code})`,
    },
    {
      title: 'Floor',
      dataIndex: 'floor',
      key: 'floor',
    },
    {
      title: 'Price',
      dataIndex: 'currentPrice',
      key: 'currentPrice',
      render: (price: number) => (price ? `AED ${price.toFixed(2)}` : 'N/A'),
    },
    {
      title: 'Bookings',
      key: 'bookings',
      render: (_, record) => <Tag>{record._count?.bookings || 0}</Tag>,
    },
  ];

  const financeColumns: ColumnsType<any> = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag color={type === 'revenue' ? 'green' : 'red'}>{type.toUpperCase()}</Tag>
      ),
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
    },
    {
      title: 'Property',
      key: 'property',
      render: (_, record) => record.property?.name || 'N/A',
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => `AED ${Number(amount).toFixed(2)}`,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'paid' ? 'green' : 'orange'}>{status.toUpperCase()}</Tag>
      ),
    },
  ];

  const tabItems = [
    {
      key: 'properties',
      label: (
        <span>
          <HomeOutlined /> Properties ({ownerDetails?.properties?.length || 0})
        </span>
      ),
      children: (
        <div>
          <Card
            title="Assign Properties"
            style={{ marginBottom: 16 }}
            extra={
              <Button
                type="primary"
                icon={<CheckOutlined />}
                onClick={handleAssignProperties}
                loading={assigningProperties}
                disabled={selectedPropertyIds.length === 0}
              >
                Assign Selected ({selectedPropertyIds.length})
              </Button>
            }
          >
            <div style={{ maxHeight: 200, overflowY: 'auto', marginBottom: 16 }}>
              {loadingProperties ? (
                <Spin />
              ) : (
                <Checkbox.Group
                  value={selectedPropertyIds}
                  onChange={(values) => setSelectedPropertyIds(values as string[])}
                  style={{ width: '100%' }}
                >
                  <Space direction="vertical" style={{ width: '100%' }}>
                    {allProperties
                      .filter((p) => p.ownerId !== selectedOwner?.id)
                      .map((property) => (
                        <Checkbox key={property.id} value={property.id}>
                          {property.name} ({property.code})
                        </Checkbox>
                      ))}
                    {allProperties.filter((p) => p.ownerId !== selectedOwner?.id).length === 0 && (
                      <Empty description="No unassigned properties available" />
                    )}
                  </Space>
                </Checkbox.Group>
              )}
            </div>
          </Card>
          <Table
            columns={propertiesColumns}
            dataSource={ownerDetails?.properties || []}
            rowKey="id"
            pagination={{ pageSize: 10 }}
          />
        </div>
      ),
    },
    {
      key: 'units',
      label: (
        <span>
          <AppstoreOutlined /> Units ({ownerDetails?.units?.length || 0})
        </span>
      ),
      children: (
        <Table
          columns={unitsColumns}
          dataSource={ownerDetails?.units || []}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      ),
    },
    {
      key: 'finances',
      label: (
        <span>
          <DollarOutlined /> Finances
        </span>
      ),
      children: (
        <div>
          <Card style={{ marginBottom: 16 }}>
            <Space size="large">
              <Statistic
                title="Total Revenue"
                value={ownerDetails?.summary?.totalRevenue || 0}
                prefix="AED"
                valueStyle={{ color: '#3f8600' }}
              />
              <Statistic
                title="Total Expenses"
                value={ownerDetails?.summary?.totalExpenses || 0}
                prefix="AED"
                valueStyle={{ color: '#cf1322' }}
              />
              <Statistic
                title="Net Income"
                value={ownerDetails?.summary?.netIncome || 0}
                prefix="AED"
                valueStyle={{
                  color: (ownerDetails?.summary?.netIncome || 0) >= 0 ? '#3f8600' : '#cf1322',
                }}
              />
            </Space>
          </Card>
          <Table
            columns={financeColumns}
            dataSource={ownerDetails?.financeRecords || []}
            rowKey="id"
            pagination={{ pageSize: 10 }}
          />
        </div>
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

      <Modal
        title={
          <div>
            <Title level={4} style={{ margin: 0 }}>
              {selectedOwner?.name} - Details
            </Title>
            <Text type="secondary">{selectedOwner?.email}</Text>
          </div>
        }
        open={isDetailModalVisible}
        onCancel={() => {
          setIsDetailModalVisible(false);
          setSelectedOwner(null);
          setOwnerDetails(null);
          setSelectedPropertyIds([]);
        }}
        footer={null}
        width={1200}
        style={{ top: 20 }}
      >
        {loadingDetails ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Spin size="large" />
          </div>
        ) : ownerDetails ? (
          <div>
            <Card style={{ marginBottom: 16 }}>
              <Descriptions column={4}>
                <Descriptions.Item label="Total Properties">
                  <Tag color="blue">{ownerDetails.summary?.totalProperties || 0}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Total Units">
                  <Tag color="green">{ownerDetails.summary?.totalUnits || 0}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Total Revenue">
                  <Text strong style={{ color: '#3f8600' }}>
                    AED {ownerDetails.summary?.totalRevenue?.toFixed(2) || '0.00'}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="Net Income">
                  <Text
                    strong
                    style={{
                      color: (ownerDetails.summary?.netIncome || 0) >= 0 ? '#3f8600' : '#cf1322',
                    }}
                  >
                    AED {ownerDetails.summary?.netIncome?.toFixed(2) || '0.00'}
                  </Text>
                </Descriptions.Item>
              </Descriptions>
            </Card>
            <Tabs items={tabItems} />
          </div>
        ) : (
          <Empty description="No details available" />
        )}
      </Modal>
    </div>
  );
};

export default OwnersPage;
