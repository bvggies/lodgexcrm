import React, { useEffect, useState } from 'react';
import {
  Card,
  Typography,
  Button,
  Space,
  Table,
  Tag,
  Switch,
  Modal,
  Form,
  Select,
  Input,
  message,
  Popconfirm,
  Descriptions,
  Alert,
} from 'antd';
import {
  RobotOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  MinusCircleOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { automationsApi, Automation } from '../../services/api/automationsApi';

const { Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const AutomationsPage: React.FC = () => {
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingAutomation, setEditingAutomation] = useState<Automation | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadAutomations();
  }, []);

  const loadAutomations = async () => {
    try {
      setLoading(true);
      const response = await automationsApi.getAll();
      setAutomations(response.data.data);
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to load automations');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (automation: Automation, checked: boolean) => {
    try {
      setLoading(true);
      await automationsApi.update(automation.id, { enabled: checked });
      message.success(`Automation ${checked ? 'activated' : 'deactivated'}`);
      loadAutomations();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to toggle automation');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setLoading(true);
      await automationsApi.delete(id);
      message.success('Automation deleted successfully');
      loadAutomations();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to delete automation');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);
      const automationData = {
        name: values.name,
        description: values.description,
        trigger: values.trigger,
        conditions: values.conditions || null,
        actions: values.actions || [{ type: values.action, params: {} }],
        enabled: values.enabled !== undefined ? values.enabled : true,
      };

      if (editingAutomation) {
        await automationsApi.update(editingAutomation.id, automationData);
        message.success('Automation updated');
      } else {
        await automationsApi.create(automationData);
        message.success('Automation created');
      }
      setIsModalVisible(false);
      form.resetFields();
      loadAutomations();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleTestTrigger = async (trigger: string) => {
    try {
      const response = await automationsApi.trigger(trigger);
      message.success(`Triggered ${response.data.data.triggered} automation(s)`);
      if (response.data.data.errors.length > 0) {
        message.warning(`Some errors occurred: ${response.data.data.errors.join(', ')}`);
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to trigger automation');
    }
  };

  const columns: ColumnsType<Automation> = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Trigger',
      dataIndex: 'trigger',
      key: 'trigger',
      render: (trigger: string) => <Tag color="blue">{trigger}</Tag>,
    },
    {
      title: 'Actions',
      dataIndex: 'actions',
      key: 'actions',
      render: (actions: Array<{ type: string; params?: any }>) => (
        <Space wrap>
          {actions.map((action, idx) => (
            <Tag key={idx} color="green">
              {action.type}
            </Tag>
          ))}
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'enabled',
      key: 'enabled',
      render: (enabled: boolean) => (
        <Tag color={enabled ? 'green' : 'default'}>{enabled ? 'Active' : 'Inactive'}</Tag>
      ),
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Switch
            checked={record.enabled}
            onChange={(checked) => handleToggle(record, checked)}
            checkedChildren={<PlayCircleOutlined />}
            unCheckedChildren={<PauseCircleOutlined />}
          />
          <Button
            type="link"
            icon={<ThunderboltOutlined />}
            onClick={() => handleTestTrigger(record.trigger)}
            size="small"
          >
            Test
          </Button>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            Edit
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this automation?"
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
    setEditingAutomation(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (automation: Automation) => {
    setEditingAutomation(automation);
    form.setFieldsValue({
      name: automation.name,
      description: automation.description,
      trigger: automation.trigger,
      conditions: automation.conditions,
      actions: automation.actions.length > 0 ? automation.actions : [{ type: '', params: {} }],
      enabled: automation.enabled,
    });
    setIsModalVisible(true);
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
          <RobotOutlined /> Automations
        </Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          Create Automation
        </Button>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={automations}
          loading={loading}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          expandable={{
            expandedRowRender: (record) => (
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Description">
                  {record.description || 'No description'}
                </Descriptions.Item>
                <Descriptions.Item label="Trigger Event">{record.trigger}</Descriptions.Item>
                <Descriptions.Item label="Actions">
                  {record.actions.map((action, idx) => (
                    <div key={idx} style={{ marginBottom: 8 }}>
                      <Tag color="green">{action.type}</Tag>
                      {action.params && Object.keys(action.params).length > 0 && (
                        <span style={{ marginLeft: 8, fontSize: '12px', color: '#666' }}>
                          {JSON.stringify(action.params)}
                        </span>
                      )}
                    </div>
                  ))}
                </Descriptions.Item>
                {record.conditions && (
                  <Descriptions.Item label="Conditions">
                    <pre style={{ fontSize: '12px', margin: 0 }}>
                      {JSON.stringify(record.conditions, null, 2)}
                    </pre>
                  </Descriptions.Item>
                )}
              </Descriptions>
            ),
          }}
        />
      </Card>

      <Modal
        title={editingAutomation ? 'Edit Automation' : 'Create Automation'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onOk={() => form.submit()}
        width={700}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="name"
            label="Automation Name"
            rules={[{ required: true, message: 'Please enter automation name' }]}
          >
            <Input placeholder="e.g., Auto-create cleaning task on checkout" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <TextArea rows={2} placeholder="Describe what this automation does..." />
          </Form.Item>
          <Form.Item
            name="trigger"
            label="Trigger Event"
            rules={[{ required: true, message: 'Please select a trigger' }]}
          >
            <Select placeholder="Select trigger event">
              <Option value="booking.created">Booking Created</Option>
              <Option value="booking.checkout">Booking Checkout</Option>
              <Option value="booking.checkin">Booking Check-in</Option>
              <Option value="scheduled.daily">Scheduled Daily</Option>
              <Option value="scheduled.monthly">Scheduled Monthly</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="actions"
            label="Actions"
            rules={[{ required: true, message: 'Please add at least one action' }]}
          >
            <Form.List name="actions" initialValue={[{ type: '', params: {} }]}>
              {(fields, { add, remove }) => (
                <>
                  {fields.map((field, index) => (
                    <Space
                      key={field.key}
                      style={{ display: 'flex', marginBottom: 8 }}
                      align="baseline"
                    >
                      <Form.Item
                        {...field}
                        name={[field.name, 'type']}
                        rules={[{ required: true, message: 'Action type required' }]}
                        style={{ marginBottom: 0 }}
                      >
                        <Select placeholder="Action type" style={{ width: 200 }}>
                          <Option value="create_cleaning_task">Create Cleaning Task</Option>
                          <Option value="send_email">Send Email</Option>
                          <Option value="send_checkin_email">Send Check-in Email</Option>
                          <Option value="send_checkout_email">Send Check-out Email</Option>
                          <Option value="create_maintenance_reminder">
                            Create Maintenance Reminder
                          </Option>
                        </Select>
                      </Form.Item>
                      <Form.Item
                        {...field}
                        name={[field.name, 'params']}
                        style={{ marginBottom: 0 }}
                        normalize={(value) => {
                          if (!value) return {};
                          try {
                            return typeof value === 'string' ? JSON.parse(value) : value;
                          } catch {
                            return value;
                          }
                        }}
                        getValueFromEvent={(e) => {
                          const val = e.target.value;
                          if (!val) return {};
                          try {
                            return JSON.parse(val);
                          } catch {
                            return val;
                          }
                        }}
                      >
                        <Input
                          placeholder='Params (JSON, e.g. {"key": "value"})'
                          style={{ width: 250 }}
                        />
                      </Form.Item>
                      {fields.length > 1 && (
                        <Button
                          type="text"
                          icon={<MinusCircleOutlined />}
                          onClick={() => remove(field.name)}
                          danger
                        />
                      )}
                    </Space>
                  ))}
                  <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                    Add Action
                  </Button>
                </>
              )}
            </Form.List>
          </Form.Item>
          <Alert
            message="Note"
            description="Actions will be executed in order when the trigger event occurs. Use JSON format for action parameters."
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
          <Form.Item name="enabled" label="Active" valuePropName="checked" initialValue={true}>
            <Switch checkedChildren="Enabled" unCheckedChildren="Disabled" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AutomationsPage;
