import React, { useEffect, useState } from 'react';
import {
  Card,
  Typography,
  Row,
  Col,
  Select,
  DatePicker,
  Statistic,
  Space,
  Button,
  Tabs,
  message,
} from 'antd';
import { motion } from 'framer-motion';
import {
  DollarOutlined,
  HomeOutlined,
  UserOutlined,
  ReloadOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import FadeIn from '../../components/animations/FadeIn';
import StaggerContainer from '../../components/animations/StaggerContainer';
import AnimatedCard from '../../components/animations/AnimatedCard';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import { analyticsApi } from '../../services/api/analyticsApi';
import { useAppSelector } from '../../store/hooks';
import dayjs from 'dayjs';

const { Title } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;
const { TabPane } = Tabs;

const AnalyticsPage: React.FC = () => {
  const { mode: themeMode } = useAppSelector((state) => state.theme);
  const [loading, setLoading] = useState(false);
  const [revenueExpenseData, setRevenueExpenseData] = useState<any[]>([]);
  const [occupancyData, setOccupancyData] = useState<any>(null);
  const [repeatGuestsData, setRepeatGuestsData] = useState<any>(null);
  const [timeRange, setTimeRange] = useState<'1y' | '6m' | '3m' | '1m' | 'custom'>('1y');
  const [customDateRange, setCustomDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, [timeRange, customDateRange]);

  const getDateRange = (): { startDate: string; endDate: string } => {
    const now = dayjs();
    if (timeRange === 'custom' && customDateRange) {
      return {
        startDate: customDateRange[0].toISOString(),
        endDate: customDateRange[1].toISOString(),
      };
    }
    let startDate: dayjs.Dayjs;
    switch (timeRange) {
      case '1m':
        startDate = now.subtract(1, 'month');
        break;
      case '3m':
        startDate = now.subtract(3, 'month');
        break;
      case '6m':
        startDate = now.subtract(6, 'month');
        break;
      case '1y':
      default:
        startDate = now.subtract(1, 'year');
        break;
    }
    return {
      startDate: startDate.toISOString(),
      endDate: now.toISOString(),
    };
  };

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const dateRange = getDateRange();
      const [revenueResponse, occupancyResponse, repeatResponse] = await Promise.all([
        analyticsApi.getRevenueExpenseChart(dateRange),
        analyticsApi.getOccupancyRates(dateRange),
        analyticsApi.getRepeatGuests(),
      ]);

      setRevenueExpenseData(revenueResponse.data.data.chartData);
      setOccupancyData(occupancyResponse.data.data);
      setRepeatGuestsData(repeatResponse.data.data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  const handleExport = async () => {
    try {
      const dateRange = getDateRange();
      const response = await analyticsApi.export({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        format: 'csv',
      });

      // Create blob and download
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `analytics-export-${dayjs().format('YYYY-MM-DD')}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      message.success('Analytics exported successfully');
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to export analytics');
    }
  };

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
            Analytics
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
              <Option value="1m">Last Month</Option>
              <Option value="3m">Last 3 Months</Option>
              <Option value="6m">Last 6 Months</Option>
              <Option value="1y">Last Year</Option>
              <Option value="custom">Custom Range</Option>
            </Select>
            {timeRange === 'custom' && (
              <RangePicker
                value={customDateRange}
                onChange={(dates) => setCustomDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)}
              />
            )}
            <Button icon={<ReloadOutlined />} onClick={loadAnalytics} loading={loading}>
              Refresh
            </Button>
            <Button icon={<DownloadOutlined />} onClick={handleExport}>
              Export
            </Button>
          </Space>
        </div>
      </FadeIn>

      <Tabs defaultActiveKey="financial">
        <TabPane tab="Financial Analytics" key="financial">
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} lg={16}>
              <Card title="Revenue vs Expenses" loading={loading}>
                <ResponsiveContainer width="100%" height={350}>
                  <AreaChart data={revenueExpenseData}>
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
                    <Tooltip
                      formatter={(value: any) => {
                        const numValue = typeof value === 'number' ? value : parseFloat(value) || 0;
                        return `${numValue.toFixed(2)} AED`;
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
              </Card>
            </Col>
            <Col xs={24} lg={8}>
              <Card title="Summary" loading={loading}>
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                  <Statistic
                    title="Total Revenue"
                    value={revenueExpenseData.reduce((sum, d) => sum + (d.revenue || 0), 0)}
                    prefix="AED "
                    precision={2}
                    valueStyle={{ color: '#3f8600' }}
                  />
                  <Statistic
                    title="Total Expenses"
                    value={revenueExpenseData.reduce((sum, d) => sum + (d.expense || 0), 0)}
                    prefix="AED "
                    precision={2}
                    valueStyle={{ color: '#cf1322' }}
                  />
                  <Statistic
                    title="Net Income"
                    value={revenueExpenseData.reduce((sum, d) => sum + (d.netIncome || 0), 0)}
                    prefix="AED "
                    precision={2}
                    valueStyle={{
                      color:
                        revenueExpenseData.reduce((sum, d) => sum + (d.netIncome || 0), 0) >= 0
                          ? '#3f8600'
                          : '#cf1322',
                    }}
                  />
                </Space>
              </Card>
            </Col>
          </Row>
        </TabPane>

        <TabPane tab="Occupancy Analytics" key="occupancy">
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={8}>
              <Card>
                <Statistic
                  title="Overall Occupancy Rate"
                  value={occupancyData?.overallOccupancyRate || 0}
                  suffix="%"
                  precision={1}
                  valueStyle={{
                    color: (occupancyData?.overallOccupancyRate || 0) > 70 ? '#3f8600' : '#cf1322',
                    fontSize: 32,
                  }}
                />
              </Card>
            </Col>
            <Col xs={24} lg={16}>
              <Card title="Property Occupancy Rates" loading={loading}>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={occupancyData?.properties.slice(0, 10) || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="propertyName" angle={-45} textAnchor="end" height={100} />
                    <YAxis domain={[0, 100]} />
                    <Tooltip
                      formatter={(value: any) => {
                        const numValue = typeof value === 'number' ? value : parseFloat(value) || 0;
                        return `${numValue.toFixed(1)}%`;
                      }}
                    />
                    <Bar dataKey="occupancyRate" fill="#1890ff" name="Occupancy %">
                      {(occupancyData?.properties || []).map((entry: any, index: number) => (
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
          </Row>
        </TabPane>

        <TabPane tab="Guest Analytics" key="guests">
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card title="Repeat Guests Analysis" loading={loading}>
                {repeatGuestsData && (
                  <div>
                    <Row gutter={16} style={{ marginBottom: 24 }}>
                      <Col span={12}>
                        <Statistic
                          title="Repeat Guest %"
                          value={repeatGuestsData.summary?.repeatGuestPercentage || 0}
                          suffix="%"
                          precision={1}
                          valueStyle={{ color: '#1890ff' }}
                        />
                      </Col>
                      <Col span={12}>
                        <Statistic
                          title="Total Guests"
                          value={repeatGuestsData.summary?.totalGuests || 0}
                        />
                      </Col>
                    </Row>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Repeat', value: repeatGuestsData.summary?.repeatGuests || 0 },
                            {
                              name: 'One-time',
                              value: repeatGuestsData.summary?.oneTimeGuests || 0,
                            },
                          ]}
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
                          {[0, 1].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card title="Top Repeat Guests" loading={loading}>
                {repeatGuestsData?.topRepeatGuests && (
                  <div>
                    {repeatGuestsData.topRepeatGuests
                      .slice(0, 10)
                      .map((guest: any, index: number) => (
                        <div
                          key={guest.id}
                          style={{
                            marginBottom: 12,
                            padding: 12,
                            background: themeMode === 'light' ? '#f5f5f5' : '#1e293b',
                            borderRadius: 4,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <div>
                            <strong>
                              {index + 1}. {guest.firstName} {guest.lastName}
                            </strong>
                            <div style={{ fontSize: 12, color: '#666' }}>
                              {guest.totalBookings} bookings •{' '}
                              {(typeof guest.totalSpend === 'number'
                                ? guest.totalSpend
                                : parseFloat(guest.totalSpend) || 0
                              ).toFixed(2)}{' '}
                              AED total
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </Card>
            </Col>
          </Row>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default AnalyticsPage;
