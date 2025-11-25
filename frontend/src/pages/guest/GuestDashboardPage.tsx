import React, { useEffect, useState } from 'react';
import {
  Row,
  Col,
  Card,
  Statistic,
  Typography,
  Table,
  Tag,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  message,
  Tabs,
  Descriptions,
  Empty,
  Spin,
} from 'antd';
import {
  DollarOutlined,
  CalendarOutlined,
  HomeOutlined,
  PlusOutlined,
  EditOutlined,
  EyeOutlined,
  UserOutlined,
  HistoryOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import { useAppSelector } from '../../store/hooks';
import { bookingsApi, Booking } from '../../services/api/bookingsApi';
import { propertiesApi, Property } from '../../services/api/propertiesApi';
import { guestsApi, Guest } from '../../services/api/guestsApi';
import { authApi } from '../../services/api/authApi';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import GlassCard from '../../components/animations/GlassCard';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const GuestDashboardPage: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [guestData, setGuestData] = useState<Guest | null>(null);
  const [isBookingModalVisible, setIsBookingModalVisible] = useState(false);
  const [isProfileModalVisible, setIsProfileModalVisible] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [profileForm] = Form.useForm();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([loadBookings(), loadProperties(), loadGuestData()]);
    } catch (error) {
      message.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadBookings = async () => {
    try {
      if (user?.email) {
        const response = await bookingsApi.getAll({ guestEmail: user.email });
        setBookings(response.data.data.bookings || []);
      }
    } catch (error) {
      console.error('Failed to load bookings:', error);
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

  const loadGuestData = async () => {
    try {
      const response = await authApi.getMe();
      if (response.data.data.guest) {
        setGuestData(response.data.data.guest);
      }
    } catch (error) {
      console.error('Failed to load guest data:', error);
    }
  };

  const handleCreateBooking = async (values: any) => {
    try {
      if (!user?.guestId) {
        message.error('Guest profile not found');
        return;
      }

      const [checkinDate, checkoutDate] = values.dates;
      const nights = checkoutDate.diff(checkinDate, 'day');

      await bookingsApi.create({
        propertyId: values.propertyId,
        guestId: user.guestId,
        channel: values.channel || 'direct',
        checkinDate: checkinDate.toISOString(),
        checkoutDate: checkoutDate.toISOString(),
        totalAmount: values.totalAmount,
        currency: 'AED',
        paymentStatus: 'pending',
        notes: values.notes,
      });

      message.success('Booking created successfully');
      setIsBookingModalVisible(false);
      form.resetFields();
      loadBookings();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to create booking');
    }
  };

  const handleUpdateProfile = async (values: any) => {
    try {
      if (!user?.guestId) {
        message.error('Guest profile not found');
        return;
      }

      await guestsApi.update(user.guestId, values);
      message.success('Profile updated successfully');
      setIsProfileModalVisible(false);
      loadGuestData();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to update profile');
    }
  };

  const getTotalSpend = () => {
    return bookings.reduce((sum, booking) => {
      const amount =
        typeof booking.totalAmount === 'number'
          ? booking.totalAmount
          : parseFloat(booking.totalAmount) || 0;
      return sum + amount;
    }, 0);
  };

  const getUpcomingBookings = () => {
    const now = dayjs();
    return bookings.filter((booking) => dayjs(booking.checkinDate).isAfter(now));
  };

  const getPastBookings = () => {
    const now = dayjs();
    return bookings.filter((booking) => dayjs(booking.checkoutDate).isBefore(now));
  };

  const columns: ColumnsType<Booking> = [
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
      render: (date: string) => (date ? dayjs(date).format('MMM DD, YYYY') : 'N/A'),
    },
    {
      title: 'Check-out',
      dataIndex: 'checkoutDate',
      key: 'checkoutDate',
      render: (date: string) => (date ? dayjs(date).format('MMM DD, YYYY') : 'N/A'),
    },
    {
      title: 'Nights',
      dataIndex: 'nights',
      key: 'nights',
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
        const colorMap: Record<string, string> = {
          paid: 'green',
          pending: 'orange',
          partial: 'blue',
          refunded: 'red',
        };
        return <Tag color={colorMap[status] || 'default'}>{status?.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => {
            setSelectedBooking(record);
            setIsViewModalVisible(true);
          }}
        >
          View
        </Button>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  const upcomingBookings = getUpcomingBookings();
  const pastBookings = getPastBookings();
  const totalSpend = getTotalSpend();

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <Title level={2}>Welcome back, {user?.firstName}!</Title>
        <Text type="secondary">Manage your bookings and profile</Text>
      </div>

      {/* Statistics */}
      <Row gutter={[20, 20]} style={{ marginBottom: 32 }}>
        <Col xs={24} sm={12} md={6}>
          <GlassCard>
            <Statistic
              title="Total Bookings"
              value={bookings.length}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </GlassCard>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <GlassCard>
            <Statistic
              title="Upcoming"
              value={upcomingBookings.length}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </GlassCard>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <GlassCard>
            <Statistic
              title="Total Spent"
              value={totalSpend}
              prefix={<DollarOutlined />}
              suffix="AED"
              precision={2}
              valueStyle={{ color: '#722ed1' }}
            />
          </GlassCard>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <GlassCard>
            <Statistic
              title="Past Stays"
              value={pastBookings.length}
              prefix={<HistoryOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </GlassCard>
        </Col>
      </Row>

      {/* Actions */}
      <Row gutter={[20, 20]} style={{ marginBottom: 32 }}>
        <Col span={24}>
          <Card>
            <Space>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                size="large"
                onClick={() => setIsBookingModalVisible(true)}
              >
                Create New Booking
              </Button>
              <Button
                icon={<UserOutlined />}
                size="large"
                onClick={() => {
                  if (guestData) {
                    profileForm.setFieldsValue({
                      firstName: guestData.firstName,
                      lastName: guestData.lastName,
                      email: guestData.email,
                      phone: guestData.phone,
                      nationality: guestData.nationality,
                    });
                  }
                  setIsProfileModalVisible(true);
                }}
              >
                Update Profile
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Bookings Table */}
      <Card title="My Bookings" style={{ marginBottom: 32 }}>
        <Tabs
          defaultActiveKey="all"
          items={[
            {
              key: 'all',
              label: `All (${bookings.length})`,
              children: (
                <Table
                  columns={columns}
                  dataSource={bookings}
                  rowKey="id"
                  pagination={{ pageSize: 10 }}
                />
              ),
            },
            {
              key: 'upcoming',
              label: `Upcoming (${upcomingBookings.length})`,
              children: (
                <Table
                  columns={columns}
                  dataSource={upcomingBookings}
                  rowKey="id"
                  pagination={{ pageSize: 10 }}
                />
              ),
            },
            {
              key: 'past',
              label: `Past (${pastBookings.length})`,
              children: (
                <Table
                  columns={columns}
                  dataSource={pastBookings}
                  rowKey="id"
                  pagination={{ pageSize: 10 }}
                />
              ),
            },
          ]}
        />
      </Card>

      {/* Create Booking Modal */}
      <Modal
        title="Create New Booking"
        open={isBookingModalVisible}
        onCancel={() => {
          setIsBookingModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleCreateBooking}>
          <Form.Item
            name="propertyId"
            label="Property"
            rules={[{ required: true, message: 'Please select a property' }]}
          >
            <Select
              placeholder="Select a property"
              showSearch
              getPopupContainer={() => document.body}
              notFoundContent={properties.length === 0 ? 'No properties available' : undefined}
            >
              {properties.map((p) => (
                <Option key={p.id} value={p.id}>
                  {p.name} ({p.code})
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="channel"
            label="Booking Channel"
            initialValue="direct"
            rules={[{ required: true }]}
          >
            <Select getPopupContainer={() => document.body}>
              <Option value="direct">Direct</Option>
              <Option value="airbnb">Airbnb</Option>
              <Option value="booking_com">Booking.com</Option>
              <Option value="other">Other</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="dates"
            label="Check-in / Check-out"
            rules={[{ required: true, message: 'Please select dates' }]}
          >
            <RangePicker style={{ width: '100%' }} getPopupContainer={() => document.body} />
          </Form.Item>
          <Form.Item
            name="totalAmount"
            label="Total Amount (AED)"
            rules={[{ required: true, message: 'Please enter total amount' }]}
          >
            <InputNumber style={{ width: '100%' }} min={0} step={0.01} />
          </Form.Item>
          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={3} placeholder="Additional notes..." />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Create Booking
              </Button>
              <Button
                onClick={() => {
                  setIsBookingModalVisible(false);
                  form.resetFields();
                }}
              >
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* View Booking Modal */}
      <Modal
        title="Booking Details"
        open={isViewModalVisible}
        onCancel={() => setIsViewModalVisible(false)}
        footer={null}
        width={600}
      >
        {selectedBooking && (
          <Descriptions column={1} bordered>
            <Descriptions.Item label="Reference">{selectedBooking.reference}</Descriptions.Item>
            <Descriptions.Item label="Property">
              {(selectedBooking as any)?.property?.name || 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Check-in">
              {dayjs(selectedBooking.checkinDate).format('MMMM DD, YYYY')}
            </Descriptions.Item>
            <Descriptions.Item label="Check-out">
              {dayjs(selectedBooking.checkoutDate).format('MMMM DD, YYYY')}
            </Descriptions.Item>
            <Descriptions.Item label="Nights">{selectedBooking.nights}</Descriptions.Item>
            <Descriptions.Item label="Total Amount">
              AED{' '}
              {(typeof selectedBooking.totalAmount === 'number'
                ? selectedBooking.totalAmount
                : parseFloat(selectedBooking.totalAmount) || 0
              ).toFixed(2)}
            </Descriptions.Item>
            <Descriptions.Item label="Payment Status">
              <Tag
                color={
                  selectedBooking.paymentStatus === 'paid'
                    ? 'green'
                    : selectedBooking.paymentStatus === 'pending'
                      ? 'orange'
                      : 'blue'
                }
              >
                {selectedBooking.paymentStatus?.toUpperCase()}
              </Tag>
            </Descriptions.Item>
            {selectedBooking.notes && (
              <Descriptions.Item label="Notes">{selectedBooking.notes}</Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>

      {/* Update Profile Modal */}
      <Modal
        title="Update Profile"
        open={isProfileModalVisible}
        onCancel={() => {
          setIsProfileModalVisible(false);
          profileForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form form={profileForm} layout="vertical" onFinish={handleUpdateProfile}>
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
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Update Profile
              </Button>
              <Button
                onClick={() => {
                  setIsProfileModalVisible(false);
                  profileForm.resetFields();
                }}
              >
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default GuestDashboardPage;
