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
  Input,
  InputNumber,
  message,
  Popconfirm,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import type { ColumnsType } from 'antd/es/table';
import { maintenanceApi, MaintenanceTask } from '../../services/api/maintenanceApi';
import { propertiesApi, Property } from '../../services/api/propertiesApi';
import { unitsApi, Unit } from '../../services/api/unitsApi';
import { staffApi } from '../../services/api/staffApi';
import FadeIn from '../../components/animations/FadeIn';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { addNotification } from '../../store/slices/notificationsSlice';

const { Title } = Typography;
const { Option } = Select;

const MaintenanceTasksPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const isManagerOrAdmin = user?.role === 'admin' || user?.role === 'assistant';
  const isMaintenance = user?.role === 'maintenance';

  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [priorityFilter, setPriorityFilter] = useState<string | undefined>();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<MaintenanceTask | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | undefined>();
  const [form] = Form.useForm();

  useEffect(() => {
    loadTasks();
    loadProperties();
    loadStaff();
  }, [statusFilter, priorityFilter]);

  useEffect(() => {
    if (selectedPropertyId) {
      loadUnits(selectedPropertyId);
    } else {
      setUnits([]);
    }
  }, [selectedPropertyId]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;

      // If user is maintenance, only show their assigned tasks
      if (isMaintenance && user?.id) {
        params.assignedToId = user.id;
      }

      const response = await maintenanceApi.getAll(params);
      setTasks(response.data.data.tasks);
    } catch (error) {
      message.error('Failed to load maintenance tasks');
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

  const loadStaff = async () => {
    try {
      const response = await staffApi.getAll({ role: 'maintenance' });
      setStaff(response.data.data.staff);
    } catch (error) {
      console.error('Failed to load staff');
    }
  };

  const columns: ColumnsType<MaintenanceTask> = [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => type.toUpperCase(),
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority: string) => {
        const colors: Record<string, string> = {
          low: 'default',
          medium: 'blue',
          high: 'orange',
          urgent: 'red',
        };
        return <Tag color={colors[priority] || 'default'}>{priority.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colors: Record<string, string> = {
          open: 'default',
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
        const canEdit = isManagerOrAdmin || (isMaintenance && record.assignedToId === user?.id);
        const canDelete = isManagerOrAdmin;

        return (
          <Space>
            {record.status !== 'completed' && canEdit && (
              <Button
                type="link"
                icon={<CheckCircleOutlined />}
                onClick={() => handleResolve(record.id)}
              >
                {record.status === 'open' ? 'Start' : 'Resolve'}
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

  const handleEdit = (task: MaintenanceTask) => {
    setEditingTask(task);
    setSelectedPropertyId(task.propertyId);
    form.setFieldsValue(task);
    setIsModalVisible(true);
  };

  const handleResolve = async (id: string) => {
    try {
      const task = tasks.find((t) => t.id === id);
      const newStatus = task?.status === 'open' ? 'in_progress' : 'completed';

      await maintenanceApi.update(id, { status: newStatus });
      message.success(
        `Maintenance task ${newStatus === 'in_progress' ? 'started' : 'resolved'} successfully`
      );

      // Add notification
      dispatch(
        addNotification({
          type: 'success',
          title: 'Task Status Updated',
          message: `Maintenance task has been ${newStatus === 'in_progress' ? 'started' : 'resolved'}`,
          link: '/maintenance',
        })
      );

      loadTasks();
    } catch (error: any) {
      message.error(error.response?.data?.error?.message || 'Failed to update task');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await maintenanceApi.delete(id);
      message.success('Maintenance task deleted successfully');
      loadTasks();
    } catch (error: any) {
      message.error(error.response?.data?.error?.message || 'Failed to delete task');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editingTask) {
        const oldStatus = editingTask.status;
        await maintenanceApi.update(editingTask.id, values);
        message.success('Maintenance task updated successfully');

        // Add notification if status changed
        if (values.status && values.status !== oldStatus) {
          dispatch(
            addNotification({
              type: 'info',
              title: 'Task Status Updated',
              message: `Maintenance task status changed from ${oldStatus} to ${values.status}`,
              link: '/maintenance',
            })
          );
        }
      } else {
        await maintenanceApi.create(values);
        message.success('Maintenance task created successfully');

        // Add notification for new task
        dispatch(
          addNotification({
            type: 'success',
            title: 'New Maintenance Task',
            message: `A new maintenance task has been created${values.assignedToId ? ' and assigned to you' : ''}`,
            link: '/maintenance',
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
            Maintenance Tasks
          </Title>
          {isManagerOrAdmin && (
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              Add Task
            </Button>
          )}
        </div>

        <Space style={{ marginBottom: 16 }}>
          <Select
            placeholder="Filter by status"
            style={{ width: 200 }}
            allowClear
            value={statusFilter}
            onChange={setStatusFilter}
            getPopupContainer={(trigger) => trigger.parentElement || document.body}
          >
            <Option value="open">Open</Option>
            <Option value="in_progress">In Progress</Option>
            <Option value="completed">Completed</Option>
          </Select>
          <Select
            placeholder="Filter by priority"
            style={{ width: 200 }}
            allowClear
            value={priorityFilter}
            onChange={setPriorityFilter}
            getPopupContainer={(trigger) => trigger.parentElement || document.body}
          >
            <Option value="low">Low</Option>
            <Option value="medium">Medium</Option>
            <Option value="high">High</Option>
            <Option value="urgent">Urgent</Option>
          </Select>
        </Space>
      </FadeIn>

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
        title={editingTask ? 'Edit Maintenance Task' : 'Create Maintenance Task'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onOk={() => form.submit()}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="title" label="Title" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item
            name="propertyId"
            label="Property"
            rules={[{ required: true, message: 'Please select a property' }]}
          >
            <Select
              placeholder="Select a property"
              showSearch
              getPopupContainer={(trigger) => trigger.parentElement || document.body}
              notFoundContent={properties.length === 0 ? 'No properties available' : undefined}
              filterOption={(input, option) =>
                String(option?.label ?? '')
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
              onChange={(value) => {
                setSelectedPropertyId(value);
                form.setFieldsValue({ unitId: undefined });
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
          <Form.Item name="type" label="Type" rules={[{ required: true }]}>
            <Select getPopupContainer={(trigger) => trigger.parentElement || document.body}>
              <Option value="ac">AC</Option>
              <Option value="plumbing">Plumbing</Option>
              <Option value="electrical">Electrical</Option>
              <Option value="appliance">Appliance</Option>
              <Option value="other">Other</Option>
            </Select>
          </Form.Item>
          <Form.Item name="priority" label="Priority" initialValue="medium">
            <Select getPopupContainer={(trigger) => trigger.parentElement || document.body}>
              <Option value="low">Low</Option>
              <Option value="medium">Medium</Option>
              <Option value="high">High</Option>
              <Option value="urgent">Urgent</Option>
            </Select>
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={4} placeholder="Describe the maintenance issue..." />
          </Form.Item>
          <Form.Item
            name="assignedToId"
            label="Assigned To"
            tooltip={!isManagerOrAdmin ? 'Only managers and admins can assign tasks' : undefined}
          >
            <Select
              placeholder="Optional: Select staff member"
              showSearch
              getPopupContainer={(trigger) => trigger.parentElement || document.body}
              disabled={!isManagerOrAdmin}
              notFoundContent={staff.length === 0 ? 'No maintenance staff available' : undefined}
              filterOption={(input, option) =>
                String(option?.label ?? '')
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
            >
              {staff.map((s) => (
                <Option key={s.id} value={s.id} label={`${s.name} (Maintenance)`}>
                  {s.name} (Maintenance)
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="status" label="Status" initialValue="open">
            <Select getPopupContainer={(trigger) => trigger.parentElement || document.body}>
              <Option value="open">Open</Option>
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

export default MaintenanceTasksPage;
