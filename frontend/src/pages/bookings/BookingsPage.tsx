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
  Row,
  Col,
  Spin,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  CalendarOutlined,
  InboxOutlined,
  BellOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { bookingsApi, Booking } from '../../services/api/bookingsApi';
import { propertiesApi, Property } from '../../services/api/propertiesApi';
import { guestsApi, Guest } from '../../services/api/guestsApi';
import { archiveApi } from '../../services/api/archiveApi';
import FadeIn from '../../components/animations/FadeIn';
import { Calendar, dateFnsLocalizer, Views, View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import enUS from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { Card, Badge, List, Avatar, Alert } from 'antd';

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
  const [calendarView, setCalendarView] = useState<View>(Views.MONTH);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [reminders, setReminders] = useState<any>(null);
  const [remindersLoading, setRemindersLoading] = useState(false);

  useEffect(() => {
    loadBookings();
    loadCalendar();
    loadProperties();
    loadGuests();
    loadReminders();
  }, [searchText, statusFilter]);

  const loadReminders = async () => {
    try {
      setRemindersLoading(true);
      const response = await bookingsApi.getReminders(7);
      setReminders(response.data.data);
    } catch (error) {
      console.error('Failed to load reminders:', error);
    } finally {
      setRemindersLoading(false);
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

      <div>
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
            <div style={{ marginBottom: 16 }}>
              <Space>
                <Button
                  type={calendarView === Views.MONTH ? 'primary' : 'default'}
                  onClick={() => setCalendarView(Views.MONTH)}
                >
                  Month
                </Button>
                <Button
                  type={calendarView === Views.WEEK ? 'primary' : 'default'}
                  onClick={() => setCalendarView(Views.WEEK)}
                >
                  Week
                </Button>
                <Button
                  type={calendarView === Views.DAY ? 'primary' : 'default'}
                  onClick={() => setCalendarView(Views.DAY)}
                >
                  Day
                </Button>
                <Button onClick={() => setCurrentDate(new Date())}>Today</Button>
              </Space>
            </div>
            <div style={{ height: 600 }}>
              <Calendar
                localizer={localizer}
                events={calendarEvents}
                startAccessor="start"
                endAccessor="end"
                style={{ height: '100%' }}
                view={calendarView}
                onView={setCalendarView}
                date={currentDate}
                onNavigate={setCurrentDate}
                onSelectEvent={(event) => navigate(`/bookings/${event.resource.bookingId}`)}
                eventPropGetter={(event) => {
                  const status = event.resource?.paymentStatus;
                  const colorMap: Record<string, { backgroundColor: string; borderColor: string }> =
                    {
                      paid: { backgroundColor: '#52c41a', borderColor: '#389e0d' },
                      pending: { backgroundColor: '#faad14', borderColor: '#d48806' },
                      partial: { backgroundColor: '#1890ff', borderColor: '#096dd9' },
                      refunded: { backgroundColor: '#ff4d4f', borderColor: '#cf1322' },
                    };
                  const colors = colorMap[status] || {
                    backgroundColor: '#722ed1',
                    borderColor: '#531dab',
                  };
                  return {
                    style: {
                      backgroundColor: colors.backgroundColor,
                      borderColor: colors.borderColor,
                      borderWidth: '1px',
                      borderStyle: 'solid',
                    },
                  };
                }}
              />
            </div>
          </Tabs.TabPane>
          <Tabs.TabPane
            tab={
              <span>
                <BellOutlined />
                Reminders
                {reminders &&
                  reminders.summary.checkinsToday + reminders.summary.checkoutsToday > 0 && (
                    <Badge
                      count={reminders.summary.checkinsToday + reminders.summary.checkoutsToday}
                      style={{ marginLeft: 8 }}
                    />
                  )}
              </span>
            }
            key="reminders"
          >
            {remindersLoading ? (
              <div style={{ textAlign: 'center', padding: 40 }}>
                <Spin size="large" />
              </div>
            ) : (
              <div>
                {reminders && (
                  <>
                    {(reminders.summary.checkinsToday > 0 ||
                      reminders.summary.checkoutsToday > 0) && (
                      <Alert
                        message="Urgent Reminders"
                        description={`${reminders.summary.checkinsToday} check-in(s) and ${reminders.summary.checkoutsToday} check-out(s) today!`}
                        type="warning"
                        showIcon
                        style={{ marginBottom: 16 }}
                      />
                    )}
                    <Row gutter={[16, 16]}>
                      <Col xs={24} lg={12}>
                        <Card
                          title={
                            <span>
                              <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                              Upcoming Check-ins ({reminders.checkinReminders.length})
                            </span>
                          }
                          extra={
                            <Badge
                              count={reminders.summary.checkinsToday}
                              style={{ backgroundColor: '#52c41a' }}
                            />
                          }
                        >
                          <List
                            dataSource={reminders.checkinReminders}
                            renderItem={(reminder: any) => (
                              <List.Item
                                style={{
                                  backgroundColor:
                                    reminder.isToday || reminder.isTomorrow
                                      ? reminder.isToday
                                        ? '#fff1f0'
                                        : '#fffbe6'
                                      : 'transparent',
                                  padding: '12px',
                                  marginBottom: 8,
                                  borderRadius: 4,
                                  cursor: 'pointer',
                                }}
                                onClick={() => navigate(`/bookings/${reminder.bookingId}`)}
                              >
                                <List.Item.Meta
                                  avatar={
                                    <Avatar
                                      style={{
                                        backgroundColor: reminder.isToday
                                          ? '#ff4d4f'
                                          : reminder.isTomorrow
                                            ? '#faad14'
                                            : '#1890ff',
                                      }}
                                    >
                                      {reminder.daysUntil}
                                    </Avatar>
                                  }
                                  title={
                                    <div>
                                      <strong>{reminder.property.name}</strong>
                                      {reminder.unit && ` - ${reminder.unit.unitCode}`}
                                      {reminder.isToday && (
                                        <Tag color="red" style={{ marginLeft: 8 }}>
                                          TODAY
                                        </Tag>
                                      )}
                                      {reminder.isTomorrow && (
                                        <Tag color="orange" style={{ marginLeft: 8 }}>
                                          TOMORROW
                                        </Tag>
                                      )}
                                    </div>
                                  }
                                  description={
                                    <div>
                                      <div>
                                        Guest: {reminder.guest.firstName} {reminder.guest.lastName}
                                      </div>
                                      <div>
                                        Check-in:{' '}
                                        {dayjs(reminder.date).format('MMM DD, YYYY HH:mm')}
                                      </div>
                                      <div>
                                        {reminder.daysUntil === 0
                                          ? 'Today'
                                          : reminder.daysUntil === 1
                                            ? 'Tomorrow'
                                            : `In ${reminder.daysUntil} days`}
                                      </div>
                                    </div>
                                  }
                                />
                              </List.Item>
                            )}
                          />
                        </Card>
                      </Col>
                      <Col xs={24} lg={12}>
                        <Card
                          title={
                            <span>
                              <ClockCircleOutlined style={{ color: '#1890ff', marginRight: 8 }} />
                              Upcoming Check-outs ({reminders.checkoutReminders.length})
                            </span>
                          }
                          extra={
                            <Badge
                              count={reminders.summary.checkoutsToday}
                              style={{ backgroundColor: '#1890ff' }}
                            />
                          }
                        >
                          <List
                            dataSource={reminders.checkoutReminders}
                            renderItem={(reminder: any) => (
                              <List.Item
                                style={{
                                  backgroundColor:
                                    reminder.isToday || reminder.isTomorrow
                                      ? reminder.isToday
                                        ? '#fff1f0'
                                        : '#fffbe6'
                                      : 'transparent',
                                  padding: '12px',
                                  marginBottom: 8,
                                  borderRadius: 4,
                                  cursor: 'pointer',
                                }}
                                onClick={() => navigate(`/bookings/${reminder.bookingId}`)}
                              >
                                <List.Item.Meta
                                  avatar={
                                    <Avatar
                                      style={{
                                        backgroundColor: reminder.isToday
                                          ? '#ff4d4f'
                                          : reminder.isTomorrow
                                            ? '#faad14'
                                            : '#1890ff',
                                      }}
                                    >
                                      {reminder.daysUntil}
                                    </Avatar>
                                  }
                                  title={
                                    <div>
                                      <strong>{reminder.property.name}</strong>
                                      {reminder.unit && ` - ${reminder.unit.unitCode}`}
                                      {reminder.isToday && (
                                        <Tag color="red" style={{ marginLeft: 8 }}>
                                          TODAY
                                        </Tag>
                                      )}
                                      {reminder.isTomorrow && (
                                        <Tag color="orange" style={{ marginLeft: 8 }}>
                                          TOMORROW
                                        </Tag>
                                      )}
                                    </div>
                                  }
                                  description={
                                    <div>
                                      <div>
                                        Guest: {reminder.guest.firstName} {reminder.guest.lastName}
                                      </div>
                                      <div>
                                        Check-out:{' '}
                                        {dayjs(reminder.date).format('MMM DD, YYYY HH:mm')}
                                      </div>
                                      <div>
                                        {reminder.daysUntil === 0
                                          ? 'Today'
                                          : reminder.daysUntil === 1
                                            ? 'Tomorrow'
                                            : `In ${reminder.daysUntil} days`}
                                      </div>
                                    </div>
                                  }
                                />
                              </List.Item>
                            )}
                          />
                        </Card>
                      </Col>
                    </Row>
                  </>
                )}
              </div>
            )}
          </Tabs.TabPane>
        </Tabs>
      </div>

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
              notFoundContent={properties.length === 0 ? 'No properties available' : undefined}
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
              notFoundContent={guests.length === 0 ? 'No guests available' : undefined}
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
