import React, { useEffect, useState } from 'react';
import {
  Table,
  Typography,
  Select,
  DatePicker,
  Input,
  Tag,
  Space,
  Button,
  Modal,
  Descriptions,
} from 'antd';
import { SearchOutlined, ReloadOutlined, EyeOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';
import { auditApi, AuditLog } from '../../services/api/auditApi';
import FadeIn from '../../components/animations/FadeIn';

const { Title } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const AuditLogPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionFilter, setActionFilter] = useState<string | undefined>();
  const [tableFilter, setTableFilter] = useState<string | undefined>();
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });

  useEffect(() => {
    loadLogs();
  }, [actionFilter, tableFilter, dateRange, pagination.current, pagination.pageSize]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const params: any = {
        limit: pagination.pageSize,
        offset: (pagination.current - 1) * pagination.pageSize,
      };
      if (actionFilter) params.action = actionFilter;
      if (tableFilter) params.tableName = tableFilter;
      if (dateRange) {
        params.startDate = dateRange[0].toISOString();
        params.endDate = dateRange[1].toISOString();
      }

      const response = await auditApi.getAll(params);
      setLogs(response.data.data.logs);
      setPagination((prev) => ({
        ...prev,
        total: response.data.pagination.total,
      }));
    } catch (error) {
      console.error('Failed to load audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns: ColumnsType<AuditLog> = [
    {
      title: 'Timestamp',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (timestamp: string) => dayjs(timestamp).format('MMM DD, YYYY HH:mm:ss'),
      sorter: (a, b) => dayjs(a.timestamp).unix() - dayjs(b.timestamp).unix(),
    },
    {
      title: 'User',
      key: 'user',
      render: (_, record) =>
        record.user ? `${record.user.firstName} ${record.user.lastName}` : record.userId,
    },
    {
      title: 'Action',
      dataIndex: 'action',
      key: 'action',
      render: (action: string) => {
        const colors: Record<string, string> = {
          create: 'green',
          update: 'blue',
          delete: 'red',
        };
        return <Tag color={colors[action] || 'default'}>{action.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Table',
      dataIndex: 'tableName',
      key: 'tableName',
    },
    {
      title: 'Record ID',
      dataIndex: 'recordId',
      key: 'recordId',
    },
    {
      title: 'Changes',
      dataIndex: 'changeSummary',
      key: 'changeSummary',
      render: (summary: any, record) =>
        summary ? (
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => {
              setSelectedLog(record);
              setDetailModalVisible(true);
            }}
          >
            View Details
          </Button>
        ) : (
          '-'
        ),
    },
  ];

  return (
    <div>
      <FadeIn>
        <Title level={2}>Audit Log</Title>

        <Space style={{ marginBottom: 16 }}>
          <Select
            placeholder="Filter by action"
            style={{ width: 150 }}
            allowClear
            value={actionFilter}
            onChange={setActionFilter}
          >
            <Option value="create">Create</Option>
            <Option value="update">Update</Option>
            <Option value="delete">Delete</Option>
          </Select>
          <Select
            placeholder="Filter by table"
            style={{ width: 200 }}
            allowClear
            value={tableFilter}
            onChange={setTableFilter}
          >
            <Option value="bookings">Bookings</Option>
            <Option value="guests">Guests</Option>
            <Option value="properties">Properties</Option>
            <Option value="owners">Owners</Option>
            <Option value="units">Units</Option>
            <Option value="staff">Staff</Option>
            <Option value="cleaningTask">Cleaning Tasks</Option>
            <Option value="maintenanceTask">Maintenance Tasks</Option>
            <Option value="financeRecord">Finance Records</Option>
          </Select>
          <RangePicker
            value={dateRange}
            onChange={(dates) => setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)}
          />
          <Button icon={<ReloadOutlined />} onClick={loadLogs}>
            Refresh
          </Button>
        </Space>
      </FadeIn>

      <Table
        columns={columns}
        dataSource={logs}
        loading={loading}
        rowKey="id"
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} logs`,
          onChange: (page, pageSize) => {
            setPagination((prev) => ({ ...prev, current: page, pageSize }));
          },
        }}
        scroll={{ x: 1000 }}
      />

      <Modal
        title="Audit Log Details"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            Close
          </Button>,
        ]}
        width={700}
      >
        {selectedLog && (
          <Descriptions column={1} bordered>
            <Descriptions.Item label="Timestamp">
              {dayjs(selectedLog.timestamp).format('MMMM DD, YYYY HH:mm:ss')}
            </Descriptions.Item>
            <Descriptions.Item label="User">
              {selectedLog.user
                ? `${selectedLog.user.firstName} ${selectedLog.user.lastName} (${selectedLog.user.email})`
                : selectedLog.userId}
            </Descriptions.Item>
            <Descriptions.Item label="Action">
              <Tag
                color={
                  selectedLog.action === 'create'
                    ? 'green'
                    : selectedLog.action === 'update'
                      ? 'blue'
                      : 'red'
                }
              >
                {selectedLog.action.toUpperCase()}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Table">{selectedLog.tableName}</Descriptions.Item>
            <Descriptions.Item label="Record ID">{selectedLog.recordId}</Descriptions.Item>
            <Descriptions.Item label="Change Summary">
              <pre
                style={{
                  background: '#f5f5f5',
                  padding: 12,
                  borderRadius: 4,
                  maxHeight: 300,
                  overflow: 'auto',
                }}
              >
                {JSON.stringify(selectedLog.changeSummary, null, 2)}
              </pre>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default AuditLogPage;
