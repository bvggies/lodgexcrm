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
  Popconfirm,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';
import { cleaningApi, CleaningTask } from '../../services/api/cleaningApi';
import { propertiesApi, Property } from '../../services/api/propertiesApi';
import { unitsApi, Unit } from '../../services/api/unitsApi';
import { bookingsApi, Booking } from '../../services/api/bookingsApi';
import { staffApi } from '../../services/api/staffApi';
import FadeIn from '../../components/animations/FadeIn';

const { Title } = Typography;
const { Option } = Select;

const CleaningTasksPage: React.FC = () => {
  const [tasks, setTasks] = useState<CleaningTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<CleaningTask | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | undefined>();
  const [form] = Form.useForm();

  useEffect(() => {
    loadTasks();
    loadProperties();
    loadStaff();
  }, [statusFilter]);

  useEffect(() => {
    if (selectedPropertyId) {
      loadUnits(selectedPropertyId);
      loadBookings(selectedPropertyId);
    } else {
      setUnits([]);
      setBookings([]);
    }
  }, [selectedPropertyId]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (statusFilter) params.status = statusFilter;

      const response = await cleaningApi.getAll(params);
      setTasks(response.data.data.tasks);
    } catch (error) {
      message.error('Failed to load cleaning tasks');
    } finally {
      setLoading(false);
    }
  };

  const loadProperties = async () => {
    try {
      const response = await propertiesApi.getAll({ status: 'active' });
      setProperties(response.data.data.properties);
    } catch (error) {
      console.error('Failed to load properties');
    }
  };

  const loadUnits = async (propertyId: string) => {
    try {
      const response = await unitsApi.getAll({ propertyId });
      setUnits(response.data.data.units);
    } catch (error) {
      console.error('Failed to load units');
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

  const loadStaff = async () => {
    try {
      const response = await staffApi.getAll({ role: 'cleaner' });
      setStaff(response.data.data.staff);
    } catch (error) {
      console.error('Failed to load staff');
    }
  };

  const columns: ColumnsType<CleaningTask> = [
    {
      title: 'Cleaning ID',
      dataIndex: 'cleaningId',
      key: 'cleaningId',
    },
    {
      title: 'Property',
      key: 'property',
      render: (_, record: any) => record.property?.name || 'N/A',
    },
    {
      title: 'Scheduled Date',
      dataIndex: 'scheduledDate',
      key: 'scheduledDate',
      render: (date: string) => dayjs(date).format('MMM DD, YYYY HH:mm'),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colors: Record<string, string> = {
          not_started: 'default',
          in_progress: 'processing',
          completed: 'success',
        };
        return (
          <Tag color={colors[status] || 'default'}>{status.replace('_', ' ').toUpperCase()}</Tag>
        );
      },
    },
    {
      title: 'Cost',
      dataIndex: 'cost',
      key: 'cost',
      render: (cost?: number) => (cost ? `${cost.toFixed(2)} AED` : '-'),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          {record.status !== 'completed' && (
            <Button
              type="link"
              icon={<CheckCircleOutlined />}
              onClick={() => handleComplete(record.id)}
            >
              Complete
            </Button>
          )}
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            Edit
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this task?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const handleCreate = () => {
    setEditingTask(null);
    setSelectedPropertyId(undefined);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (task: CleaningTask) => {
    setEditingTask(task);
    setSelectedPropertyId(task.propertyId);
    form.setFieldsValue({
      ...task,
      scheduledDate: dayjs(task.scheduledDate),
    });
    setIsModalVisible(true);
  };

  const handleComplete = async (id: string) => {
    try {
      await cleaningApi.complete(id, {});
      message.success('Cleaning task completed successfully');
      loadTasks();
    } catch (error: any) {
      message.error(error.response?.data?.error?.message || 'Failed to complete task');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await cleaningApi.delete(id);
      message.success('Cleaning task deleted successfully');
      loadTasks();
    } catch (error: any) {
      message.error(error.response?.data?.error?.message || 'Failed to delete task');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      const submitData = {
        ...values,
        scheduledDate: values.scheduledDate.toISOString(),
      };

      if (editingTask) {
        await cleaningApi.update(editingTask.id, submitData);
        message.success('Cleaning task updated successfully');
      } else {
        await cleaningApi.create(submitData);
        message.success('Cleaning task created successfully');
      }
      setIsModalVisible(false);
      loadTasks();
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
            Cleaning Tasks
          </Title>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            Add Task
          </Button>
        </div>

        <Select
          placeholder="Filter by status"
          style={{ width: 200, marginBottom: 16 }}
          allowClear
          value={statusFilter}
          onChange={setStatusFilter}
        >
          <Option value="not_started">Not Started</Option>
          <Option value="in_progress">In Progress</Option>
          <Option value="completed">Completed</Option>
        </Select>
      </FadeIn>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
        <Table
          columns={columns}
          dataSource={tasks}
          loading={loading}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </motion.div>

      <Modal
        title={editingTask ? 'Edit Cleaning Task' : 'Create Cleaning Task'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onOk={() => form.submit()}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="propertyId"
            label="Property"
            rules={[{ required: true, message: 'Please select a property' }]}
          >
            <Select
              placeholder="Select a property"
              showSearch
              filterOption={(input, option) =>
                String(option?.label ?? '')
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
              onChange={(value) => {
                setSelectedPropertyId(value);
                form.setFieldsValue({ unitId: undefined, bookingId: undefined });
              }}
            >
              {properties.map((p) => (
                <Option key={p.id} value={p.id} label={`${p.name} (${p.code})`}>
                  {p.name} ({p.code})
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="unitId" label="Unit">
            <Select
              placeholder="Optional: Select a unit"
              showSearch
              filterOption={(input, option) =>
                String(option?.label ?? '')
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
              disabled={!selectedPropertyId}
            >
              {units.map((u) => (
                <Option key={u.id} value={u.id} label={u.unitCode}>
                  {u.unitCode}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="bookingId" label="Booking">
            <Select
              placeholder="Optional: Select a booking"
              showSearch
              filterOption={(input, option) =>
                String(option?.label ?? '')
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
              disabled={!selectedPropertyId}
            >
              {bookings.map((b) => (
                <Option key={b.id} value={b.id} label={b.reference}>
                  {b.reference} - {b.guest ? `${b.guest.firstName} ${b.guest.lastName}` : 'N/A'}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="scheduledDate"
            label="Scheduled Date"
            rules={[{ required: true, message: 'Please select scheduled date' }]}
          >
            <DatePicker showTime style={{ width: '100%' }} format="YYYY-MM-DD HH:mm" />
          </Form.Item>
          <Form.Item name="cleanerId" label="Assigned Cleaner">
            <Select
              placeholder="Optional: Select a cleaner"
              showSearch
              filterOption={(input, option) =>
                String(option?.label ?? '')
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
            >
              {staff.map((s) => (
                <Option key={s.id} value={s.id} label={s.name}>
                  {s.name} ({s.role})
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="status" label="Status" initialValue="not_started">
            <Select>
              <Option value="not_started">Not Started</Option>
              <Option value="in_progress">In Progress</Option>
              <Option value="completed">Completed</Option>
            </Select>
          </Form.Item>
          <Form.Item name="cost" label="Cost (AED)">
            <InputNumber style={{ width: '100%' }} min={0} step={0.01} placeholder="0.00" />
          </Form.Item>
          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={3} placeholder="Additional notes..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CleaningTasksPage;
