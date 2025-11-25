import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Tag, Button, Space, Typography, Spin, message, Divider } from 'antd';
import { ArrowLeftOutlined, EditOutlined } from '@ant-design/icons';
import { bookingsApi, Booking } from '../../services/api/bookingsApi';
import dayjs from 'dayjs';

const { Title } = Typography;

const BookingDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadBooking();
    }
  }, [id]);

  const loadBooking = async () => {
    try {
      setLoading(true);
      const response = await bookingsApi.getById(id!);
      setBooking(response.data.data.booking);
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to load booking');
      navigate('/bookings');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/bookings')}>
          Back to Bookings
        </Button>
        <Card style={{ marginTop: 16 }}>
          <p>Booking not found</p>
        </Card>
      </div>
    );
  }

  const paymentStatusColors: Record<string, string> = {
    paid: 'green',
    pending: 'orange',
    partial: 'blue',
    refunded: 'red',
  };

  return (
    <div>
      <Space style={{ marginBottom: 24 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/bookings')}>
          Back to Bookings
        </Button>
        <Button
          type="primary"
          icon={<EditOutlined />}
          onClick={() => navigate(`/bookings?edit=${id}`)}
        >
          Edit Booking
        </Button>
      </Space>

      <Card>
        <Title level={2}>Booking Details</Title>
        <Divider />
        <Descriptions column={1} bordered>
          <Descriptions.Item label="Reference">
            <strong>{booking.reference}</strong>
          </Descriptions.Item>
          <Descriptions.Item label="Property">
            {(booking as any)?.property?.name || 'N/A'}
          </Descriptions.Item>
          <Descriptions.Item label="Unit">
            {(booking as any)?.unit?.unitCode || 'N/A'}
          </Descriptions.Item>
          <Descriptions.Item label="Guest">
            {(booking as any)?.guest
              ? `${(booking as any).guest.firstName} ${(booking as any).guest.lastName}`
              : 'N/A'}
          </Descriptions.Item>
          <Descriptions.Item label="Check-in Date">
            {dayjs(booking.checkinDate).format('MMMM DD, YYYY')}
          </Descriptions.Item>
          <Descriptions.Item label="Check-out Date">
            {dayjs(booking.checkoutDate).format('MMMM DD, YYYY')}
          </Descriptions.Item>
          <Descriptions.Item label="Nights">{booking.nights}</Descriptions.Item>
          <Descriptions.Item label="Total Amount">
            <strong>
              {booking.currency || 'AED'}{' '}
              {(typeof booking.totalAmount === 'number'
                ? booking.totalAmount
                : parseFloat(booking.totalAmount) || 0
              ).toFixed(2)}
            </strong>
          </Descriptions.Item>
          <Descriptions.Item label="Payment Status">
            <Tag color={paymentStatusColors[booking.paymentStatus] || 'default'}>
              {booking.paymentStatus?.toUpperCase()}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Channel">{booking.channel || 'N/A'}</Descriptions.Item>
          {booking.notes && <Descriptions.Item label="Notes">{booking.notes}</Descriptions.Item>}
          <Descriptions.Item label="Created At">
            {dayjs(booking.createdAt).format('MMMM DD, YYYY HH:mm')}
          </Descriptions.Item>
          <Descriptions.Item label="Updated At">
            {dayjs(booking.updatedAt).format('MMMM DD, YYYY HH:mm')}
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  );
};

export default BookingDetailPage;
