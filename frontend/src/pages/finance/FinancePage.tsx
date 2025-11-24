import React, { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Space,
  Tag,
  Typography,
  Select,
  Modal,
  Form,
  DatePicker,
  InputNumber,
  Input,
  message,
  Tabs,
  Row,
  Col,
  Card,
  Statistic,
} from 'antd';
import { motion } from 'framer-motion';
import { PlusOutlined, DownloadOutlined, DollarOutlined } from '@ant-design/icons';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';
import { financeApi, FinanceRecord } from '../../services/api/financeApi';
import { propertiesApi, Property } from '../../services/api/propertiesApi';
import { bookingsApi, Booking } from '../../services/api/bookingsApi';
import FadeIn from '../../components/animations/FadeIn';
import StaggerContainer from '../../components/animations/StaggerContainer';
import AnimatedCard from '../../components/animations/AnimatedCard';

const { Title } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const FinancePage: React.FC = () => {
  const [records, setRecords] = useState<FinanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string | undefined>();
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | undefined>();
  const [form] = Form.useForm();
  const [chartData, setChartData] = useState<any[]>([]);
  const [summary, setSummary] = useState({ revenue: 0, expenses: 0, netIncome: 0 });

  useEffect(() => {
    loadRecords();
    loadProperties();
  }, [typeFilter, dateRange]);

  useEffect(() => {
    if (selectedPropertyId) {
      loadBookings(selectedPropertyId);
    } else {
      setBookings([]);
    }
  }, [selectedPropertyId]);

  const loadRecords = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (typeFilter) params.type = typeFilter;
      if (dateRange) {
        params.startDate = dateRange[0].toISOString();
        params.endDate = dateRange[1].toISOString();
      }

      const response = await financeApi.getAll(params);
      setRecords(response.data.data.records);
      setSummary(response.data.data.summary);

      // Generate chart data from records
      generateChartData(response.data.data.records);
    } catch (error) {
      message.error('Failed to load finance records');
    } finally {
      setLoading(false);
    }
  };

  const loadProperties = async () => {
    try {
      const response = await propertiesApi.getAll({ status: 'active' });
      setProperties(
        Array.isArray(response.data.data.properties) ? response.data.data.properties : []
      );
    } catch (error) {
      console.error('Failed to load properties');
    }
  };

  const loadBookings = async (propertyId: string) => {
    try {
      const response = await bookingsApi.getAll({ propertyId });
      setBookings(response.data.data.bookings);
    } catch (error) {
      console.error('Failed to load bookings');
    }
  };

  const generateChartData = (records: FinanceRecord[]) => {
    // Group by month
    const monthlyData: Record<string, { revenue: number; expense: number }> = {};

    records.forEach((record) => {
      const month = dayjs(record.date).format('MMM YYYY');
      if (!monthlyData[month]) {
        monthlyData[month] = { revenue: 0, expense: 0 };
      }
      if (record.type === 'revenue') {
        monthlyData[month].revenue += record.amount;
      } else {
        monthlyData[month].expense += record.amount;
      }
    });

    const chartDataArray = Object.entries(monthlyData)
      .map(([month, data]) => ({
        month,
        revenue: data.revenue,
        expense: data.expense,
      }))
      .sort((a, b) => dayjs(a.month, 'MMM YYYY').valueOf() - dayjs(b.month, 'MMM YYYY').valueOf());

    setChartData(chartDataArray);
  };

  const columns: ColumnsType<FinanceRecord> = [
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
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number, record) => (
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
    {
      title: 'Property',
      key: 'property',
      render: (_, record: any) => record.property?.name || 'N/A',
    },
  ];

  const handleCreate = () => {
    setSelectedPropertyId(undefined);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleExport = async (format: 'csv' | 'pdf') => {
    try {
      const params: any = { format };
      if (dateRange) {
        params.startDate = dateRange[0].toISOString();
        params.endDate = dateRange[1].toISOString();
      }
      if (typeFilter) params.type = typeFilter;

      const response = await financeApi.export(params);

      // Create blob and download
      const blob = new Blob([response.data], {
        type: format === 'csv' ? 'text/csv' : 'application/pdf',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `finance-export-${dayjs().format('YYYY-MM-DD')}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      message.success(`Export ${format.toUpperCase()} downloaded successfully`);
    } catch (error: any) {
      message.error(
        error.response?.data?.error?.message || `Failed to export ${format.toUpperCase()}`
      );
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      const submitData = {
        ...values,
        date: values.date ? values.date.toISOString() : new Date().toISOString(),
      };

      await financeApi.create(submitData);
      message.success('Finance record created successfully');
      setIsModalVisible(false);
      loadRecords();
    } catch (error: any) {
      message.error(error.response?.data?.error?.message || 'Operation failed');
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
            Finance
          </Title>
          <Space>
            <Button icon={<DownloadOutlined />} onClick={() => handleExport('csv')}>
              Export CSV
            </Button>
            <Button icon={<DownloadOutlined />} onClick={() => handleExport('pdf')}>
              Export PDF
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              Add Record
            </Button>
          </Space>
        </div>
      </FadeIn>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Total Revenue"
              value={summary.revenue}
              prefix="AED "
              precision={2}
              valueStyle={{ color: '#3f8600' }}
              loading={loading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Total Expenses"
              value={summary.expenses}
              prefix="AED "
              precision={2}
              valueStyle={{ color: '#cf1322' }}
              loading={loading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Net Income"
              value={summary.netIncome}
              prefix="AED "
              precision={2}
              valueStyle={{ color: summary.netIncome >= 0 ? '#3f8600' : '#cf1322' }}
              loading={loading}
            />
          </Card>
        </Col>
      </Row>

      <Space style={{ marginBottom: 16 }}>
        <Select
          placeholder="Filter by type"
          style={{ width: 200 }}
          allowClear
          value={typeFilter}
          onChange={setTypeFilter}
        >
          <Option value="revenue">Revenue</Option>
          <Option value="expense">Expense</Option>
        </Select>
        <RangePicker
          value={dateRange}
          onChange={(dates) => setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)}
        />
      </Space>

      <Tabs>
        <Tabs.TabPane tab="Records" key="records">
          <Table
            columns={columns}
            dataSource={records}
            loading={loading}
            rowKey="id"
            pagination={{ pageSize: 10 }}
          />
        </Tabs.TabPane>
        <Tabs.TabPane tab="Charts" key="charts">
          <Card title="Revenue vs Expenses" style={{ marginBottom: 16 }}>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#3f8600" name="Revenue" />
                <Line type="monotone" dataKey="expense" stroke="#cf1322" name="Expenses" />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Tabs.TabPane>
      </Tabs>

      <Modal
        title="Add Finance Record"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onOk={() => form.submit()}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="type"
            label="Type"
            rules={[{ required: true, message: 'Please select a type' }]}
          >
            <Select placeholder="Select type">
              <Option value="revenue">Revenue</Option>
              <Option value="expense">Expense</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="amount"
            label="Amount"
            rules={[{ required: true, message: 'Please enter amount' }]}
          >
            <InputNumber style={{ width: '100%' }} min={0} step={0.01} placeholder="0.00" />
          </Form.Item>
          <Form.Item
            name="category"
            label="Category"
            rules={[{ required: true, message: 'Please select a category' }]}
          >
            <Select placeholder="Select category">
              <Option value="guest_payment">Guest Payment</Option>
              <Option value="cleaning">Cleaning</Option>
              <Option value="maintenance">Maintenance</Option>
              <Option value="utilities">Utilities</Option>
              <Option value="owner_payout">Owner Payout</Option>
              <Option value="other">Other</Option>
            </Select>
          </Form.Item>
          <Form.Item name="date" label="Date" initialValue={dayjs()} rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="propertyId" label="Property">
            <Select
              placeholder="Optional: Select a property"
              showSearch
              allowClear
              notFoundContent={properties.length === 0 ? 'No properties available' : undefined}
              filterOption={(input, option) =>
                String(option?.label ?? '')
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
              onChange={(value) => {
                setSelectedPropertyId(value);
                form.setFieldsValue({ bookingId: undefined });
              }}
              options={properties.map((p) => ({
                value: p.id,
                label: `${p.name} (${p.code})`,
              }))}
            />
          </Form.Item>
          <Form.Item name="bookingId" label="Booking">
            <Select
              placeholder="Optional: Select a booking"
              showSearch
              allowClear
              disabled={!selectedPropertyId}
              notFoundContent={
                !selectedPropertyId
                  ? 'Please select a property first'
                  : bookings.length === 0
                    ? 'No bookings available'
                    : undefined
              }
              filterOption={(input, option) =>
                String(option?.label ?? '')
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
              options={bookings.map((b) => ({
                value: b.id,
                label: `${b.reference}${b.guestId ? ` - ${b.guestId}` : ''}`,
              }))}
            />
          </Form.Item>
          <Form.Item name="status" label="Status" initialValue="paid">
            <Select placeholder="Select status">
              <Option value="paid">Paid</Option>
              <Option value="pending">Pending</Option>
            </Select>
          </Form.Item>
          <Form.Item name="paymentMethod" label="Payment Method">
            <Input placeholder="e.g., Cash, Card, Bank Transfer" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default FinancePage;
