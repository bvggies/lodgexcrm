import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
} from 'antd';
import { ArrowLeftOutlined, DownloadOutlined, DollarOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';
import { ownersApi } from '../../services/api/ownersApi';
import GlassCard from '../../components/animations/GlassCard';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

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
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [data, setData] = useState<StatementData | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>(dayjs().format('YYYY-MM'));

  useEffect(() => {
    if (id) {
      loadStatements();
    }
  }, [id, selectedMonth]);

  const loadStatements = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const response = await ownersApi.getStatements(id, { month: selectedMonth });
      setData(response.data.data);
    } catch (error: any) {
      message.error(error.response?.data?.error?.message || 'Failed to load statements');
    } finally {
      setLoading(false);
    }
  };

  const handleMonthChange = (date: dayjs.Dayjs | null) => {
    if (date) {
      setSelectedMonth(date.format('YYYY-MM'));
    }
  };

  const handleExportPDF = async () => {
    if (!id) return;
    try {
      setExporting(true);
      const params: any = {};
      if (selectedMonth) {
        params.month = selectedMonth;
      }
      const response = await ownersApi.exportStatementPDF(id, params);

      // Create blob and download
      const blob = new Blob([response.data], {
        type: 'application/pdf',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const filename = `statement-${selectedMonth || 'current'}.pdf`;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      message.success('PDF downloaded successfully');
    } catch (error: any) {
      message.error('Failed to export PDF');
      console.error('Failed to export PDF:', error);
    } finally {
      setExporting(false);
    }
  };

  const columns: ColumnsType<StatementRecord> = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => dayjs(date).format('MMM DD, YYYY'),
      sorter: (a, b) => dayjs(a.date).unix() - dayjs(b.date).unix(),
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
      title: 'Booking',
      key: 'booking',
      render: (_, record) => record.booking?.reference || '-',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number, record) => {
        const numAmount = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
        return (
          <Text strong style={{ color: record.type === 'revenue' ? '#3f8600' : '#cf1322' }}>
            {record.type === 'revenue' ? '+' : '-'}AED {numAmount.toFixed(2)}
          </Text>
        );
      },
      align: 'right',
    },
  ];

  if (!data) {
    return (
      <div>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/owners')}>
          Back to Owners
        </Button>
      </div>
    );
  }

  return (
    <div>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/owners')}>
              Back to Owners
            </Button>
            <Title level={2} style={{ margin: 0 }}>
              Statements - {data.owner.name}
            </Title>
          </Space>
          <Space>
            <DatePicker
              picker="month"
              value={dayjs(selectedMonth)}
              onChange={handleMonthChange}
              format="MMMM YYYY"
            />
            <Button
              icon={<DownloadOutlined />}
              type="primary"
              onClick={handleExportPDF}
              loading={exporting}
            >
              Download PDF
            </Button>
          </Space>
        </div>

        <Descriptions bordered column={{ xs: 1, sm: 2, md: 3 }} style={{ marginBottom: 24 }}>
          <Descriptions.Item label="Period">
            {dayjs(data.period.start).format('MMM DD, YYYY')} -{' '}
            {dayjs(data.period.end).format('MMM DD, YYYY')}
          </Descriptions.Item>
          <Descriptions.Item label="Total Records">{data.records.length}</Descriptions.Item>
        </Descriptions>

        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={8}>
            <GlassCard index={0} glowColor="rgba(16, 185, 129, 0.2)">
              <Statistic
                title="Total Revenue"
                value={data.summary.revenue}
                prefix="AED "
                precision={2}
                valueStyle={{ color: '#3f8600' }}
              />
            </GlassCard>
          </Col>
          <Col xs={24} sm={8}>
            <GlassCard index={1} glowColor="rgba(239, 68, 68, 0.2)">
              <Statistic
                title="Total Expenses"
                value={data.summary.expenses}
                prefix="AED "
                precision={2}
                valueStyle={{ color: '#cf1322' }}
              />
            </GlassCard>
          </Col>
          <Col xs={24} sm={8}>
            <GlassCard
              index={2}
              glowColor={
                data.summary.netIncome >= 0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'
              }
            >
              <Statistic
                title="Net Income"
                value={data.summary.netIncome}
                prefix="AED "
                precision={2}
                valueStyle={{
                  color: data.summary.netIncome >= 0 ? '#3f8600' : '#cf1322',
                }}
              />
            </GlassCard>
          </Col>
        </Row>

        <GlassCard index={3} glowColor="rgba(102, 126, 234, 0.2)" title="Statement Details">
          <Table
            columns={columns}
            dataSource={data.records}
            loading={loading}
            rowKey="id"
            pagination={{ pageSize: 20 }}
          />
        </GlassCard>
      </Space>
    </div>
  );
};

export default OwnerStatementsPage;
