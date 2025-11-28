import React, { useEffect, useState } from 'react';
import { Table, Tag, Space, Button, message, Card } from 'antd';
import { PhoneOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { twilioApi, CallHistory } from '../../services/api/twilioApi';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

interface CallHistoryProps {
  guestId?: string;
  onCall?: (phoneNumber: string) => void;
}

const CallHistoryComponent: React.FC<CallHistoryProps> = ({ guestId, onCall }) => {
  const [calls, setCalls] = useState<CallHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadCallHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guestId]);

  const loadCallHistory = async () => {
    try {
      setLoading(true);
      const response = await twilioApi.getCallHistory({ guestId, limit: 50 });
      setCalls(response.data.data.calls);
      setTotal(response.data.data.total);
    } catch (error: any) {
      message.error('Failed to load call history');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'green';
      case 'failed':
      case 'busy':
      case 'no-answer':
        return 'red';
      case 'in-progress':
      case 'ringing':
        return 'blue';
      default:
        return 'default';
    }
  };

  const columns: ColumnsType<CallHistory> = [
    {
      title: 'Date/Time',
      key: 'startedAt',
      render: (_, record) => dayjs(record.startedAt).format('MMM DD, YYYY HH:mm'),
      sorter: (a, b) => dayjs(a.startedAt).valueOf() - dayjs(b.startedAt).valueOf(),
    },
    {
      title: 'Phone Number',
      dataIndex: 'phoneNumber',
      key: 'phoneNumber',
    },
    {
      title: 'Direction',
      dataIndex: 'direction',
      key: 'direction',
      render: (direction: string) => (
        <Tag color={direction === 'outbound' ? 'blue' : 'green'}>{direction.toUpperCase()}</Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <Tag color={getStatusColor(status)}>{status.toUpperCase()}</Tag>,
    },
    {
      title: 'Duration',
      key: 'duration',
      render: (_, record) => formatDuration(record.duration),
    },
    {
      title: 'Guest',
      key: 'guest',
      render: (_, record) =>
        record.guest ? `${record.guest.firstName} ${record.guest.lastName}` : 'N/A',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          {onCall && (
            <Button type="link" icon={<PhoneOutlined />} onClick={() => onCall(record.phoneNumber)}>
              Call Again
            </Button>
          )}
          {record.recordingUrl && (
            <Button
              type="link"
              icon={<PlayCircleOutlined />}
              onClick={() => window.open(record.recordingUrl, '_blank')}
            >
              Play Recording
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Card title="Call History" style={{ marginTop: 16 }}>
      <Table
        columns={columns}
        dataSource={calls}
        loading={loading}
        rowKey="id"
        pagination={{
          total,
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} calls`,
        }}
      />
    </Card>
  );
};

export default CallHistoryComponent;
