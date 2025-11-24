import React, { useEffect, useState } from 'react';
import {
  Card,
  Table,
  Typography,
  Button,
  Space,
  Statistic,
  Row,
  Col,
  DatePicker,
  message,
  Tag,
  Descriptions,
  Select,
} from 'antd';
import { DownloadOutlined, DollarOutlined, ReloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';
import { ownersApi } from '../../services/api/ownersApi';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

interface StatementRecord {
  id: string;
  type: 'revenue' | 'expense';
  amount: number;
  description: string;
  date: string;
  property: {
    id: string;
    name: string;
    code: string;
  };
  booking: {
    id: string;
    reference: string;
  } | null;
}

interface StatementData {
  owner: {
    id: string;
    name: string;
  };
  period: {
    start: string;
    end: string;
  };
  summary: {
    revenue: number;
    expenses: number;
    netIncome: number;
  };
  records: StatementRecord[];
}

const OwnerStatementsPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<StatementData | null>(null);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [month, setMonth] = useState<string | null>(null);

  useEffect(() => {
    loadStatements();
  }, [month, dateRange]);

  const loadStatements = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (month) {
        params.month = month;
      } else if (dateRange) {
        params.startDate = dateRange[0].format('YYYY-MM-DD');
        params.endDate = dateRange[1].format('YYYY-MM-DD');
      }
      const response = await ownersApi.getMyStatements(params);
      setData(response.data.data);
    } catch (error: any) {
      message.error('Failed to load statements');
      console.error('Failed to load statements:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMonthChange = (value: string) => {
    setMonth(value);
    setDateRange(null);
  };

  const handleDateRangeChange = (
    dates: [dayjs.Dayjs | null, dayjs.Dayjs | null] | null,
    dateStrings: [string, string]
  ) => {
    if (dates && dates[0] && dates[1]) {
      setDateRange([dates[0], dates[1]]);
      setMonth(null);
    } else {
      setDateRange(null);
    }
  };

  const handleExport = () => {
    message.info('Export functionality coming soon');
  };

  const columns: ColumnsType<StatementRecord> = [
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
      title: 'Property',
      key: 'property',
      render: (_, record) => record.property?.name || 'N/A',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Booking Reference',
      key: 'booking',
      render: (_, record) => record.booking?.reference || 'N/A',
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number, record) => (
        <Text style={{ color: record.type === 'revenue' ? '#52c41a' : '#ff4d4f' }}>
          {record.type === 'revenue' ? '+' : '-'}AED {amount.toLocaleString()}
        </Text>
      ),
      align: 'right',
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>
          Financial Statements
        </Title>
      </div>

      <Card style={{ marginBottom: 24 }}>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Space>
            <Text strong>Filter by:</Text>
            <Select
              placeholder="Select Month"
              style={{ width: 200 }}
              value={month}
              onChange={handleMonthChange}
              allowClear
            >
              {Array.from({ length: 12 }, (_, i) => {
                const date = dayjs().subtract(i, 'month');
                return (
                  <Option key={date.format('YYYY-MM')} value={date.format('YYYY-MM')}>
                    {date.format('MMMM YYYY')}
                  </Option>
                );
              })}
            </Select>
            <Text>OR</Text>
            <RangePicker value={dateRange} onChange={handleDateRangeChange} format="YYYY-MM-DD" />
            <Button icon={<ReloadOutlined />} onClick={loadStatements} loading={loading}>
              Refresh
            </Button>
            <Button icon={<DownloadOutlined />} onClick={handleExport}>
              Export
            </Button>
          </Space>
        </Space>
      </Card>

      {data && (
        <>
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic
                  title="Total Revenue"
                  value={data.summary.revenue}
                  prefix={<DollarOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                  precision={2}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic
                  title="Total Expenses"
                  value={data.summary.expenses}
                  prefix={<DollarOutlined />}
                  valueStyle={{ color: '#ff4d4f' }}
                  precision={2}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic
                  title="Net Income"
                  value={data.summary.netIncome}
                  prefix={<DollarOutlined />}
                  valueStyle={{
                    color: data.summary.netIncome >= 0 ? '#52c41a' : '#ff4d4f',
                  }}
                  precision={2}
                />
              </Card>
            </Col>
          </Row>

          <Card>
            <Descriptions title="Period" bordered style={{ marginBottom: 16 }}>
              <Descriptions.Item label="Start Date">
                {dayjs(data.period.start).format('MMMM DD, YYYY')}
              </Descriptions.Item>
              <Descriptions.Item label="End Date">
                {dayjs(data.period.end).format('MMMM DD, YYYY')}
              </Descriptions.Item>
            </Descriptions>

            <Table
              columns={columns}
              dataSource={data.records}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 20 }}
            />
          </Card>
        </>
      )}
    </div>
  );
};

export default OwnerStatementsPage;
