import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Descriptions,
  Tag,
  Button,
  Space,
  Typography,
  Spin,
  message,
  Divider,
  Table,
  Tabs,
} from 'antd';
import { ArrowLeftOutlined, EditOutlined } from '@ant-design/icons';
import { propertiesApi, Property } from '../../services/api/propertiesApi';
import { bookingsApi } from '../../services/api/bookingsApi';
import { unitsApi } from '../../services/api/unitsApi';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';

const { Title } = Typography;
const { TabPane } = Tabs;

const PropertyDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [property, setProperty] = useState<Property | null>(null);
  const [units, setUnits] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [unitsLoading, setUnitsLoading] = useState(false);
  const [bookingsLoading, setBookingsLoading] = useState(false);

  useEffect(() => {
    if (id) {
      loadProperty();
      loadUnits();
      loadBookings();
    }
  }, [id]);

  const loadProperty = async () => {
    try {
      setLoading(true);
      const response = await propertiesApi.getById(id!);
      setProperty(response.data.data.property);
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to load property');
      navigate('/properties');
    } finally {
      setLoading(false);
    }
  };

  const loadUnits = async () => {
    try {
      setUnitsLoading(true);
      const response = await unitsApi.getAll({ propertyId: id });
      setUnits(response.data.data.units || []);
    } catch (error) {
      console.error('Failed to load units:', error);
    } finally {
      setUnitsLoading(false);
    }
  };

  const loadBookings = async () => {
    try {
      setBookingsLoading(true);
      const response = await bookingsApi.getAll({ propertyId: id });
      setBookings(response.data.data.bookings || []);
    } catch (error) {
      console.error('Failed to load bookings:', error);
    } finally {
      setBookingsLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!property) {
    return (
      <div>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/properties')}>
          Back to Properties
        </Button>
        <Card style={{ marginTop: 16 }}>
          <p>Property not found</p>
        </Card>
      </div>
    );
  }

  const unitColumns: ColumnsType<any> = [
    {
      title: 'Unit Code',
      dataIndex: 'unitCode',
      key: 'unitCode',
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
    },
    {
      title: 'Bedrooms',
      dataIndex: 'bedrooms',
      key: 'bedrooms',
    },
    {
      title: 'Bathrooms',
      dataIndex: 'bathrooms',
      key: 'bathrooms',
    },
    {
      title: 'Status',
      dataIndex: 'availabilityStatus',
      key: 'availabilityStatus',
      render: (status: string) => {
        const colors: Record<string, string> = {
          available: 'green',
          occupied: 'orange',
          maintenance: 'red',
          unavailable: 'default',
        };
        return <Tag color={colors[status] || 'default'}>{status?.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Button size="small" onClick={() => navigate(`/units?edit=${record.id}`)}>
          View
        </Button>
      ),
    },
  ];

  const bookingColumns: ColumnsType<any> = [
    {
      title: 'Reference',
      dataIndex: 'reference',
      key: 'reference',
    },
    {
      title: 'Guest',
      key: 'guest',
      render: (_, record: any) =>
        record?.guest ? `${record.guest.firstName} ${record.guest.lastName}` : 'N/A',
    },
    {
      title: 'Check-in',
      dataIndex: 'checkinDate',
      key: 'checkinDate',
      render: (date: string) => dayjs(date).format('MMM DD, YYYY'),
    },
    {
      title: 'Check-out',
      dataIndex: 'checkoutDate',
      key: 'checkoutDate',
      render: (date: string) => dayjs(date).format('MMM DD, YYYY'),
    },
    {
      title: 'Amount',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amount: any) => {
        const numAmount = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
        return `AED ${numAmount.toFixed(2)}`;
      },
    },
    {
      title: 'Status',
      dataIndex: 'paymentStatus',
      key: 'paymentStatus',
      render: (status: string) => {
        const colors: Record<string, string> = {
          paid: 'green',
          pending: 'orange',
          partial: 'blue',
          refunded: 'red',
        };
        return <Tag color={colors[status] || 'default'}>{status?.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Button size="small" onClick={() => navigate(`/bookings/${record.id}`)}>
          View
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 24 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/properties')}>
          Back to Properties
        </Button>
        <Button
          type="primary"
          icon={<EditOutlined />}
          onClick={() => navigate(`/properties?edit=${id}`)}
        >
          Edit Property
        </Button>
      </Space>

      <Card>
        <Title level={2}>Property Details</Title>
        <Divider />
        <Descriptions column={1} bordered>
          <Descriptions.Item label="Name">
            <strong>{property.name}</strong>
          </Descriptions.Item>
          <Descriptions.Item label="Code">{property.code}</Descriptions.Item>
          <Descriptions.Item label="Type">{(property as any).type || 'N/A'}</Descriptions.Item>
          <Descriptions.Item label="Address">{(property as any).address || 'N/A'}</Descriptions.Item>
          <Descriptions.Item label="City">{(property as any).city || 'N/A'}</Descriptions.Item>
          <Descriptions.Item label="Country">{(property as any).country || 'N/A'}</Descriptions.Item>
          <Descriptions.Item label="Postal Code">
            {(property as any).postalCode || 'N/A'}
          </Descriptions.Item>
          <Descriptions.Item label="Owner">
            {(property as any)?.owner
              ? `${(property as any).owner.firstName} ${(property as any).owner.lastName}`
              : 'N/A'}
          </Descriptions.Item>
          <Descriptions.Item label="Status">
            <Tag color={property.status === 'active' ? 'green' : 'red'}>
              {property.status?.toUpperCase()}
            </Tag>
          </Descriptions.Item>
          {(property as any).description && (
            <Descriptions.Item label="Description">{(property as any).description}</Descriptions.Item>
          )}
          <Descriptions.Item label="Created At">
            {dayjs(property.createdAt).format('MMMM DD, YYYY HH:mm')}
          </Descriptions.Item>
          <Descriptions.Item label="Updated At">
            {dayjs(property.updatedAt).format('MMMM DD, YYYY HH:mm')}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card style={{ marginTop: 24 }}>
        <Tabs defaultActiveKey="units">
          <TabPane tab="Units" key="units">
            <Table
              columns={unitColumns}
              dataSource={units}
              loading={unitsLoading}
              rowKey="id"
              pagination={{ pageSize: 10 }}
            />
          </TabPane>
          <TabPane tab="Bookings" key="bookings">
            <Table
              columns={bookingColumns}
              dataSource={bookings}
              loading={bookingsLoading}
              rowKey="id"
              pagination={{ pageSize: 10 }}
            />
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default PropertyDetailPage;
