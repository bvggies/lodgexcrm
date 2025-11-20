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
  Select,
  DatePicker,
  Spin,
  Tooltip,
  Progress,
  List,
  Avatar,
} from 'antd';
import { motion } from 'framer-motion';
import AnimatedCard from '../../components/animations/AnimatedCard';
import StaggerContainer from '../../components/animations/StaggerContainer';
import FadeIn from '../../components/animations/FadeIn';
import {
  DollarOutlined,
  CalendarOutlined,
  HomeOutlined,
  UserOutlined,
  PlusOutlined,
  ReloadOutlined,
  RiseOutlined,
  PieChartOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { analyticsApi } from '../../services/api/analyticsApi';
import { bookingsApi } from '../../services/api/bookingsApi';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

interface DashboardData {
  summary: {
    totalProperties: number;
    activeBookings: number;
    totalGuests: number;
    pendingCleaningTasks: number;
    pendingMaintenanceTasks: number;
    unpaidBookingsCount: number;
  };
  financial: {
    monthlyRevenue: number;
    monthlyExpenses: number;
    monthlyNetIncome: number;
  };
  occupancy: {
    rate: number;
    totalBookings: number;
    totalNights: number;
  };
  upcomingCheckins: any[];
  upcomingCheckouts: any[];
  unpaidBookings: any[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<DashboardData | null>(null);
  const [revenueChartData, setRevenueChartData] = useState<any[]>([]);
  const [occupancyData, setOccupancyData] = useState<any[]>([]);
  const [channelData, setChannelData] = useState<any[]>([]);
  const [statusData, setStatusData] = useState<any[]>([]);
  const [repeatGuestsData, setRepeatGuestsData] = useState<any>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y' | 'custom'>('30d');
  const [customDateRange, setCustomDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);

  useEffect(() => {
    loadDashboardData();
    loadChartsData();
  }, [timeRange, customDateRange]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const response = await analyticsApi.getDashboardSummary();
      setData(response.data.data);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadChartsData = async () => {
    try {
      const dateRange = getDateRange();
      const startDate = dateRange[0].toISOString();
      const endDate = dateRange[1].toISOString();

      // Load revenue/expense chart
      const revenueResponse = await analyticsApi.getRevenueExpenseChart({
        startDate,
        endDate,
      });
      setRevenueChartData(revenueResponse.data.data.chartData);

      // Load occupancy rates
      const occupancyResponse = await analyticsApi.getOccupancyRates({
        startDate,
        endDate,
      });
      setOccupancyData(occupancyResponse.data.data.properties.slice(0, 10));

      // Load bookings for channel and status breakdown
      const bookingsResponse = await bookingsApi.getAll({
        startDate,
        endDate,
      });
      processBookingsData(bookingsResponse.data.data.bookings);

      // Load repeat guests
      const repeatGuestsResponse = await analyticsApi.getRepeatGuests();
      setRepeatGuestsData(repeatGuestsResponse.data.data);
    } catch (error) {
      console.error('Failed to load charts data:', error);
    }
  };

  const getDateRange = (): [dayjs.Dayjs, dayjs.Dayjs] => {
    const now = dayjs();
    if (timeRange === 'custom' && customDateRange) {
      return customDateRange;
    }
    switch (timeRange) {
      case '7d':
        return [now.subtract(7, 'day'), now];
      case '30d':
        return [now.subtract(30, 'day'), now];
      case '90d':
        return [now.subtract(90, 'day'), now];
      case '1y':
        return [now.subtract(1, 'year'), now];
      default:
        return [now.subtract(30, 'day'), now];
    }
  };

  const processBookingsData = (bookings: any[]) => {
    // Channel breakdown
    const channelCount: Record<string, number> = {};
    bookings.forEach((booking) => {
      const channel = booking.channel || 'other';
      channelCount[channel] = (channelCount[channel] || 0) + 1;
    });
    setChannelData(
      Object.entries(channelCount).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1).replace('_', ' '),
        value,
      }))
    );

    // Status breakdown
    const statusCount: Record<string, number> = {};
    bookings.forEach((booking) => {
      const status = booking.paymentStatus || 'pending';
      statusCount[status] = (statusCount[status] || 0) + 1;
    });
    setStatusData(
      Object.entries(statusCount).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
      }))
    );
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadDashboardData(), loadChartsData()]);
    setRefreshing(false);
  };

  const checkinColumns: ColumnsType<any> = [
    {
      title: 'Property',
      dataIndex: ['property', 'name'],
      key: 'property',
    },
    {
      title: 'Guest',
      key: 'guest',
      render: (_, record) => `${record.guest.firstName} ${record.guest.lastName}`,
    },
    {
      title: 'Check-in',
      dataIndex: 'checkinDate',
      key: 'checkinDate',
      render: (date: string) => dayjs(date).format('MMM DD, YYYY'),
    },
    {
      title: 'Reference',
      dataIndex: 'reference',
      key: 'reference',
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

  const unpaidColumns: ColumnsType<any> = [
    {
      title: 'Reference',
      dataIndex: 'reference',
      key: 'reference',
    },
    {
      title: 'Guest',
      key: 'guest',
      render: (_, record) => `${record.guest.firstName} ${record.guest.lastName}`,
    },
    {
      title: 'Amount',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amount: number) => `$${amount.toFixed(2)}`,
    },
    {
      title: 'Status',
      dataIndex: 'paymentStatus',
      key: 'paymentStatus',
      render: (status: string) => {
        const colors: Record<string, string> = {
          pending: 'orange',
          partial: 'blue',
          paid: 'green',
        };
        return <Tag color={colors[status] || 'default'}>{status.toUpperCase()}</Tag>;
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
            Dashboard
          </Title>
          <Space>
            <Select
              value={timeRange}
              onChange={(value) => {
                setTimeRange(value);
                if (value !== 'custom') {
                  setCustomDateRange(null);
                }
              }}
              style={{ width: 150 }}
            >
              <Option value="7d">Last 7 Days</Option>
              <Option value="30d">Last 30 Days</Option>
              <Option value="90d">Last 90 Days</Option>
              <Option value="1y">Last Year</Option>
              <Option value="custom">Custom Range</Option>
            </Select>
            {timeRange === 'custom' && (
              <RangePicker
                value={customDateRange}
                onChange={(dates) => setCustomDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)}
              />
            )}
            <Tooltip title="Refresh Data">
              <Button
                icon={<ReloadOutlined spin={refreshing} />}
                onClick={handleRefresh}
                loading={refreshing}
              >
                Refresh
              </Button>
            </Tooltip>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/bookings')}>
              Add Booking
            </Button>
          </Space>
        </div>
      </FadeIn>

      {/* Summary Statistics */}
      <StaggerContainer>
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <AnimatedCard index={0}>
              <Statistic
                title="Monthly Revenue"
                value={data?.financial.monthlyRevenue || 0}
                prefix={<DollarOutlined />}
                precision={2}
                loading={loading}
                valueStyle={{ color: '#3f8600' }}
              />
            </AnimatedCard>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <AnimatedCard index={1}>
              <Statistic
                title="Active Bookings"
                value={data?.summary.activeBookings || 0}
                prefix={<CalendarOutlined />}
                loading={loading}
              />
            </AnimatedCard>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <AnimatedCard index={2}>
              <Statistic
                title="Properties"
                value={data?.summary.totalProperties || 0}
                prefix={<HomeOutlined />}
                loading={loading}
              />
            </AnimatedCard>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <AnimatedCard index={3}>
              <Statistic
                title="Occupancy Rate"
                value={data?.occupancy.rate || 0}
                suffix="%"
                precision={1}
                loading={loading}
                valueStyle={{
                  color: data?.occupancy.rate && data.occupancy.rate > 70 ? '#3f8600' : '#cf1322',
                }}
              />
            </AnimatedCard>
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <AnimatedCard index={4}>
              <Statistic
                title="Monthly Expenses"
                value={data?.financial.monthlyExpenses || 0}
                prefix={<DollarOutlined />}
                precision={2}
                loading={loading}
                valueStyle={{ color: '#cf1322' }}
              />
            </AnimatedCard>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <AnimatedCard index={5}>
              <Statistic
                title="Net Income"
                value={data?.financial.monthlyNetIncome || 0}
                prefix={<DollarOutlined />}
                precision={2}
                valueStyle={{
                  color: (data?.financial.monthlyNetIncome || 0) >= 0 ? '#3f8600' : '#cf1322',
                }}
                loading={loading}
              />
            </AnimatedCard>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <AnimatedCard index={6}>
              <Statistic
                title="Pending Cleaning"
                value={data?.summary.pendingCleaningTasks || 0}
                loading={loading}
                suffix={
                  <Button
                    type="link"
                    size="small"
                    onClick={() => navigate('/cleaning')}
                    style={{ padding: 0 }}
                  >
                    View
                  </Button>
                }
              />
            </AnimatedCard>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <AnimatedCard index={7}>
              <Statistic
                title="Pending Maintenance"
                value={data?.summary.pendingMaintenanceTasks || 0}
                loading={loading}
                suffix={
                  <Button
                    type="link"
                    size="small"
                    onClick={() => navigate('/maintenance')}
                    style={{ padding: 0 }}
                  >
                    View
                  </Button>
                }
              />
            </AnimatedCard>
          </Col>
        </Row>
      </StaggerContainer>

      {/* Charts Row 1 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={16}>
          <Card
            title={
              <Space>
                <BarChartOutlined />
                <span>Revenue vs Expenses</span>
              </Space>
            }
            extra={
              <Tooltip title="Shows revenue and expenses over time">
                <Text type="secondary">Monthly Breakdown</Text>
              </Tooltip>
            }
          >
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={revenueChartData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3f8600" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#3f8600" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#cf1322" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#cf1322" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="month"
                  tickFormatter={(value) => dayjs(value, 'YYYY-MM').format('MMM YY')}
                />
                <YAxis />
                <RechartsTooltip
                  formatter={(value: number) => `$${value.toFixed(2)}`}
                  labelFormatter={(label) => dayjs(label, 'YYYY-MM').format('MMMM YYYY')}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#3f8600"
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                  name="Revenue"
                />
                <Area
                  type="monotone"
                  dataKey="expense"
                  stroke="#cf1322"
                  fillOpacity={1}
                  fill="url(#colorExpense)"
                  name="Expenses"
                />
                <Line
                  type="monotone"
                  dataKey="netIncome"
                  stroke="#1890ff"
                  strokeWidth={2}
                  name="Net Income"
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card
            title={
              <Space>
                <PieChartOutlined />
                <span>Booking Channels</span>
              </Space>
            }
          >
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={channelData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {channelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* Charts Row 2 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <RiseOutlined />
                <span>Top Properties by Occupancy</span>
              </Space>
            }
          >
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={occupancyData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 100]} />
                <YAxis dataKey="propertyName" type="category" width={120} tick={{ fontSize: 12 }} />
                <RechartsTooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
                <Bar dataKey="occupancyRate" name="Occupancy Rate (%)">
                  {occupancyData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        entry.occupancyRate > 70
                          ? '#3f8600'
                          : entry.occupancyRate > 50
                            ? '#ffa940'
                            : '#cf1322'
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <PieChartOutlined />
                <span>Payment Status Distribution</span>
              </Space>
            }
          >
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => {
                    const colorMap: Record<string, string> = {
                      Paid: '#3f8600',
                      Pending: '#ffa940',
                      Partial: '#1890ff',
                      Refunded: '#cf1322',
                    };
                    return (
                      <Cell
                        key={`cell-${index}`}
                        fill={colorMap[entry.name] || COLORS[index % COLORS.length]}
                      />
                    );
                  })}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* Repeat Guests Widget */}
      {repeatGuestsData && (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} lg={12}>
            <Card
              title={
                <Space>
                  <UserOutlined />
                  <span>Repeat Guests Analysis</span>
                </Space>
              }
            >
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Statistic
                    title="Repeat Guest Rate"
                    value={repeatGuestsData.summary?.repeatGuestPercentage || 0}
                    suffix="%"
                    precision={1}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="Total Repeat Guests"
                    value={repeatGuestsData.summary?.repeatGuests || 0}
                    suffix={`/ ${repeatGuestsData.summary?.totalGuests || 0} total`}
                  />
                </Col>
              </Row>
              <div style={{ marginTop: 16 }}>
                <Text strong>Top Repeat Guests:</Text>
                <List
                  dataSource={repeatGuestsData.topRepeatGuests?.slice(0, 5) || []}
                  renderItem={(guest: any) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={<Avatar>{guest.firstName[0]}</Avatar>}
                        title={`${guest.firstName} ${guest.lastName}`}
                        description={`${guest.totalBookings} bookings • $${guest.totalSpend.toFixed(2)} total`}
                      />
                    </List.Item>
                  )}
                  size="small"
                />
              </div>
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card
              title={
                <Space>
                  <CalendarOutlined />
                  <span>Upcoming Check-outs</span>
                </Space>
              }
              extra={
                <Button type="link" onClick={() => navigate('/bookings')}>
                  View All
                </Button>
              }
            >
              <Table
                columns={[
                  {
                    title: 'Property',
                    dataIndex: ['property', 'name'],
                    key: 'property',
                  },
                  {
                    title: 'Guest',
                    key: 'guest',
                    render: (_, record) => `${record.guest.firstName} ${record.guest.lastName}`,
                  },
                  {
                    title: 'Check-out',
                    dataIndex: 'checkoutDate',
                    key: 'checkoutDate',
                    render: (date: string) => dayjs(date).format('MMM DD, YYYY'),
                  },
                ]}
                dataSource={data?.upcomingCheckouts || []}
                loading={loading}
                pagination={false}
                size="small"
                scroll={{ y: 200 }}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* Tables Row */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card
            title="Upcoming Check-ins (Next 7 Days)"
            extra={
              <Button type="link" onClick={() => navigate('/bookings')}>
                View All
              </Button>
            }
            style={{ height: 400 }}
          >
            <Table
              columns={checkinColumns}
              dataSource={data?.upcomingCheckins || []}
              loading={loading}
              pagination={false}
              size="small"
              scroll={{ y: 280 }}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card
            title="Unpaid Bookings"
            extra={
              <Button type="link" onClick={() => navigate('/bookings')}>
                View All
              </Button>
            }
            style={{ height: 400 }}
          >
            <Table
              columns={unpaidColumns}
              dataSource={data?.unpaidBookings || []}
              loading={loading}
              pagination={false}
              size="small"
              scroll={{ y: 280 }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DashboardPage;
