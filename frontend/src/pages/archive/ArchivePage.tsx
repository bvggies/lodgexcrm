import React, { useEffect, useState } from 'react';
import {
  Card,
  Typography,
  Table,
  Button,
  Space,
  Tag,
  message,
  Popconfirm,
  Descriptions,
  Pagination,
} from 'antd';
import { motion } from 'framer-motion';
import {
  InboxOutlined,
  RestoreOutlined,
  DeleteOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { archiveApi, ArchivedBooking } from '../../services/api/archiveApi';
import dayjs from 'dayjs';
import FadeIn from '../../components/animations/FadeIn';

const { Title } = Typography;

const ArchivePage: React.FC = () => {
  const [bookings, setBookings] = useState<ArchivedBooking[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
  });

  useEffect(() => {
    loadArchivedBookings();
  }, [pagination.current, pagination.pageSize]);

  const loadArchivedBookings = async () => {
    try {
      setLoading(true);
      const offset = (pagination.current - 1) * pagination.pageSize;
      const response = await archiveApi.getArchivedBookings({
        limit: pagination.pageSize,
        offset,
      });
      setBookings(response.data.data.bookings);
      setTotal(response.data.count);
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to load archived bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (id: string) => {
    try {
      await archiveApi.restoreBooking(id);
      message.success('Booking restored successfully');
      loadArchivedBookings();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to restore booking');
    }
  };

  const handlePermanentDelete = async (id: string) => {
    try {
      await archiveApi.permanentlyDelete('bookings', id);
      message.success('Booking permanently deleted');
      loadArchivedBookings();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to delete booking');
    }
  };

  const columns: ColumnsType<ArchivedBooking> = [
    {
      title: 'Reference',
      dataIndex: 'reference',
      key: 'reference',
      render: (reference: string) => <Tag color="blue">{reference}</Tag>,
    },
    {
      title: 'Property',
      dataIndex: ['property', 'name'],
      key: 'property',
      render: (name: string, record: ArchivedBooking) => (
        <span>
          {name} <Tag color="default">{record.property.code}</Tag>
        </span>
      ),
    },
    {
      title: 'Guest',
      dataIndex: 'guest',
      key: 'guest',
      render: (guest: { firstName: string; lastName: string }) =>
        `${guest.firstName} ${guest.lastName}`,
    },
    {
      title: 'Check-in',
      dataIndex: 'checkinDate',
      key: 'checkinDate',
      render: (date: string) => dayjs(date).format('DD MMM YYYY'),
    },
    {
      title: 'Check-out',
      dataIndex: 'checkoutDate',
      key: 'checkoutDate',
      render: (date: string) => dayjs(date).format('DD MMM YYYY'),
    },
    {
      title: 'Amount',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amount: number, record: ArchivedBooking) =>
        `${amount.toFixed(2)} ${record.currency}`,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<RestoreOutlined />}
            onClick={() => handleRestore(record.id)}
          >
            Restore
          </Button>
          <Popconfirm
            title="Are you sure you want to permanently delete this booking?"
            description="This action cannot be undone."
            onConfirm={() => handlePermanentDelete(record.id)}
            okText="Yes, Delete"
            cancelText="Cancel"
            okType="danger"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <FadeIn>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <Title level={2} style={{ margin: 0 }}>
            <InboxOutlined /> Archive
          </Title>
          <Button onClick={loadArchivedBookings} loading={loading}>
            Refresh
          </Button>
        </div>
      </FadeIn>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
        <Table
          columns={columns}
          dataSource={bookings}
          loading={loading}
          rowKey="id"
          pagination={false}
          expandable={{
            expandedRowRender: (record) => (
              <Descriptions column={1} size="small" bordered>
                <Descriptions.Item label="Booking ID">{record.id}</Descriptions.Item>
                <Descriptions.Item label="Property">
                  {record.property.name} ({record.property.code})
                </Descriptions.Item>
                <Descriptions.Item label="Guest">
                  {record.guest.firstName} {record.guest.lastName}
                </Descriptions.Item>
                <Descriptions.Item label="Check-in Date">
                  {dayjs(record.checkinDate).format('DD MMM YYYY HH:mm')}
                </Descriptions.Item>
                <Descriptions.Item label="Check-out Date">
                  {dayjs(record.checkoutDate).format('DD MMM YYYY HH:mm')}
                </Descriptions.Item>
                <Descriptions.Item label="Total Amount">
                  {record.totalAmount.toFixed(2)} {record.currency}
                </Descriptions.Item>
                {record.notes && (
                  <Descriptions.Item label="Notes">
                    <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{record.notes}</pre>
                  </Descriptions.Item>
                )}
              </Descriptions>
            ),
          }}
        />
        <div style={{ marginTop: 16, textAlign: 'right' }}>
          <Pagination
            current={pagination.current}
            pageSize={pagination.pageSize}
            total={total}
            onChange={(page, pageSize) => {
              setPagination({ current: page, pageSize: pageSize || 20 });
            }}
            showSizeChanger
            showTotal={(total) => `Total ${total} archived bookings`}
          />
        </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default ArchivePage;

