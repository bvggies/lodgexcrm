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
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../store/hooks';
import { ownersApi } from '../../services/api/ownersApi';
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

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await ownersApi.getMyData();
      setData(response.data.data);
    } catch (error: any) {
      message.error('Failed to load dashboard data');
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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
        };
        return <Tag color={colorMap[status] || 'default'}>{status?.toUpperCase() || 'N/A'}</Tag>;
      },
    },
  ];

  if (loading && !data) {
    return <div>Loading...</div>;
  }

  if (!data) {
    return <div>No data available</div>;
  }

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
          <TabPane tab="Bookings" key="bookings">
            <Space style={{ marginBottom: 16 }}>
              <Select value={bookingFilter} onChange={setBookingFilter} style={{ width: 150 }}>
                <Option value="all">All Bookings</Option>
                <Option value="pending">Pending</Option>
                <Option value="upcoming">Upcoming</Option>
                <Option value="current">Currently Staying</Option>
              </Select>
            </Space>
            <Table
              columns={bookingColumns}
              dataSource={getFilteredBookings()}
              rowKey="id"
              pagination={{ pageSize: 10 }}
            />
          </TabPane>
          <TabPane tab="Units" key="units">
            <Table
              columns={unitColumns}
              dataSource={data.units}
              rowKey="id"
              pagination={{ pageSize: 10 }}
            />
          </TabPane>
          <TabPane tab="Properties" key="properties">
            <Row gutter={[16, 16]}>
              {data.properties.map((property) => (
                <Col xs={24} sm={12} md={8} key={property.id}>
                  <Card
                    title={property.name}
                    extra={<Tag>{property.code}</Tag>}
                    hoverable
                    onClick={() => navigate(`/owner/properties/${property.id}`)}
                  >
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
        </Tabs>
      </Card>
    </div>
  );
};

export default OwnerDashboardPage;
