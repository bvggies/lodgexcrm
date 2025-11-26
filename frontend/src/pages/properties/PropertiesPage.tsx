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
import type { ColumnsType } from 'antd/es/table';

const { Title } = Typography;
const { Option } = Select;

const PropertiesPage: React.FC = () => {
  const navigate = useNavigate();
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
      message.error('Failed to load properties');
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
      message.success('Property deleted successfully');
      loadProperties();
    } catch (error: any) {
      message.error(error.response?.data?.error?.message || 'Failed to delete property');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editingProperty) {
        await propertiesApi.update(editingProperty.id, values);
        message.success('Property updated successfully');
      } else {
        await propertiesApi.create(values);
        message.success('Property created successfully');
      }
      setIsModalVisible(false);
      loadProperties();
    } catch (error: any) {
      message.error(error.response?.data?.error?.message || 'Operation failed');
    }
  };

  const columns: ColumnsType<Property> = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
    },
    {
      title: 'Unit Type',
      dataIndex: 'unitType',
      key: 'unitType',
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
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            Edit
          </Button>
          <Button type="link" onClick={() => navigate(`/properties/${record.id}`)}>
            View
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this property?"
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
          Properties
        </Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          Add Property
        </Button>
      </div>

      <Space style={{ marginBottom: 16, width: '100%', flexWrap: 'wrap' }}>
        <Input
          placeholder="Search properties..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 300 }}
          allowClear
        />
        <Select
          placeholder="Filter by status"
          style={{ width: 180 }}
          allowClear
          value={statusFilter}
          onChange={setStatusFilter}
        >
          <Option value="active">Active</Option>
          <Option value="inactive">Inactive</Option>
        </Select>
        <Select
          placeholder="Filter by owner"
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
          placeholder="Filter by unit type"
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
        title={editingProperty ? 'Edit Property' : 'Create Property'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onOk={() => form.submit()}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="name"
            label="Property Name"
            rules={[{ required: true, message: 'Please enter property name' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="code"
            label="Property Code"
            rules={[{ required: true, message: 'Please enter property code' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="unitType"
            label="Unit Type"
            rules={[{ required: true, message: 'Please enter unit type' }]}
          >
            <Input placeholder="e.g., Studio, 1BR, 2BR" />
          </Form.Item>
          <Form.Item
            name="ownerId"
            label="Owner"
            rules={[{ required: true, message: 'Please select an owner' }]}
          >
            <Select
              placeholder="Select an owner"
              showSearch
              notFoundContent={
                owners.length === 0
                  ? 'No owners available. Please create an owner first.'
                  : undefined
              }
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
          <Form.Item name="status" label="Status" initialValue="active">
            <Select getPopupContainer={() => document.body}>
              <Option value="active">Active</Option>
              <Option value="inactive">Inactive</Option>
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
