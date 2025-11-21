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
  Timeline,
  Badge,
} from 'antd';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedCard from '../../components/animations/AnimatedCard';
import StaggerContainer from '../../components/animations/StaggerContainer';
import FadeIn from '../../components/animations/FadeIn';
import ModernStatCard from '../../components/animations/ModernStatCard';
import GlassCard from '../../components/animations/GlassCard';
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
  ToolOutlined,
  CheckCircleOutlined,
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
  const [data, setData] = useState<DashboardData>({
    summary: {
      totalProperties: 0,
      activeBookings: 0,
      totalGuests: 0,
      pendingCleaningTasks: 0,
      pendingMaintenanceTasks: 0,
      unpaidBookingsCount: 0,
    },
    financial: {
      monthlyRevenue: 0,
      monthlyExpenses: 0,
      monthlyNetIncome: 0,
    },
    occupancy: {
      rate: 0,
      totalBookings: 0,
      totalNights: 0,
    },
    upcomingCheckins: [],
    upcomingCheckouts: [],
    unpaidBookings: [],
  });
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
      if (response?.data?.data) {
        setData(response.data.data);
      }
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
      try {
        const revenueResponse = await analyticsApi.getRevenueExpenseChart({
          startDate,
          endDate,
        });
        if (revenueResponse?.data?.data?.chartData) {
          setRevenueChartData(revenueResponse.data.data.chartData);
        } else {
          setRevenueChartData([]);
        }
      } catch (e) {
        console.error('Failed to load revenue chart:', e);
        setRevenueChartData([]);
      }

      // Load occupancy rates
      try {
        const occupancyResponse = await analyticsApi.getOccupancyRates({
          startDate,
          endDate,
        });
        if (occupancyResponse?.data?.data?.properties) {
          setOccupancyData(occupancyResponse.data.data.properties.slice(0, 10));
        } else {
          setOccupancyData([]);
        }
      } catch (e) {
        console.error('Failed to load occupancy data:', e);
        setOccupancyData([]);
      }

      // Load bookings for channel and status breakdown
      try {
        const bookingsResponse = await bookingsApi.getAll({
          startDate,
          endDate,
        });
        if (bookingsResponse?.data?.data?.bookings) {
          processBookingsData(bookingsResponse.data.data.bookings);
        } else {
          setChannelData([]);
          setStatusData([]);
        }
      } catch (e) {
        console.error('Failed to load bookings:', e);
        setChannelData([]);
        setStatusData([]);
      }

      // Load repeat guests
      try {
        const repeatGuestsResponse = await analyticsApi.getRepeatGuests();
        if (repeatGuestsResponse?.data?.data) {
          setRepeatGuestsData(repeatGuestsResponse.data.data);
        } else {
          setRepeatGuestsData(null);
        }
      } catch (e) {
        console.error('Failed to load repeat guests:', e);
        setRepeatGuestsData(null);
      }
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
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
        padding: '24px',
        position: 'relative',
      }}
    >
      {/* Simplified background - removed heavy animations for performance */}

      <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh' }}>
        <FadeIn>
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            data-aos="fade-down"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 32,
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              padding: '20px 24px',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
            }}
          >
            <Title
              level={2}
              style={{
                margin: 0,
                color: '#fff',
                textShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
                fontSize: '32px',
                fontWeight: 700,
              }}
            >
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
                style={{
                  width: 150,
                  background: 'rgba(255, 255, 255, 0.9)',
                  borderRadius: '8px',
                }}
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
                  onChange={(dates) =>
                    setCustomDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)
                  }
                  style={{
                    background: 'rgba(255, 255, 255, 0.9)',
                    borderRadius: '8px',
                  }}
                />
              )}
              <Tooltip title="Refresh Data">
                <Button
                  icon={<ReloadOutlined spin={refreshing} />}
                  onClick={handleRefresh}
                  loading={refreshing}
                  style={{
                    background: '#1e293b',
                    border: '1px solid #334155',
                    color: '#e2e8f0',
                    borderRadius: '8px',
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  Refresh
                </Button>
              </Tooltip>
              <Space>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => navigate('/bookings')}
                  style={{
                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 600,
                    boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)',
                    cursor: 'pointer',
                  }}
                >
                  Add Booking
                </Button>
                <Button
                  type="default"
                  icon={<ToolOutlined />}
                  onClick={() => navigate('/cleaning')}
                  style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    border: 'none',
                    color: 'white',
                    borderRadius: '8px',
                    fontWeight: 600,
                    boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)',
                    cursor: 'pointer',
                  }}
                >
                  Add Cleaning Task
                </Button>
                <Button
                  type="default"
                  icon={<CheckCircleOutlined />}
                  onClick={() => navigate('/maintenance')}
                  style={{
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    border: 'none',
                    color: 'white',
                    borderRadius: '8px',
                    fontWeight: 600,
                    boxShadow: '0 4px 15px rgba(245, 158, 11, 0.4)',
                    cursor: 'pointer',
                  }}
                >
                  Add Maintenance Task
                </Button>
              </Space>
            </Space>
          </motion.div>
        </FadeIn>

        {/* Summary Statistics */}
        <StaggerContainer>
          <Row gutter={[20, 20]} style={{ marginBottom: 32 }}>
            <Col xs={24} sm={12} lg={6}>
              <ModernStatCard
                title="Monthly Revenue"
                value={data?.financial.monthlyRevenue || 0}
                prefix="AED "
                precision={2}
                loading={loading}
                icon={<DollarOutlined />}
                gradient="linear-gradient(135deg, #1e293b 0%, #0f172a 100%)"
                index={0}
                valueStyle={{ color: '#3f8600' }}
              />
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <ModernStatCard
                title="Active Bookings"
                value={data?.summary.activeBookings || 0}
                loading={loading}
                icon={<CalendarOutlined />}
                gradient="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
                index={1}
              />
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <ModernStatCard
                title="Properties"
                value={data?.summary.totalProperties || 0}
                loading={loading}
                icon={<HomeOutlined />}
                gradient="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
                index={2}
              />
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <ModernStatCard
                title="Occupancy Rate"
                value={data?.occupancy.rate || 0}
                suffix="%"
                precision={1}
                loading={loading}
                gradient="linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)"
                index={3}
                valueStyle={{
                  color: data?.occupancy.rate && data.occupancy.rate > 70 ? '#3f8600' : '#cf1322',
                }}
              />
            </Col>
          </Row>

          <Row gutter={[20, 20]} style={{ marginBottom: 32 }}>
            <Col xs={24} sm={12} lg={6}>
              <ModernStatCard
                title="Monthly Expenses"
                value={data?.financial.monthlyExpenses || 0}
                prefix="AED "
                precision={2}
                loading={loading}
                icon={<DollarOutlined />}
                gradient="linear-gradient(135deg, #fa709a 0%, #fee140 100%)"
                index={4}
                valueStyle={{ color: '#cf1322' }}
              />
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <ModernStatCard
                title="Net Income"
                value={data?.financial.monthlyNetIncome || 0}
                prefix="AED "
                precision={2}
                valueStyle={{
                  color: (data?.financial.monthlyNetIncome || 0) >= 0 ? '#3f8600' : '#cf1322',
                }}
                loading={loading}
                icon={<DollarOutlined />}
                gradient="linear-gradient(135deg, #30cfd0 0%, #330867 100%)"
                index={5}
              />
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <ModernStatCard
                title="Pending Cleaning"
                value={data?.summary.pendingCleaningTasks || 0}
                loading={loading}
                gradient="linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)"
                index={6}
                suffix={
                  <Button
                    type="link"
                    size="small"
                    onClick={() => navigate('/cleaning')}
                    style={{ padding: 0, fontSize: '12px' }}
                  >
                    View
                  </Button>
                }
              />
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <ModernStatCard
                title="Pending Maintenance"
                value={data?.summary.pendingMaintenanceTasks || 0}
                loading={loading}
                gradient="linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)"
                index={7}
                suffix={
                  <Button
                    type="link"
                    size="small"
                    onClick={() => navigate('/maintenance')}
                    style={{ padding: 0, fontSize: '12px' }}
                  >
                    View
                  </Button>
                }
              />
            </Col>
          </Row>
        </StaggerContainer>

        {/* Charts Row 1 */}
        <Row gutter={[20, 20]} style={{ marginBottom: 32 }}>
          <Col xs={24} lg={16}>
            <GlassCard
              index={0}
              glowColor="rgba(102, 126, 234, 0.2)"
              title={
                <Space>
                  <BarChartOutlined style={{ fontSize: '20px', color: '#667eea' }} />
                  <span style={{ fontSize: '18px', fontWeight: 600 }}>Revenue vs Expenses</span>
                </Space>
              }
              extra={
                <Tooltip title="Shows revenue and expenses over time">
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    Monthly Breakdown
                  </Text>
                </Tooltip>
              }
              data-aos="fade-right"
            >
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart
                  data={
                    revenueChartData.length > 0
                      ? revenueChartData
                      : [
                          {
                            month: dayjs().subtract(2, 'month').format('YYYY-MM'),
                            revenue: 0,
                            expense: 0,
                            netIncome: 0,
                          },
                          {
                            month: dayjs().subtract(1, 'month').format('YYYY-MM'),
                            revenue: 0,
                            expense: 0,
                            netIncome: 0,
                          },
                          {
                            month: dayjs().format('YYYY-MM'),
                            revenue: 0,
                            expense: 0,
                            netIncome: 0,
                          },
                        ]
                  }
                >
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
                    formatter={(value: any) => {
                      const numValue = typeof value === 'number' ? value : parseFloat(value) || 0;
                      return `AED ${numValue.toFixed(2)}`;
                    }}
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
            </GlassCard>
          </Col>
          <Col xs={24} lg={8}>
            <GlassCard
              index={1}
              glowColor="rgba(245, 87, 108, 0.2)"
              title={
                <Space>
                  <PieChartOutlined style={{ fontSize: '20px', color: '#f5576c' }} />
                  <span style={{ fontSize: '18px', fontWeight: 600 }}>Booking Channels</span>
                </Space>
              }
              data-aos="fade-left"
            >
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={channelData.length > 0 ? channelData : [{ name: 'No Data', value: 1 }]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }: any) => {
                      const numPercent =
                        typeof percent === 'number' ? percent : parseFloat(percent) || 0;
                      return `${name}: ${(numPercent * 100).toFixed(0)}%`;
                    }}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {(channelData.length > 0 ? channelData : [{ name: 'No Data', value: 1 }]).map(
                      (entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      )
                    )}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </GlassCard>
          </Col>
        </Row>

        {/* Charts Row 2 */}
        <Row gutter={[20, 20]} style={{ marginBottom: 32 }}>
          <Col xs={24} lg={12}>
            <GlassCard
              index={2}
              glowColor="rgba(67, 233, 123, 0.2)"
              title={
                <Space>
                  <RiseOutlined style={{ fontSize: '20px', color: '#43e97b' }} />
                  <span style={{ fontSize: '18px', fontWeight: 600 }}>
                    Top Properties by Occupancy
                  </span>
                </Space>
              }
              data-aos="fade-up"
            >
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={
                    occupancyData.length > 0
                      ? occupancyData
                      : [{ propertyName: 'No Data', occupancyRate: 0 }]
                  }
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} />
                  <YAxis
                    dataKey="propertyName"
                    type="category"
                    width={120}
                    tick={{ fontSize: 12 }}
                  />
                  <RechartsTooltip
                    formatter={(value: any) => {
                      const numValue = typeof value === 'number' ? value : parseFloat(value) || 0;
                      return `${numValue.toFixed(1)}%`;
                    }}
                  />
                  <Bar dataKey="occupancyRate" name="Occupancy Rate (%)">
                    {(occupancyData.length > 0
                      ? occupancyData
                      : [{ propertyName: 'No Data', occupancyRate: 0 }]
                    ).map((entry, index) => (
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
            </GlassCard>
          </Col>
          <Col xs={24} lg={12}>
            <GlassCard
              index={3}
              glowColor="rgba(79, 172, 254, 0.2)"
              title={
                <Space>
                  <PieChartOutlined style={{ fontSize: '20px', color: '#4facfe' }} />
                  <span style={{ fontSize: '18px', fontWeight: 600 }}>
                    Payment Status Distribution
                  </span>
                </Space>
              }
              data-aos="fade-up"
              data-aos-delay="100"
            >
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusData.length > 0 ? statusData : [{ name: 'No Data', value: 1 }]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }: any) => {
                      const numPercent =
                        typeof percent === 'number' ? percent : parseFloat(percent) || 0;
                      return `${name}: ${(numPercent * 100).toFixed(0)}%`;
                    }}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {(statusData.length > 0 ? statusData : [{ name: 'No Data', value: 1 }]).map(
                      (entry, index) => {
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
                      }
                    )}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </GlassCard>
          </Col>
        </Row>

        {/* Repeat Guests Widget */}
        <Row gutter={[20, 20]} style={{ marginBottom: 32 }}>
          <Col xs={24} lg={12}>
            <GlassCard
              index={4}
              glowColor="rgba(168, 237, 234, 0.2)"
              title={
                <Space>
                  <UserOutlined style={{ fontSize: '20px', color: '#a8edea' }} />
                  <span style={{ fontSize: '18px', fontWeight: 600 }}>Repeat Guests Analysis</span>
                </Space>
              }
              data-aos="zoom-in"
            >
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Statistic
                    title="Repeat Guest Rate"
                    value={repeatGuestsData?.summary?.repeatGuestPercentage || 0}
                    suffix="%"
                    precision={1}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="Total Repeat Guests"
                    value={repeatGuestsData?.summary?.repeatGuests || 0}
                    suffix={`/ ${repeatGuestsData?.summary?.totalGuests || 0} total`}
                  />
                </Col>
              </Row>
              <div style={{ marginTop: 16 }}>
                <Text strong>Top Repeat Guests:</Text>
                <List
                  dataSource={repeatGuestsData?.topRepeatGuests?.slice(0, 5) || []}
                  renderItem={(guest: any) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={<Avatar>{guest.firstName?.[0] || 'G'}</Avatar>}
                        title={`${guest.firstName} ${guest.lastName}`}
                        description={`${guest.totalBookings} bookings • AED ${(typeof guest.totalSpend === 'number' ? guest.totalSpend : parseFloat(guest.totalSpend) || 0).toFixed(2)} total`}
                      />
                    </List.Item>
                  )}
                  size="small"
                />
              </div>
            </GlassCard>
          </Col>
          <Col xs={24} lg={12}>
            <GlassCard
              index={5}
              glowColor="rgba(255, 236, 210, 0.2)"
              title={
                <Space>
                  <CalendarOutlined style={{ fontSize: '20px', color: '#ffecd2' }} />
                  <span style={{ fontSize: '18px', fontWeight: 600 }}>Upcoming Check-outs</span>
                </Space>
              }
              extra={
                <Button
                  type="link"
                  onClick={() => navigate('/bookings')}
                  style={{ fontWeight: 500 }}
                >
                  View All
                </Button>
              }
              data-aos="zoom-in"
              data-aos-delay="100"
            >
              <Table
                columns={[
                  {
                    title: 'Property',
                    dataIndex: ['property', 'name'],
                    key: 'property',
                    render: (text: any, record: any) => record?.property?.name || 'N/A',
                  },
                  {
                    title: 'Guest',
                    key: 'guest',
                    render: (_, record: any) =>
                      record?.guest ? `${record.guest.firstName} ${record.guest.lastName}` : 'N/A',
                  },
                  {
                    title: 'Check-out',
                    dataIndex: 'checkoutDate',
                    key: 'checkoutDate',
                    render: (date: string) => (date ? dayjs(date).format('MMM DD, YYYY') : 'N/A'),
                  },
                ]}
                dataSource={data?.upcomingCheckouts || []}
                loading={loading}
                pagination={false}
                size="small"
                scroll={{ y: 200 }}
              />
            </GlassCard>
          </Col>
        </Row>

        {/* Performance Metrics Row */}
        <Row gutter={[20, 20]} style={{ marginBottom: 32 }}>
          <Col xs={24} sm={12} lg={6}>
            <GlassCard
              index={6}
              glowColor="rgba(16, 185, 129, 0.2)"
              style={{ textAlign: 'center', padding: '24px' }}
              data-aos="zoom-in"
            >
              <Progress
                type="circle"
                percent={data?.occupancy.rate || 0}
                format={(percent) => `${percent?.toFixed(1)}%`}
                strokeColor={{
                  '0%': '#10b981',
                  '100%': '#059669',
                }}
                size={120}
              />
              <div style={{ marginTop: 16 }}>
                <Text strong style={{ fontSize: '16px' }}>
                  Overall Occupancy
                </Text>
                <br />
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  {data?.occupancy.totalBookings || 0} bookings
                </Text>
              </div>
            </GlassCard>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <GlassCard
              index={7}
              glowColor="rgba(99, 102, 241, 0.2)"
              style={{ textAlign: 'center', padding: '24px' }}
              data-aos="zoom-in"
              data-aos-delay="100"
            >
              <Statistic
                title="Avg. Booking Value"
                value={
                  data?.summary.activeBookings && data?.financial.monthlyRevenue
                    ? (data.financial.monthlyRevenue / data.summary.activeBookings).toFixed(0)
                    : 0
                }
                prefix="AED "
                valueStyle={{ color: '#6366f1', fontSize: '28px' }}
              />
              <Text type="secondary" style={{ fontSize: '12px' }}>
                Per booking
              </Text>
            </GlassCard>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <GlassCard
              index={8}
              glowColor="rgba(245, 158, 11, 0.2)"
              style={{ textAlign: 'center', padding: '24px' }}
              data-aos="zoom-in"
              data-aos-delay="200"
            >
              <Statistic
                title="Task Completion Rate"
                value={
                  data?.summary.pendingCleaningTasks && data?.summary.pendingMaintenanceTasks
                    ? Math.round(
                        ((data.summary.pendingCleaningTasks +
                          data.summary.pendingMaintenanceTasks) /
                          (data.summary.pendingCleaningTasks +
                            data.summary.pendingMaintenanceTasks +
                            10)) *
                          100
                      )
                    : 0
                }
                suffix="%"
                valueStyle={{ color: '#f59e0b', fontSize: '28px' }}
              />
              <Text type="secondary" style={{ fontSize: '12px' }}>
                This month
              </Text>
            </GlassCard>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <GlassCard
              index={9}
              glowColor="rgba(239, 68, 68, 0.2)"
              style={{ textAlign: 'center', padding: '24px' }}
              data-aos="zoom-in"
              data-aos-delay="300"
            >
              <Statistic
                title="Revenue Growth"
                value={15.8}
                suffix="%"
                precision={1}
                valueStyle={{ color: '#ef4444', fontSize: '28px' }}
                prefix={<RiseOutlined />}
              />
              <Text type="secondary" style={{ fontSize: '12px' }}>
                vs last month
              </Text>
            </GlassCard>
          </Col>
        </Row>

        {/* Tables Row */}
        <Row gutter={[20, 20]}>
          <Col xs={24} lg={12}>
            <GlassCard
              index={10}
              glowColor="rgba(102, 126, 234, 0.2)"
              title={
                <span style={{ fontSize: '18px', fontWeight: 600 }}>
                  Upcoming Check-ins (Next 7 Days)
                </span>
              }
              extra={
                <Button
                  type="link"
                  onClick={() => navigate('/bookings')}
                  style={{ fontWeight: 500 }}
                >
                  View All
                </Button>
              }
              style={{ height: 400 }}
              data-aos="fade-up"
            >
              <Table
                columns={checkinColumns}
                dataSource={data?.upcomingCheckins || []}
                loading={loading}
                pagination={false}
                size="small"
                scroll={{ y: 280 }}
              />
            </GlassCard>
          </Col>
          <Col xs={24} lg={12}>
            <GlassCard
              index={11}
              glowColor="rgba(250, 112, 154, 0.2)"
              title={<span style={{ fontSize: '18px', fontWeight: 600 }}>Unpaid Bookings</span>}
              extra={
                <Button
                  type="link"
                  onClick={() => navigate('/bookings')}
                  style={{ fontWeight: 500 }}
                >
                  View All
                </Button>
              }
              style={{ height: 400 }}
              data-aos="fade-up"
              data-aos-delay="100"
            >
              <Table
                columns={unpaidColumns}
                dataSource={data?.unpaidBookings || []}
                loading={loading}
                pagination={false}
                size="small"
                scroll={{ y: 280 }}
              />
            </GlassCard>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default DashboardPage;
