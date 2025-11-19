import React, { useEffect, useState } from 'react';
import {
  Card,
  Typography,
  Button,
  Space,
  Tag,
  Switch,
  Descriptions,
  Modal,
  Form,
  Input,
  message,
  Divider,
  Alert,
  Table,
  Select,
  Spin,
} from 'antd';
import { motion } from 'framer-motion';
import {
  ApiOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  SettingOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { integrationsApi, Integration, IntegrationDetail } from '../../services/api/integrationsApi';
import { propertiesApi } from '../../services/api/propertiesApi';
import FadeIn from '../../components/animations/FadeIn';

const { Title, Text } = Typography;

const IntegrationsPage: React.FC = () => {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(false);
  const [configModalVisible, setConfigModalVisible] = useState(false);
  const [syncModalVisible, setSyncModalVisible] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [selectedIntegrationDetail, setSelectedIntegrationDetail] = useState<IntegrationDetail | null>(null);
  const [properties, setProperties] = useState<any[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [form] = Form.useForm();
  const [syncForm] = Form.useForm();

  useEffect(() => {
    loadIntegrations();
    loadProperties();
  }, []);

  const loadIntegrations = async () => {
    try {
      setLoading(true);
      const response = await integrationsApi.getStatus();
      setIntegrations(response.data.data);
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to load integrations');
    } finally {
      setLoading(false);
    }
  };

  const loadProperties = async () => {
    try {
      const response = await propertiesApi.getAll();
      setProperties(response.data.data);
    } catch (error) {
      console.error('Failed to load properties');
    }
  };

  const handleToggle = async (integration: Integration, checked: boolean) => {
    try {
      setLoading(true);
      await integrationsApi.configure(integration.type, { isActive: checked });
      message.success(`${integration.name} ${checked ? 'activated' : 'deactivated'}`);
      loadIntegrations();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to toggle integration');
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async (integration: Integration) => {
    setSelectedIntegration(integration);
    syncForm.resetFields();
    setSyncModalVisible(true);
  };

  const handleSyncSubmit = async (values: any) => {
    if (!selectedIntegration) return;

    try {
      setSyncing(true);
      const propertyMapping: Record<string, string> = {};
      
      // Build property mapping from form values
      if (values.mappings && Array.isArray(values.mappings)) {
        values.mappings.forEach((mapping: any) => {
          if (mapping.externalId && mapping.propertyId) {
            propertyMapping[mapping.externalId] = mapping.propertyId;
          }
        });
      }

      if (Object.keys(propertyMapping).length === 0) {
        message.warning('Please map at least one property');
        return;
      }

      let response;
      if (selectedIntegration.type === 'airbnb') {
        response = await integrationsApi.syncAirbnb(propertyMapping);
      } else {
        response = await integrationsApi.syncBookingCom(propertyMapping);
      }

      message.success(response.data.message || 'Sync completed successfully');
      setSyncModalVisible(false);
      loadIntegrations();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to sync integration');
    } finally {
      setSyncing(false);
    }
  };

  const handleConfigure = async (integration: Integration) => {
    setSelectedIntegration(integration);
    try {
      const response = await integrationsApi.getByType(integration.type);
      setSelectedIntegrationDetail(response.data.data);
      form.setFieldsValue({
        apiKey: '',
        apiSecret: '',
        webhookUrl: response.data.data.webhookUrl || '',
        isActive: response.data.data.isActive,
      });
      setConfigModalVisible(true);
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to load integration details');
    }
  };

  const handleTestConnection = async () => {
    if (!selectedIntegration) return;

    try {
      const response = await integrationsApi.testConnection(selectedIntegration.type);
      if (response.data.success) {
        message.success(response.data.message);
      } else {
        message.error(response.data.message);
      }
      loadIntegrations();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Connection test failed');
    }
  };

  const handleSaveConfig = async (values: any) => {
    if (!selectedIntegration) return;

    try {
      setLoading(true);
      await integrationsApi.configure(selectedIntegration.type, values);
      message.success('Configuration saved successfully');
      setConfigModalVisible(false);
      loadIntegrations();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to save configuration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <FadeIn>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <Title level={2} style={{ margin: 0 }}>Integrations</Title>
        <Button onClick={loadIntegrations} loading={loading}>
          Refresh
        </Button>
      </div>

      <Alert
        message="Integration Setup"
        description="Connect your property management system with external booking platforms. Configure API credentials to enable automatic synchronization of bookings and availability."
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      {loading && integrations.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 50 }}>
          <Spin size="large" />
        </div>
      ) : (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {integrations.length === 0 ? (
            <Alert
              message="No Integrations"
              description="No integrations are currently configured. Use the Configure button to set up your first integration."
              type="info"
            />
          ) : (
            integrations.map((integration) => (
          <Card
            key={integration.id}
            title={
              <Space>
                <ApiOutlined />
                <span>{integration.name}</span>
                <Tag
                  color={
                    integration.status === 'connected'
                      ? 'green'
                      : integration.status === 'error'
                      ? 'red'
                      : 'default'
                  }
                >
                  {integration.status === 'connected' ? (
                    <span>
                      <CheckCircleOutlined /> Connected
                    </span>
                  ) : integration.status === 'error' ? (
                    <span>
                      <CloseCircleOutlined /> Error
                    </span>
                  ) : (
                    'Disconnected'
                  )}
                </Tag>
              </Space>
            }
            extra={
              <Space>
                <Switch
                  checked={integration.isActive}
                  onChange={(checked) => handleToggle(integration, checked)}
                  disabled={integration.status === 'not_configured'}
                />
                <Button
                  icon={<SyncOutlined />}
                  onClick={() => handleSync(integration)}
                  disabled={!integration.isActive || integration.status === 'not_configured'}
                >
                  Sync Now
                </Button>
                <Button
                  icon={<SettingOutlined />}
                  onClick={() => handleConfigure(integration)}
                >
                  Configure
                </Button>
              </Space>
            }
          >
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="Status">
                {integration.status === 'connected' ? (
                  <Tag color="green">Connected</Tag>
                ) : integration.status === 'configured' ? (
                  <Tag color="blue">Configured</Tag>
                ) : integration.status === 'error' ? (
                  <Tag color="red">Error</Tag>
                ) : (
                  <Tag>Not Configured</Tag>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Active">
                {integration.isActive ? (
                  <Tag color="green">Yes</Tag>
                ) : (
                  <Tag color="default">No</Tag>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Last Sync">
                {integration.lastSyncAt ? (
                  <Text>{new Date(integration.lastSyncAt).toLocaleString()}</Text>
                ) : (
                  <Text type="secondary">Never</Text>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Last Sync Status">
                {integration.lastSyncStatus === 'success' ? (
                  <Tag color="green">Success</Tag>
                ) : integration.lastSyncStatus === 'error' ? (
                  <Tag color="red">Error</Tag>
                ) : (
                  <Text type="secondary">-</Text>
                )}
              </Descriptions.Item>
              {integration.lastSyncError && (
                <Descriptions.Item label="Last Error" span={2}>
                  <Text type="danger">{integration.lastSyncError}</Text>
                </Descriptions.Item>
              )}
            </Descriptions>

            {integration.status === 'not_configured' && (
              <div style={{ marginTop: 16 }}>
                <Alert
                  message="Not Configured"
                  description={`Please configure ${integration.name} API credentials to enable synchronization.`}
                  type="warning"
                  showIcon
                />
              </div>
            )}
            {selectedIntegrationDetail && selectedIntegrationDetail.syncHistory && selectedIntegrationDetail.syncHistory.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <Title level={5}>Recent Sync History</Title>
                <Table
                  size="small"
                  dataSource={selectedIntegrationDetail.syncHistory}
                  columns={[
                    { title: 'Started', dataIndex: 'startedAt', key: 'startedAt', render: (date) => new Date(date).toLocaleString() },
                    { title: 'Completed', dataIndex: 'completedAt', key: 'completedAt', render: (date) => date ? new Date(date).toLocaleString() : '-' },
                    { title: 'Status', dataIndex: 'status', key: 'status', render: (status) => <Tag color={status === 'success' ? 'green' : status === 'error' ? 'red' : 'orange'}>{status}</Tag> },
                    { title: 'Created', dataIndex: 'created', key: 'created' },
                    { title: 'Updated', dataIndex: 'updated', key: 'updated' },
                  ]}
                  pagination={false}
                />
              </div>
            )}
          </Card>
            ))
          )}
        </Space>
      )}

      <Modal
        title={`Configure ${selectedIntegration?.name}`}
        open={configModalVisible}
        onCancel={() => {
          setConfigModalVisible(false);
          setSelectedIntegrationDetail(null);
        }}
        footer={[
          <Button key="test" icon={<ThunderboltOutlined />} onClick={handleTestConnection}>
            Test Connection
          </Button>,
          <Button key="cancel" onClick={() => {
            setConfigModalVisible(false);
            setSelectedIntegrationDetail(null);
          }}>
            Cancel
          </Button>,
          <Button key="submit" type="primary" onClick={() => form.submit()} loading={loading}>
            Save
          </Button>,
        ]}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSaveConfig}>
          <Form.Item
            name="apiKey"
            label="API Key"
            rules={[{ required: true, message: 'Please enter API key' }]}
            help={selectedIntegrationDetail?.hasApiKey ? 'API key is already configured. Leave blank to keep existing.' : ''}
          >
            <Input.Password placeholder="Enter API key" />
          </Form.Item>
          <Form.Item
            name="apiSecret"
            label="API Secret"
            rules={[{ required: true, message: 'Please enter API secret' }]}
            help={selectedIntegrationDetail?.hasApiSecret ? 'API secret is already configured. Leave blank to keep existing.' : ''}
          >
            <Input.Password placeholder="Enter API secret" />
          </Form.Item>
          <Form.Item name="webhookUrl" label="Webhook URL">
            <Input placeholder="Optional: Custom webhook URL" />
          </Form.Item>
          <Form.Item name="isActive" valuePropName="checked">
            <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
          </Form.Item>
          <Alert
            message="Security Note"
            description="Your API credentials are encrypted and stored securely. Never share your credentials with unauthorized parties."
            type="info"
            showIcon
            style={{ marginTop: 16 }}
          />
        </Form>
      </Modal>

      <Modal
        title={`Sync ${selectedIntegration?.name}`}
        open={syncModalVisible}
        onCancel={() => setSyncModalVisible(false)}
        onOk={() => syncForm.submit()}
        width={700}
        confirmLoading={syncing}
      >
        <Alert
          message="Property Mapping"
          description={`Map ${selectedIntegration?.name} property IDs to your local properties. This tells the system which external properties correspond to which local properties.`}
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
        <Form form={syncForm} layout="vertical" onFinish={handleSyncSubmit}>
          <Form.List name="mappings">
            {(fields, { add, remove }) => (
              <>
                {fields.map((field, index) => (
                  <Space key={field.key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                    <Form.Item
                      {...field}
                      name={[field.name, 'externalId']}
                      label={index === 0 ? 'External Property ID' : ''}
                      rules={[{ required: true, message: 'External ID required' }]}
                    >
                      <Input placeholder={`${selectedIntegration?.name} Property ID`} />
                    </Form.Item>
                    <Form.Item
                      {...field}
                      name={[field.name, 'propertyId']}
                      label={index === 0 ? 'Local Property' : ''}
                      rules={[{ required: true, message: 'Local property required' }]}
                    >
                      <Select
                        placeholder="Select property"
                        showSearch
                        filterOption={(input, option) =>
                          (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                        }
                        options={properties.map((p) => ({ value: p.id, label: `${p.name} (${p.code})` }))}
                        style={{ width: 200 }}
                      />
                    </Form.Item>
                    <Button onClick={() => remove(field.name)}>Remove</Button>
                  </Space>
                ))}
                <Button type="dashed" onClick={() => add()} block>
                  Add Mapping
                </Button>
              </>
            )}
          </Form.List>
        </Form>
      </Modal>
    </div>
  );
};

export default IntegrationsPage;

