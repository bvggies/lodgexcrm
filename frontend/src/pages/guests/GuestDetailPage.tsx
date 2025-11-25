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
import { guestsApi, Guest } from '../../services/api/guestsApi';
import { bookingsApi } from '../../services/api/bookingsApi';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';

const { Title } = Typography;
const { TabPane } = Tabs;

const GuestDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [guest, setGuest] = useState<Guest | null>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingsLoading, setBookingsLoading] = useState(false);

  useEffect(() => {
    if (id) {
      loadGuest();
      loadBookings();
    }
  }, [id]);

  const loadGuest = async () => {
    try {
      setLoading(true);
      const response = await guestsApi.getById(id!);
      setGuest(response.data.data.guest);
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to load guest');
      navigate('/guests');
    } finally {
      setLoading(false);
    }
  };

  const loadBookings = async () => {
    try {
      setBookingsLoading(true);
      const response = await bookingsApi.getAll({ guestId: id });
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

  if (!guest) {
    return (
      <div>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/guests')}>
          Back to Guests
        </Button>
        <Card style={{ marginTop: 16 }}>
          <p>Guest not found</p>
        </Card>
      </div>
    );
  }

  const bookingColumns: ColumnsType<any> = [
    {
      title: 'Reference',
      dataIndex: 'reference',
      key: 'reference',
    },
    {
      title: 'Property',
      key: 'property',
      render: (_, record: any) => record?.property?.name || 'N/A',
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
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/guests')}>
          Back to Guests
        </Button>
        <Button
          type="primary"
          icon={<EditOutlined />}
          onClick={() => navigate(`/guests?edit=${id}`)}
        >
          Edit Guest
        </Button>
      </Space>

      <Card>
        <Title level={2}>Guest Details</Title>
        <Divider />
        <Descriptions column={1} bordered>
          <Descriptions.Item label="Name">
            <strong>
              {guest.firstName} {guest.lastName}
            </strong>
          </Descriptions.Item>
          <Descriptions.Item label="Email">{guest.email || 'N/A'}</Descriptions.Item>
          <Descriptions.Item label="Phone">{guest.phone || 'N/A'}</Descriptions.Item>
          <Descriptions.Item label="Nationality">{guest.nationality || 'N/A'}</Descriptions.Item>
          <Descriptions.Item label="ID Type">{(guest as any).idType || 'N/A'}</Descriptions.Item>
          <Descriptions.Item label="ID Number">
            {(guest as any).idNumber || 'N/A'}
          </Descriptions.Item>
          <Descriptions.Item label="Date of Birth">
            {(guest as any).dateOfBirth
              ? dayjs((guest as any).dateOfBirth).format('MMMM DD, YYYY')
              : 'N/A'}
          </Descriptions.Item>
          <Descriptions.Item label="Address">{guest.address || 'N/A'}</Descriptions.Item>
          <Descriptions.Item label="City">{guest.city || 'N/A'}</Descriptions.Item>
          <Descriptions.Item label="Country">{guest.country || 'N/A'}</Descriptions.Item>
          <Descriptions.Item label="Postal Code">{guest.postalCode || 'N/A'}</Descriptions.Item>
          <Descriptions.Item label="Total Spend">
            <strong>
              AED{' '}
              {(typeof guest.totalSpend === 'number'
                ? guest.totalSpend
                : parseFloat(guest.totalSpend) || 0
              ).toFixed(2)}
            </strong>
          </Descriptions.Item>
          <Descriptions.Item label="Blacklist">
            <Tag color={guest.blacklist ? 'red' : 'green'}>{guest.blacklist ? 'Yes' : 'No'}</Tag>
          </Descriptions.Item>
          {guest.notes && <Descriptions.Item label="Notes">{guest.notes}</Descriptions.Item>}
          <Descriptions.Item label="Created At">
            {dayjs(guest.createdAt).format('MMMM DD, YYYY HH:mm')}
          </Descriptions.Item>
          <Descriptions.Item label="Updated At">
            {dayjs(guest.updatedAt).format('MMMM DD, YYYY HH:mm')}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card style={{ marginTop: 24 }}>
        <Tabs defaultActiveKey="bookings">
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

export default GuestDetailPage;
