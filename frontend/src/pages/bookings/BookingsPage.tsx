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
  Popconfirm,
  Tabs,
  Checkbox,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  CalendarOutlined,
  InboxOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { bookingsApi, Booking } from '../../services/api/bookingsApi';
import { propertiesApi, Property } from '../../services/api/propertiesApi';
import { guestsApi, Guest } from '../../services/api/guestsApi';
import { archiveApi } from '../../services/api/archiveApi';
import FadeIn from '../../components/animations/FadeIn';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import enUS from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { Title } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;
const locales = {
  'en-US': enUS,
};
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const BookingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState('table');

  useEffect(() => {
    loadBookings();
    loadCalendar();
    loadProperties();
    loadGuests();
  }, [searchText, statusFilter]);

  const loadProperties = async () => {
    try {
      const response = await propertiesApi.getAll({ status: 'active' });
      setProperties(response.data.data.properties);
    } catch (error) {
      console.error('Failed to load properties:', error);
    }
  };

  const loadGuests = async () => {
    try {
      const response = await guestsApi.getAll();
      setGuests(response.data.data.guests);
    } catch (error) {
      console.error('Failed to load guests:', error);
    }
  };

  const loadBookings = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (searchText) params.search = searchText;
      if (statusFilter) params.status = statusFilter;

      const response = await bookingsApi.getAll(params);
      setBookings(response.data.data.bookings);
    } catch (error) {
      message.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const loadCalendar = async () => {
    try {
      const start = dayjs().startOf('month').toISOString();
      const end = dayjs().endOf('month').toISOString();
      const response = await bookingsApi.getCalendar({ start, end });
      setCalendarEvents(response.data.data.events);
    } catch (error) {
      console.error('Failed to load calendar:', error);
    }
  };

  const handleCreate = () => {
    setEditingBooking(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (booking: Booking) => {
    setEditingBooking(booking);
    form.setFieldsValue({
      ...booking,
      checkinDate: dayjs(booking.checkinDate),
      checkoutDate: dayjs(booking.checkoutDate),
    });
    setIsModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await bookingsApi.delete(id);
      message.success('Booking deleted successfully');
      loadBookings();
      loadCalendar();
    } catch (error) {
      message.error('Failed to delete booking');
    }
  };

  const handleArchive = async (id: string) => {
    try {
      await archiveApi.archiveBooking(id);
      message.success('Booking archived successfully');
      loadBookings();
      loadCalendar();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to archive booking');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      const submitData = {
        ...values,
        checkinDate: values.checkinDate.toISOString(),
        checkoutDate: values.checkoutDate.toISOString(),
      };

      if (editingBooking) {
        await bookingsApi.update(editingBooking.id, submitData);
        message.success('Booking updated successfully');
      } else {
        await bookingsApi.create(submitData);
        message.success('Booking created successfully');
      }
      setIsModalVisible(false);
      loadBookings();
      loadCalendar();
    } catch (error: any) {
      message.error(error.response?.data?.error?.message || 'Operation failed');
    }
  };

  const columns: ColumnsType<Booking> = [
    {
      title: 'Reference',
      dataIndex: 'reference',
      key: 'reference',
    },
    {
      title: 'Guest',
      key: 'guest',
      render: (_, record: any) =>
        record.guest ? `${record.guest.firstName} ${record.guest.lastName}` : 'N/A',
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
      title: 'Amount',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amount: number, record: Booking) =>
        `${amount.toFixed(2)} ${record.currency || 'AED'}`,
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
        return <Tag color={colors[status] || 'default'}>{status.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => {
        const isOldEnough = dayjs().diff(dayjs(record.checkoutDate), 'days') >= 90;
        const isArchived = record.notes?.includes('[ARCHIVED]');

        return (
          <Space>
            <Button type="link" onClick={() => navigate(`/bookings/${record.id}`)}>
              View
            </Button>
            {!isArchived && (
              <>
                <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
                  Edit
                </Button>
                {isOldEnough && (
                  <Popconfirm
                    title="Archive this booking?"
                    description="Bookings older than 90 days can be archived. You can restore them later."
                    onConfirm={() => handleArchive(record.id)}
                    okText="Archive"
                    cancelText="Cancel"
                  >
                    <Button type="link" icon={<InboxOutlined />}>
                      Archive
                    </Button>
                  </Popconfirm>
                )}
                <Popconfirm
                  title="Are you sure you want to delete this booking?"
                  onConfirm={() => handleDelete(record.id)}
                  okText="Yes"
                  cancelText="No"
                >
                  <Button type="link" danger icon={<DeleteOutlined />}>
                    Delete
                  </Button>
                </Popconfirm>
              </>
            )}
            {isArchived && <Tag color="default">Archived</Tag>}
          </Space>
        );
      },
    },
  ];

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
            Bookings
          </Title>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            Add Booking
          </Button>
        </div>

        <Space style={{ marginBottom: 16 }}>
          <Input
            placeholder="Search bookings..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 300 }}
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
      </FadeIn>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <Tabs.TabPane tab="Table View" key="table">
            <Table
              columns={columns}
              dataSource={bookings}
              loading={loading}
              rowKey="id"
              pagination={{ pageSize: 10 }}
            />
          </Tabs.TabPane>
          <Tabs.TabPane tab="Calendar View" key="calendar">
            <div style={{ height: 600 }}>
              <Calendar
                localizer={localizer}
                events={calendarEvents}
                startAccessor="start"
                endAccessor="end"
                style={{ height: '100%' }}
                onSelectEvent={(event) => navigate(`/bookings/${event.resource.bookingId}`)}
              />
            </div>
          </Tabs.TabPane>
        </Tabs>
      </motion.div>

      <Modal
        title={editingBooking ? 'Edit Booking' : 'Create Booking'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onOk={() => form.submit()}
        width={700}
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
              filterOption={(input, option) =>
                String(option?.label ?? '')
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
              options={properties.map((p) => ({
                value: p.id,
                label: `${p.name} (${p.code})`,
              }))}
            />
          </Form.Item>
          <Form.Item
            name="guestId"
            label="Guest"
            rules={[{ required: true, message: 'Please select a guest' }]}
          >
            <Select
              placeholder="Select a guest"
              showSearch
              filterOption={(input, option) =>
                String(option?.label ?? '')
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
              options={guests.map((g) => ({
                value: g.id,
                label: `${g.firstName} ${g.lastName}${g.email ? ` (${g.email})` : ''}`,
              }))}
            />
          </Form.Item>
          <Form.Item name="channel" label="Channel" rules={[{ required: true }]}>
            <Select>
              <Option value="direct">Direct</Option>
              <Option value="airbnb">Airbnb</Option>
              <Option value="booking_com">Booking.com</Option>
              <Option value="other">Other</Option>
            </Select>
          </Form.Item>
          <Form.Item name="checkinDate" label="Check-in Date" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="checkoutDate" label="Check-out Date" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="totalAmount" label="Total Amount" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} min={0} step={0.01} />
          </Form.Item>
          <Form.Item name="currency" label="Currency" initialValue="AED">
            <Input />
          </Form.Item>
          <Form.Item name="paymentStatus" label="Payment Status" initialValue="pending">
            <Select>
              <Option value="paid">Paid</Option>
              <Option value="pending">Pending</Option>
              <Option value="partial">Partial</Option>
            </Select>
          </Form.Item>
          <Form.Item name="depositAmount" label="Deposit Amount">
            <InputNumber style={{ width: '100%' }} min={0} step={0.01} />
          </Form.Item>
          <Form.Item name="autoCreateCleaningTask" valuePropName="checked" initialValue={true}>
            <Checkbox>Auto-create cleaning task</Checkbox>
          </Form.Item>
          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={3} placeholder="Additional notes..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default BookingsPage;
