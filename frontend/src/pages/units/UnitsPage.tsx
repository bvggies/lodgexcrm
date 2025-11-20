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
  InputNumber,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { unitsApi, Unit } from '../../services/api/unitsApi';
import { propertiesApi, Property } from '../../services/api/propertiesApi';
import FadeIn from '../../components/animations/FadeIn';
import type { ColumnsType } from 'antd/es/table';

const { Title } = Typography;
const { Option } = Select;

const UnitsPage: React.FC = () => {
  const navigate = useNavigate();
  const [units, setUnits] = useState<Unit[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [propertyFilter, setPropertyFilter] = useState<string | undefined>();
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadUnits();
    loadProperties();
  }, [propertyFilter, statusFilter]);

  const loadUnits = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (propertyFilter) params.propertyId = propertyFilter;
      if (statusFilter) params.availabilityStatus = statusFilter;

      const response = await unitsApi.getAll(params);
      setUnits(response.data.data.units);
    } catch (error) {
      message.error('Failed to load units');
    } finally {
      setLoading(false);
    }
  };

  const loadProperties = async () => {
    try {
      const response = await propertiesApi.getAll({ status: 'active' });
      setProperties(response.data.data.properties);
    } catch (error) {
      console.error('Failed to load properties:', error);
    }
  };

  const handleCreate = () => {
    setEditingUnit(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (unit: Unit) => {
    setEditingUnit(unit);
    form.setFieldsValue(unit);
    setIsModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await unitsApi.delete(id);
      message.success('Unit deleted successfully');
      loadUnits();
    } catch (error: any) {
      message.error(error.response?.data?.error?.message || 'Failed to delete unit');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editingUnit) {
        await unitsApi.update(editingUnit.id, values);
        message.success('Unit updated successfully');
      } else {
        await unitsApi.create(values);
        message.success('Unit created successfully');
      }
      setIsModalVisible(false);
      loadUnits();
    } catch (error: any) {
      message.error(error.response?.data?.error?.message || 'Operation failed');
    }
  };

  const columns: ColumnsType<Unit> = [
    {
      title: 'Unit Code',
      dataIndex: 'unitCode',
      key: 'unitCode',
    },
    {
      title: 'Property',
      key: 'property',
      render: (_, record) => record.property?.name || 'N/A',
    },
    {
      title: 'Status',
      dataIndex: 'availabilityStatus',
      key: 'availabilityStatus',
      render: (status: string) => {
        const colors: Record<string, string> = {
          available: 'green',
          occupied: 'blue',
          maintenance: 'orange',
          unavailable: 'red',
        };
        return <Tag color={colors[status] || 'default'}>{status.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Bookings',
      key: 'bookings',
      render: (_, record) => record._count?.bookings || 0,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            Edit
          </Button>
          <Button type="link" onClick={() => navigate(`/units/${record.id}`)}>
            View
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this unit?"
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

  // Filter units by search text
  const filteredUnits = units.filter((unit) => {
    if (!searchText) return true;
    const searchLower = searchText.toLowerCase();
    return (
      unit.unitCode.toLowerCase().includes(searchLower) ||
      unit.property?.name.toLowerCase().includes(searchLower) ||
      unit.property?.code.toLowerCase().includes(searchLower)
    );
  });

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
            Units
          </Title>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            Add Unit
          </Button>
        </div>
      </FadeIn>

      <Space style={{ marginBottom: 16 }}>
        <Input
          placeholder="Search units..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 300 }}
          allowClear
        />
        <Select
          placeholder="Filter by property"
          style={{ width: 250 }}
          allowClear
          value={propertyFilter}
          onChange={setPropertyFilter}
          showSearch
          filterOption={(input, option) =>
            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
          }
        >
          {properties.map((p) => (
            <Option key={p.id} value={p.id} label={`${p.name} (${p.code})`}>
              {p.name} ({p.code})
            </Option>
          ))}
        </Select>
        <Select
          placeholder="Filter by status"
          style={{ width: 200 }}
          allowClear
          value={statusFilter}
          onChange={setStatusFilter}
        >
          <Option value="available">Available</Option>
          <Option value="occupied">Occupied</Option>
          <Option value="maintenance">Maintenance</Option>
          <Option value="unavailable">Unavailable</Option>
        </Select>
      </Space>

      <Table
        columns={columns}
        dataSource={filteredUnits}
        loading={loading}
        rowKey="id"
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={editingUnit ? 'Edit Unit' : 'Create Unit'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onOk={() => form.submit()}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="unitCode"
            label="Unit Code"
            rules={[{ required: true, message: 'Please enter unit code' }]}
          >
            <Input placeholder="e.g., UNIT-101" />
          </Form.Item>
          <Form.Item
            name="propertyId"
            label="Property"
            rules={[{ required: true, message: 'Please select a property' }]}
          >
            <Select
              placeholder="Select a property"
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
            >
              {properties.map((p) => (
                <Option key={p.id} value={p.id} label={`${p.name} (${p.code})`}>
                  {p.name} ({p.code})
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="floor" label="Floor">
            <InputNumber style={{ width: '100%' }} min={-10} max={200} placeholder="Floor number" />
          </Form.Item>
          <Form.Item name="size" label="Size (sqft)">
            <InputNumber style={{ width: '100%' }} min={0} step={0.01} placeholder="Unit size" />
          </Form.Item>
          <Form.Item name="currentPrice" label="Current Price (AED)">
            <InputNumber style={{ width: '100%' }} min={0} step={0.01} placeholder="0.00" />
          </Form.Item>
          <Form.Item name="availabilityStatus" label="Availability Status" initialValue="available">
            <Select>
              <Option value="available">Available</Option>
              <Option value="occupied">Occupied</Option>
              <Option value="maintenance">Maintenance</Option>
              <Option value="unavailable">Unavailable</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UnitsPage;
