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
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';
import { cleaningApi, CleaningTask } from '../../services/api/cleaningApi';
import { propertiesApi, Property } from '../../services/api/propertiesApi';
import { unitsApi, Unit } from '../../services/api/unitsApi';
import { bookingsApi, Booking } from '../../services/api/bookingsApi';
import { staffApi } from '../../services/api/staffApi';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { addNotification } from '../../store/slices/notificationsSlice';

const { Title } = Typography;
const { Option } = Select;

const CleaningTasksPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const isManagerOrAdmin = user?.role === 'admin' || user?.role === 'assistant';
  const isCleaner = user?.role === 'cleaner';

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

      // If user is cleaner, only show their assigned tasks
      if (isCleaner && user?.id) {
        params.assignedToId = user.id;
      }

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
      render: (cost?: any) => {
        if (!cost) return '-';
        const numCost = typeof cost === 'number' ? cost : parseFloat(cost) || 0;
        return `${numCost.toFixed(2)} AED`;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => {
        const canEdit = isManagerOrAdmin || (isCleaner && record.cleanerId === user?.id);
        const canDelete = isManagerOrAdmin;

        return (
          <Space>
            {record.status !== 'completed' && canEdit && (
              <Button
                type="link"
                icon={<CheckCircleOutlined />}
                onClick={() => handleComplete(record.id)}
              >
                {record.status === 'not_started' ? 'Start' : 'Complete'}
              </Button>
            )}
            {canEdit && (
              <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
                Edit
              </Button>
            )}
            {canDelete && (
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
            )}
          </Space>
        );
      },
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
      const task = tasks.find((t) => t.id === id);
      const newStatus = task?.status === 'not_started' ? 'in_progress' : 'completed';

      await cleaningApi.update(id, { status: newStatus });
      message.success(
        `Cleaning task ${newStatus === 'in_progress' ? 'started' : 'completed'} successfully`
      );

      // Add notification
      dispatch(
        addNotification({
          type: 'success',
          title: 'Task Status Updated',
          message: `Cleaning task has been ${newStatus === 'in_progress' ? 'started' : 'completed'}`,
          link: '/cleaning',
        })
      );

      loadTasks();
    } catch (error: any) {
      message.error(error.response?.data?.error?.message || 'Failed to update task');
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
        const oldStatus = editingTask.status;
        await cleaningApi.update(editingTask.id, submitData);
        message.success('Cleaning task updated successfully');

        // Add notification if status changed
        if (values.status && values.status !== oldStatus) {
          dispatch(
            addNotification({
              type: 'info',
              title: 'Task Status Updated',
              message: `Cleaning task status changed from ${oldStatus} to ${values.status}`,
              link: '/cleaning',
            })
          );
        }
      } else {
        await cleaningApi.create(submitData);
        message.success('Cleaning task created successfully');

        // Add notification for new task
        dispatch(
          addNotification({
            type: 'success',
            title: 'New Cleaning Task',
            message: `A new cleaning task has been created${values.cleanerId ? ' and assigned to you' : ''}`,
            link: '/cleaning',
          })
        );
      }
      setIsModalVisible(false);
      loadTasks();
    } catch (error: any) {
      message.error(error.response?.data?.error?.message || 'Operation failed');
    }
  };

  return (
    <div>
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
        {isManagerOrAdmin && (
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            Add Task
          </Button>
        )}
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

      <div>
        <Table
          columns={columns}
          dataSource={tasks}
          loading={loading}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </div>

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
              getPopupContainer={() => document.body}
              notFoundContent={properties.length === 0 ? 'No properties available' : undefined}
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
              notFoundContent={
                !selectedPropertyId
                  ? 'Please select a property first'
                  : units.length === 0
                    ? 'No units available'
                    : undefined
              }
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
              getPopupContainer={() => document.body}
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
              disabled={!selectedPropertyId}
            >
              {bookings.map((b) => (
                <Option key={b.id} value={b.id} label={b.reference}>
                  {b.reference} - {b.guestId || 'N/A'}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="scheduledDate"
            label="Scheduled Date"
            rules={[{ required: true, message: 'Please select scheduled date' }]}
          >
            <DatePicker
              showTime
              style={{ width: '100%' }}
              format="YYYY-MM-DD HH:mm"
              getPopupContainer={() => document.body}
            />
          </Form.Item>
          <Form.Item
            name="cleanerId"
            label="Assigned Cleaner"
            tooltip={!isManagerOrAdmin ? 'Only managers and admins can assign tasks' : undefined}
          >
            <Select
              placeholder="Optional: Select a cleaner"
              showSearch
              getPopupContainer={() => document.body}
              disabled={!isManagerOrAdmin}
              notFoundContent={staff.length === 0 ? 'No cleaners available' : undefined}
              filterOption={(input, option) =>
                String(option?.label ?? '')
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
            >
              {staff.map((s: any) => (
                <Option key={s.id} value={s.id} label={`${s.name} (Cleaner)`}>
                  {s.name} (Cleaner)
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="status" label="Status" initialValue="not_started">
            <Select getPopupContainer={() => document.body}>
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
