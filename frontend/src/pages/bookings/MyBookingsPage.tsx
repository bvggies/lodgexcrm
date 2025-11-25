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
  DatePicker,
  InputNumber,
  message,
  Card,
  Descriptions,
  Empty,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  SearchOutlined,
  CalendarOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { bookingsApi, Booking } from '../../services/api/bookingsApi';
import { propertiesApi, Property } from '../../services/api/propertiesApi';
import { guestsApi, Guest } from '../../services/api/guestsApi';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { useAppSelector } from '../../store/hooks';

const { Title } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const MyBookingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [form] = Form.useForm();

  useEffect(() => {
    loadBookings();
    loadProperties();
    loadGuests();
  }, [searchText, statusFilter]);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (searchText) params.search = searchText;
      if (statusFilter) params.status = statusFilter;

      // Filter by current user's email if they're a guest
      if (user?.email) {
        params.guestEmail = user.email;
      }

      const response = await bookingsApi.getAll(params);
      setBookings(response.data.data.bookings || []);
    } catch (error) {
      message.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const loadProperties = async () => {
    try {
      const response = await propertiesApi.getAll({ status: 'active' });
      setProperties(response.data.data.properties);
    } catch (error) {
      console.error('Failed to load properties');
    }
  };

  const loadGuests = async () => {
    try {
      const response = await guestsApi.getAll();
      setGuests(response.data.data.guests);
    } catch (error) {
      console.error('Failed to load guests');
    }
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
      render: (_, record: any) => record.property?.name || 'N/A',
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
      title: 'Nights',
      dataIndex: 'nights',
      key: 'nights',
    },
    {
      title: 'Total Amount',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amount: any, record: Booking) => {
        const numAmount = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
        return `${numAmount.toFixed(2)} ${record.currency || 'AED'}`;
      },
    },
    {
      title: 'Status',
      dataIndex: 'paymentStatus',
      key: 'paymentStatus',
      render: (status: string) => {
        const colors: Record<string, string> = {
          paid: 'success',
          pending: 'warning',
          partial: 'processing',
          refunded: 'default',
        };
        return <Tag color={colors[status] || 'default'}>{status.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button type="link" icon={<EyeOutlined />} onClick={() => handleView(record)}>
            View
          </Button>
        </Space>
      ),
    },
  ];

  const handleCreate = () => {
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleView = (booking: Booking) => {
    setSelectedBooking(booking);
    setIsViewModalVisible(true);
  };

  const handleSubmit = async (values: any) => {
    try {
      // Find or create guest based on user email
      let guestId = values.guestId;
      if (!guestId && user?.email) {
        const existingGuest = guests.find((g) => g.email === user.email);
        if (existingGuest) {
          guestId = existingGuest.id;
        } else {
          // Create guest if doesn't exist
          const guestResponse = await guestsApi.create({
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
          });
          guestId = guestResponse.data.data.guest.id;
        }
      }

      const submitData = {
        ...values,
        guestId,
        checkinDate: values.dates[0].toISOString(),
        checkoutDate: values.dates[1].toISOString(),
        nights: values.dates[1].diff(values.dates[0], 'day'),
        currency: 'AED',
      };
      delete submitData.dates;

      await bookingsApi.create(submitData);
      message.success('Booking created successfully');
      setIsModalVisible(false);
      loadBookings();
    } catch (error: any) {
      message.error(error.response?.data?.error?.message || 'Failed to create booking');
    }
  };

  const upcomingBookings = bookings.filter(
    (b) => dayjs(b.checkinDate).isAfter(dayjs()) || dayjs(b.checkinDate).isSame(dayjs(), 'day')
  );
  const pastBookings = bookings.filter((b) => dayjs(b.checkinDate).isBefore(dayjs(), 'day'));

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
          My Bookings
        </Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          New Booking
        </Button>
      </div>

      <Space style={{ marginBottom: 16 }}>
        <Input
          placeholder="Search bookings..."
          prefix={<SearchOutlined />}
          style={{ width: 300 }}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          allowClear
        />
        <Select
          placeholder="Filter by status"
          style={{ width: 200 }}
          allowClear
          value={statusFilter}
          onChange={setStatusFilter}
        >
          <Option value="paid">Paid</Option>
          <Option value="pending">Pending</Option>
          <Option value="partial">Partial</Option>
          <Option value="refunded">Refunded</Option>
        </Select>
      </Space>

      <div>
        <Card title="Upcoming Bookings" style={{ marginBottom: 24 }}>
          {upcomingBookings.length > 0 ? (
            <Table
              columns={columns}
              dataSource={upcomingBookings}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 10 }}
            />
          ) : (
            <Empty description="No upcoming bookings" />
          )}
        </Card>

        <Card title="Past Bookings">
          {pastBookings.length > 0 ? (
            <Table
              columns={columns}
              dataSource={pastBookings}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 10 }}
            />
          ) : (
            <Empty description="No past bookings" />
          )}
        </Card>
      </div>

      <Modal
        title="Create New Booking"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="propertyId"
            label="Property"
            rules={[{ required: true, message: 'Please select a property' }]}
          >
            <Select
              placeholder="Select a property"
              showSearch
              getPopupContainer={() => document.body}
            >
              {properties.map((p) => (
                <Option key={p.id} value={p.id}>
                  {p.name} ({p.code})
                </Option>
              ))}
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
              <Button onClick={() => setIsModalVisible(false)}>Cancel</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Booking Details"
        open={isViewModalVisible}
        onCancel={() => setIsViewModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsViewModalVisible(false)}>
            Close
          </Button>,
        ]}
        width={600}
      >
        {selectedBooking && (
          <Descriptions column={1} bordered>
            <Descriptions.Item label="Reference">{selectedBooking.reference}</Descriptions.Item>
            <Descriptions.Item label="Property">
              {(selectedBooking as any).property?.name || 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Check-in">
              {dayjs(selectedBooking.checkinDate).format('MMM DD, YYYY')}
            </Descriptions.Item>
            <Descriptions.Item label="Check-out">
              {dayjs(selectedBooking.checkoutDate).format('MMM DD, YYYY')}
            </Descriptions.Item>
            <Descriptions.Item label="Nights">{selectedBooking.nights}</Descriptions.Item>
            <Descriptions.Item label="Total Amount">
              {(typeof selectedBooking.totalAmount === 'number'
                ? selectedBooking.totalAmount
                : parseFloat(selectedBooking.totalAmount) || 0
              ).toFixed(2)}{' '}
              {selectedBooking.currency || 'AED'}
            </Descriptions.Item>
            <Descriptions.Item label="Payment Status">
              <Tag color={selectedBooking.paymentStatus === 'paid' ? 'success' : 'warning'}>
                {selectedBooking.paymentStatus.toUpperCase()}
              </Tag>
            </Descriptions.Item>
            {selectedBooking.notes && (
              <Descriptions.Item label="Notes">{selectedBooking.notes}</Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default MyBookingsPage;
