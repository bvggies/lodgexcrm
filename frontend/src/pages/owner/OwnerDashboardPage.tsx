import React, { useEffect, useState } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Typography,
  Table,
  Tag,
  Space,
  Button,
  Select,
  DatePicker,
  message,
  Tabs,
  Progress,
  Modal,
  Form,
  Input,
  InputNumber,
  Popconfirm,
  Spin,
} from 'antd';
import {
  HomeOutlined,
  CalendarOutlined,
  DollarOutlined,
  UserOutlined,
  ReloadOutlined,
  DownloadOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../store/hooks';
import { ownersApi } from '../../services/api/ownersApi';
import { unitsApi, Unit } from '../../services/api/unitsApi';
import { bookingsApi, Booking, CreateBookingData } from '../../services/api/bookingsApi';
import { guestsApi, Guest } from '../../services/api/guestsApi';
import { financeApi } from '../../services/api/financeApi';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';

const { Title } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { TabPane } = Tabs;

interface OwnerData {
  owner: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
  };
  properties: any[];
  units: any[];
  bookings: any[];
  statistics: {
    totalProperties: number;
    totalUnits: number;
    totalBookings: number;
    pendingBookings: number;
    upcomingBookings: number;
    currentBookings: number;
    occupancyRate: number;
    monthlyRevenue: number;
  };
}

const OwnerDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const { mode: themeMode } = useAppSelector((state) => state.theme);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<OwnerData | null>(null);
  const [bookingFilter, setBookingFilter] = useState<'all' | 'pending' | 'upcoming' | 'current'>(
    'all'
  );

  // Unit management states
  const [isUnitModalVisible, setIsUnitModalVisible] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [unitForm] = Form.useForm();

  // Booking management states
  const [isBookingModalVisible, setIsBookingModalVisible] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [bookingForm] = Form.useForm();
  const [guests, setGuests] = useState<Guest[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | undefined>();
  const [availableUnits, setAvailableUnits] = useState<any[]>([]);

  // Finance report states
  const [financeRecords, setFinanceRecords] = useState<any[]>([]);
  const [financeLoading, setFinanceLoading] = useState(false);
  const [financeDateRange, setFinanceDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await ownersApi.getMyData();
      if (response.data.success && response.data.data) {
        setData(response.data.data);
      } else {
        message.error('Failed to load dashboard data: Invalid response');
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        error.message ||
        'Failed to load dashboard data';
      message.error(errorMessage);
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
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

  const loadAvailableUnits = async (propertyId: string) => {
    try {
      const response = await unitsApi.getAll({ propertyId });
      setAvailableUnits(response.data.data.units);
    } catch (error) {
      console.error('Failed to load units:', error);
      setAvailableUnits([]);
    }
  };

  const loadFinanceRecords = async () => {
    try {
      setFinanceLoading(true);
      const params: any = {};
      if (financeDateRange) {
        params.startDate = financeDateRange[0].toISOString();
        params.endDate = financeDateRange[1].toISOString();
      }
      const response = await financeApi.getAll(params);
      // Filter to only show records for owner's properties
      if (data) {
        const propertyIds = data.properties.map((p) => p.id);
        const filteredRecords = response.data.data.records.filter((r: any) =>
          propertyIds.includes(r.propertyId)
        );
        setFinanceRecords(filteredRecords);
      } else {
        setFinanceRecords(response.data.data.records);
      }
    } catch (error) {
      message.error('Failed to load finance records');
    } finally {
      setFinanceLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    loadGuests();
  }, []);

  useEffect(() => {
    if (data && financeDateRange) {
      loadFinanceRecords();
    }
  }, [financeDateRange, data]);

  const getFilteredBookings = () => {
    if (!data) return [];
    const now = new Date();
    switch (bookingFilter) {
      case 'pending':
        return data.bookings.filter(
          (b) => b.paymentStatus === 'pending' && new Date(b.checkinDate) > now
        );
      case 'upcoming':
        return data.bookings.filter(
          (b) =>
            new Date(b.checkinDate) > now &&
            new Date(b.checkinDate) <= new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
        );
      case 'current':
        return data.bookings.filter(
          (b) => new Date(b.checkinDate) <= now && new Date(b.checkoutDate) > now
        );
      default:
        return data.bookings;
    }
  };

  // Unit management handlers
  const handleCreateUnit = () => {
    setEditingUnit(null);
    unitForm.resetFields();
    setIsUnitModalVisible(true);
  };

  const handleEditUnit = (unit: Unit) => {
    setEditingUnit(unit);
    unitForm.setFieldsValue({
      ...unit,
      propertyId: unit.propertyId,
    });
    setIsUnitModalVisible(true);
  };

  const handleDeleteUnit = async (id: string) => {
    try {
      await unitsApi.delete(id);
      message.success('Unit deleted successfully');
      loadData();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to delete unit');
    }
  };

  const handleUnitSubmit = async (values: any) => {
    try {
      if (editingUnit) {
        await unitsApi.update(editingUnit.id, values);
        message.success('Unit updated successfully');
      } else {
        await unitsApi.create(values);
        message.success('Unit created successfully');
      }
      setIsUnitModalVisible(false);
      unitForm.resetFields();
      loadData();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Operation failed');
    }
  };

  // Booking management handlers
  const handleCreateBooking = () => {
    setEditingBooking(null);
    bookingForm.resetFields();
    setSelectedPropertyId(undefined);
    setAvailableUnits([]);
    setIsBookingModalVisible(true);
  };

  const handleEditBooking = (booking: Booking) => {
    setEditingBooking(booking);
    bookingForm.setFieldsValue({
      ...booking,
      propertyId: booking.propertyId,
      unitId: booking.unitId,
      guestId: booking.guestId,
      checkinDate: dayjs(booking.checkinDate),
      checkoutDate: dayjs(booking.checkoutDate),
    });
    setSelectedPropertyId(booking.propertyId);
    if (booking.propertyId) {
      loadAvailableUnits(booking.propertyId);
    }
    setIsBookingModalVisible(true);
  };

  const handleDeleteBooking = async (id: string) => {
    try {
      await bookingsApi.delete(id);
      message.success('Booking deleted successfully');
      loadData();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to delete booking');
    }
  };

  const handleBookingSubmit = async (values: any) => {
    try {
      const submitData: CreateBookingData = {
        ...values,
        propertyId: values.propertyId,
        unitId: values.unitId,
        guestId: values.guestId,
        checkinDate: values.checkinDate.toISOString(),
        checkoutDate: values.checkoutDate.toISOString(),
        totalAmount: values.totalAmount,
        currency: values.currency || 'AED',
        paymentStatus: values.paymentStatus || 'pending',
      };

      if (editingBooking) {
        await bookingsApi.update(editingBooking.id, submitData);
        message.success('Booking updated successfully');
      } else {
        await bookingsApi.create(submitData);
        message.success('Booking created successfully');
      }
      setIsBookingModalVisible(false);
      bookingForm.resetFields();
      setSelectedPropertyId(undefined);
      setAvailableUnits([]);
      loadData();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handlePropertyChange = (propertyId: string) => {
    setSelectedPropertyId(propertyId);
    bookingForm.setFieldsValue({ unitId: undefined });
    if (propertyId) {
      loadAvailableUnits(propertyId);
    } else {
      setAvailableUnits([]);
    }
  };

  const bookingColumns: ColumnsType<any> = [
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
      title: 'Unit',
      key: 'unit',
      render: (_, record: any) => record.unit?.unitCode || 'N/A',
    },
    {
      title: 'Guest',
      key: 'guest',
      render: (_, record: any) =>
        record.guest ? `${record.guest.firstName} ${record.guest.lastName}` : 'N/A',
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
      render: (amount: number) => `AED ${amount?.toLocaleString() || 0}`,
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
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEditBooking(record)}
            size="small"
          >
            Edit
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this booking?"
            onConfirm={() => handleDeleteBooking(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="link" danger icon={<DeleteOutlined />} size="small">
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const unitColumns: ColumnsType<any> = [
    {
      title: 'Property',
      key: 'property',
      render: (_, record: any) => record.property?.name || 'N/A',
    },
    {
      title: 'Unit Code',
      dataIndex: 'unitCode',
      key: 'unitCode',
    },
    {
      title: 'Floor',
      dataIndex: 'floor',
      key: 'floor',
    },
    {
      title: 'Size',
      dataIndex: 'size',
      key: 'size',
      render: (size: number) => (size ? `${size} sqft` : 'N/A'),
    },
    {
      title: 'Current Price',
      dataIndex: 'currentPrice',
      key: 'currentPrice',
      render: (price: number) => (price ? `AED ${price.toLocaleString()}` : 'N/A'),
    },
    {
      title: 'Status',
      dataIndex: 'availabilityStatus',
      key: 'availabilityStatus',
      render: (status: string) => {
        const colorMap: Record<string, string> = {
          available: 'green',
          occupied: 'red',
          maintenance: 'orange',
          unavailable: 'default',
        };
        return <Tag color={colorMap[status] || 'default'}>{status?.toUpperCase() || 'N/A'}</Tag>;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEditUnit(record)}
            size="small"
          >
            Edit
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this unit?"
            onConfirm={() => handleDeleteUnit(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="link" danger icon={<DeleteOutlined />} size="small">
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const financeColumns: ColumnsType<any> = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => dayjs(date).format('MMM DD, YYYY'),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag color={type === 'revenue' ? 'green' : 'red'}>{type.toUpperCase()}</Tag>
      ),
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
    },
    {
      title: 'Property',
      key: 'property',
      render: (_, record: any) => record.property?.name || 'N/A',
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number, record: any) => (
        <span style={{ color: record.type === 'revenue' ? '#3f8600' : '#cf1322' }}>
          {record.type === 'revenue' ? '+' : '-'}
          {(typeof amount === 'number' ? amount : parseFloat(amount) || 0).toFixed(2)} AED
        </span>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'paid' ? 'green' : 'orange'}>{status.toUpperCase()}</Tag>
      ),
    },
  ];

  if (loading && !data) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!data) {
    return <div>No data available</div>;
  }

  const financeSummary = financeRecords.reduce(
    (acc, record) => {
      if (record.type === 'revenue') {
        acc.revenue += record.amount;
      } else {
        acc.expenses += record.amount;
      }
      return acc;
    },
    { revenue: 0, expenses: 0 }
  );
  financeSummary.netIncome = financeSummary.revenue - financeSummary.expenses;

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>
          Owner Dashboard
        </Title>
        <Space style={{ marginTop: 8 }}>
          <Button icon={<ReloadOutlined />} onClick={loadData} loading={loading}>
            Refresh
          </Button>
        </Space>
      </div>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Properties"
              value={data.statistics.totalProperties}
              prefix={<HomeOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Units"
              value={data.statistics.totalUnits}
              prefix={<HomeOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Occupancy Rate"
              value={data.statistics.occupancyRate}
              precision={1}
              suffix="%"
              prefix={<UserOutlined />}
            />
            <Progress
              percent={data.statistics.occupancyRate}
              showInfo={false}
              style={{ marginTop: 8 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Monthly Revenue"
              value={data.statistics.monthlyRevenue}
              precision={0}
              prefix={<DollarOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Bookings"
              value={data.statistics.totalBookings}
              prefix={<CalendarOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Pending"
              value={data.statistics.pendingBookings}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Upcoming (30 days)"
              value={data.statistics.upcomingBookings}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Currently Staying"
              value={data.statistics.currentBookings}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Tabs for different views */}
      <Card>
        <Tabs defaultActiveKey="bookings">
          <TabPane tab="Bookings" key="bookings" tabKey="bookings">
            <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
              <Select value={bookingFilter} onChange={setBookingFilter} style={{ width: 150 }}>
                <Option value="all">All Bookings</Option>
                <Option value="pending">Pending</Option>
                <Option value="upcoming">Upcoming</Option>
                <Option value="current">Currently Staying</Option>
              </Select>
              <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateBooking}>
                Add Booking
              </Button>
            </Space>
            <Table
              columns={bookingColumns}
              dataSource={getFilteredBookings()}
              rowKey="id"
              pagination={{ pageSize: 10 }}
            />
          </TabPane>
          <TabPane tab="Units" key="units" tabKey="units">
            <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'flex-end' }}>
              <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateUnit}>
                Add Unit
              </Button>
            </Space>
            <Table
              columns={unitColumns}
              dataSource={data.units}
              rowKey="id"
              pagination={{ pageSize: 10 }}
            />
          </TabPane>
          <TabPane tab="Properties" key="properties" tabKey="properties">
            <Row gutter={[16, 16]}>
              {data.properties.map((property) => (
                <Col xs={24} sm={12} md={8} key={property.id}>
                  <Card title={property.name} extra={<Tag>{property.code}</Tag>} hoverable>
                    <Statistic
                      title="Units"
                      value={property._count?.units || 0}
                      prefix={<HomeOutlined />}
                    />
                    <Statistic
                      title="Bookings"
                      value={property._count?.bookings || 0}
                      prefix={<CalendarOutlined />}
                      style={{ marginTop: 16 }}
                    />
                  </Card>
                </Col>
              ))}
            </Row>
          </TabPane>
          <TabPane tab="Finance Report" key="finance" tabKey="finance">
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <Space>
                <RangePicker
                  value={financeDateRange}
                  onChange={(dates) =>
                    setFinanceDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)
                  }
                />
                <Button onClick={loadFinanceRecords} loading={financeLoading}>
                  Load Report
                </Button>
              </Space>
              {financeRecords.length > 0 && (
                <Row gutter={16}>
                  <Col xs={24} sm={8}>
                    <Card>
                      <Statistic
                        title="Total Revenue"
                        value={financeSummary.revenue}
                        precision={2}
                        prefix={<DollarOutlined />}
                        valueStyle={{ color: '#3f8600' }}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Card>
                      <Statistic
                        title="Total Expenses"
                        value={financeSummary.expenses}
                        precision={2}
                        prefix={<DollarOutlined />}
                        valueStyle={{ color: '#cf1322' }}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Card>
                      <Statistic
                        title="Net Income"
                        value={financeSummary.netIncome}
                        precision={2}
                        prefix={<DollarOutlined />}
                        valueStyle={{
                          color: financeSummary.netIncome >= 0 ? '#3f8600' : '#cf1322',
                        }}
                      />
                    </Card>
                  </Col>
                </Row>
              )}
              <Table
                columns={financeColumns}
                dataSource={financeRecords}
                rowKey="id"
                loading={financeLoading}
                pagination={{ pageSize: 10 }}
              />
            </Space>
          </TabPane>
        </Tabs>
      </Card>

      {/* Unit Modal */}
      <Modal
        title={editingUnit ? 'Edit Unit' : 'Create Unit'}
        open={isUnitModalVisible}
        onCancel={() => {
          setIsUnitModalVisible(false);
          unitForm.resetFields();
        }}
        onOk={() => unitForm.submit()}
        width={600}
      >
        <Form form={unitForm} layout="vertical" onFinish={handleUnitSubmit}>
          <Form.Item
            name="propertyId"
            label="Property"
            rules={[{ required: true, message: 'Please select a property' }]}
          >
            <Select
              placeholder="Select a property"
              showSearch
              notFoundContent={
                data?.properties.length === 0 ? 'No properties available' : undefined
              }
            >
              {data?.properties.map((p) => (
                <Option key={p.id} value={p.id}>
                  {p.name} ({p.code})
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="unitCode"
            label="Unit Code"
            rules={[{ required: true, message: 'Please enter unit code' }]}
          >
            <Input placeholder="e.g., UNIT-101" />
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
          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={3} placeholder="Additional notes..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* Booking Modal */}
      <Modal
        title={editingBooking ? 'Edit Booking' : 'Create Booking'}
        open={isBookingModalVisible}
        onCancel={() => {
          setIsBookingModalVisible(false);
          bookingForm.resetFields();
          setSelectedPropertyId(undefined);
          setAvailableUnits([]);
        }}
        onOk={() => bookingForm.submit()}
        width={700}
      >
        <Form form={bookingForm} layout="vertical" onFinish={handleBookingSubmit}>
          <Form.Item
            name="propertyId"
            label="Property"
            rules={[{ required: true, message: 'Please select a property' }]}
          >
            <Select
              placeholder="Select a property"
              showSearch
              onChange={handlePropertyChange}
              notFoundContent={
                data?.properties.length === 0 ? 'No properties available' : undefined
              }
            >
              {data?.properties.map((p) => (
                <Option key={p.id} value={p.id}>
                  {p.name} ({p.code})
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="unitId" label="Unit (Optional)">
            <Select
              placeholder="Select a unit"
              showSearch
              disabled={!selectedPropertyId}
              notFoundContent={
                !selectedPropertyId
                  ? 'Please select a property first'
                  : availableUnits.length === 0
                    ? 'No units available'
                    : undefined
              }
            >
              {availableUnits.map((u) => (
                <Option key={u.id} value={u.id}>
                  {u.unitCode}
                </Option>
              ))}
            </Select>
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
              notFoundContent={guests.length === 0 ? 'No guests available' : undefined}
              options={guests.map((g) => ({
                value: g.id,
                label: `${g.firstName} ${g.lastName}${g.email ? ` (${g.email})` : ''}`,
              }))}
            />
          </Form.Item>
          <Form.Item
            name="channel"
            label="Channel"
            rules={[{ required: true }]}
            initialValue="direct"
          >
            <Select>
              <Option value="direct">Direct</Option>
              <Option value="airbnb">Airbnb</Option>
              <Option value="booking_com">Booking.com</Option>
              <Option value="other">Other</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="checkinDate"
            label="Check-in Date"
            rules={[{ required: true, message: 'Please select check-in date' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="checkoutDate"
            label="Check-out Date"
            rules={[{ required: true, message: 'Please select check-out date' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="totalAmount"
            label="Total Amount (AED)"
            rules={[{ required: true, message: 'Please enter total amount' }]}
          >
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
          <Form.Item name="depositAmount" label="Deposit Amount (AED)">
            <InputNumber style={{ width: '100%' }} min={0} step={0.01} />
          </Form.Item>
          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={3} placeholder="Additional notes..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default OwnerDashboardPage;
