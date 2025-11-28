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
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { propertiesApi, Property } from '../../services/api/propertiesApi';
import { ownersApi, Owner } from '../../services/api/ownersApi';
import { useTranslation } from 'react-i18next';
import type { ColumnsType } from 'antd/es/table';

const { Title } = Typography;
const { Option } = Select;

const PropertiesPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [properties, setProperties] = useState<Property[]>([]);
  const [owners, setOwners] = useState<Owner[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [ownerFilter, setOwnerFilter] = useState<string | undefined>();
  const [unitTypeFilter, setUnitTypeFilter] = useState<string | undefined>();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadProperties();
    loadOwners();
  }, [searchText, statusFilter, ownerFilter, unitTypeFilter]);

  const loadOwners = async () => {
    try {
      const response = await ownersApi.getAll();
      setOwners(response.data.data.owners);
    } catch (error) {
      console.error('Failed to load owners:', error);
    }
  };

  const loadProperties = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (searchText) params.search = searchText;
      if (statusFilter) params.status = statusFilter;
      if (ownerFilter) params.ownerId = ownerFilter;
      if (unitTypeFilter) params.unitType = unitTypeFilter;

      const response = await propertiesApi.getAll(params);
      let filteredProperties = response.data.data.properties;

      // Client-side filter for unitType if not supported by API
      if (unitTypeFilter && !params.unitType) {
        filteredProperties = filteredProperties.filter(
          (p: Property) => p.unitType === unitTypeFilter
        );
      }

      setProperties(filteredProperties);
    } catch (error) {
      message.error(t('properties.failedToLoad'));
    } finally {
      setLoading(false);
    }
  };

  const uniqueUnitTypes = Array.from(new Set(properties.map((p) => p.unitType))).filter(Boolean);

  const handleCreate = () => {
    setEditingProperty(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (property: Property) => {
    setEditingProperty(property);
    form.setFieldsValue(property);
    setIsModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await propertiesApi.delete(id);
      message.success(t('properties.propertyDeleted'));
      loadProperties();
    } catch (error: any) {
      message.error(error.response?.data?.error?.message || t('properties.failedToDelete'));
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editingProperty) {
        await propertiesApi.update(editingProperty.id, values);
        message.success(t('properties.propertyUpdated'));
      } else {
        await propertiesApi.create(values);
        message.success(t('properties.propertyCreated'));
      }
      setIsModalVisible(false);
      loadProperties();
    } catch (error: any) {
      message.error(error.response?.data?.error?.message || t('common.operationFailed'));
    }
  };

  const columns: ColumnsType<Property> = [
    {
      title: t('common.name'),
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: t('properties.code'),
      dataIndex: 'code',
      key: 'code',
    },
    {
      title: t('properties.unitType'),
      dataIndex: 'unitType',
      key: 'unitType',
    },
    {
      title: t('common.status'),
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>{status.toUpperCase()}</Tag>
      ),
    },
    {
      title: t('common.actions'),
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            {t('common.edit')}
          </Button>
          <Button type="link" onClick={() => navigate(`/properties/${record.id}`)}>
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
          {t('properties.title')}
        </Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          {t('properties.addProperty')}
        </Button>
      </div>

      <Space style={{ marginBottom: 16, width: '100%', flexWrap: 'wrap' }}>
        <Input
          placeholder={t('properties.searchProperties')}
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 300 }}
          allowClear
        />
        <Select
          placeholder={t('properties.filterByStatus')}
          style={{ width: 180 }}
          allowClear
          value={statusFilter}
          onChange={setStatusFilter}
        >
          <Option value="active">{t('common.active')}</Option>
          <Option value="inactive">{t('common.inactive')}</Option>
        </Select>
        <Select
          placeholder={t('properties.filterByOwner')}
          style={{ width: 200 }}
          allowClear
          value={ownerFilter}
          onChange={setOwnerFilter}
          showSearch
          filterOption={(input, option) =>
            String(option?.label ?? '')
              .toLowerCase()
              .includes(input.toLowerCase())
          }
        >
          {owners.map((owner) => (
            <Option key={owner.id} value={owner.id} label={owner.name}>
              {owner.name}
            </Option>
          ))}
        </Select>
        <Select
          placeholder={t('properties.filterByUnitType')}
          style={{ width: 180 }}
          allowClear
          value={unitTypeFilter}
          onChange={setUnitTypeFilter}
        >
          {uniqueUnitTypes.map((type) => (
            <Option key={type} value={type}>
              {type}
            </Option>
          ))}
        </Select>
      </Space>

      <Table
        columns={columns}
        dataSource={properties}
        loading={loading}
        rowKey="id"
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={editingProperty ? t('properties.editProperty') : t('properties.addProperty')}
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
            label={t('properties.propertyName')}
            rules={[
              {
                required: true,
                message: t('properties.propertyName') + ' ' + t('common.required'),
              },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="code"
            label={t('properties.propertyCode')}
            rules={[
              {
                required: true,
                message: t('properties.propertyCode') + ' ' + t('common.required'),
              },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="unitType"
            label={t('properties.unitType')}
            rules={[
              { required: true, message: t('properties.unitType') + ' ' + t('common.required') },
            ]}
          >
            <Input placeholder="e.g., Studio, 1BR, 2BR" />
          </Form.Item>
          <Form.Item
            name="ownerId"
            label={t('properties.owner')}
            rules={[
              { required: true, message: t('common.pleaseSelect') + ' ' + t('properties.owner') },
            ]}
          >
            <Select
              placeholder={t('common.pleaseSelect') + ' ' + t('properties.owner')}
              showSearch
              notFoundContent={owners.length === 0 ? t('common.noData') : undefined}
              filterOption={(input, option) =>
                String(option?.label ?? '')
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
              options={owners.map((o) => ({
                value: o.id,
                label: o.name + (o.email ? ` (${o.email})` : ''),
              }))}
            />
          </Form.Item>
          <Form.Item name="status" label={t('common.status')} initialValue="active">
            <Select getPopupContainer={() => document.body}>
              <Option value="active">{t('common.active')}</Option>
              <Option value="inactive">{t('common.inactive')}</Option>
            </Select>
          </Form.Item>
          <Form.Item name="dewaNumber" label="DEWA Number">
            <Input />
          </Form.Item>
          <Form.Item name="dtcmPermitNumber" label="DTCM Permit Number">
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default PropertiesPage;
