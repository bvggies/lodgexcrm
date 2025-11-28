import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Typography, Space, Button, Input, message, Tabs, Badge } from 'antd';
import {
  PhoneOutlined,
  HistoryOutlined,
  UserOutlined,
  SearchOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { useCalling } from '../../contexts/CallingContext';
import DialerPanel from '../../components/calling/DialerPanel';
import CallHistoryComponent from '../../components/calling/CallHistory';
import { voiceService, CallState } from '../../services/twilio/voiceService';
import { twilioApi } from '../../services/api/twilioApi';
import { guestsApi } from '../../services/api/guestsApi';
import type { Guest } from '../../services/api/guestsApi';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const CallPage: React.FC = () => {
  const { openDialer, callState } = useCalling();
  const { t } = useTranslation();
  const [isDialerOpen, setIsDialerOpen] = useState(false);
  const [recentCalls, setRecentCalls] = useState<any[]>([]);
  const [favoriteContacts, setFavoriteContacts] = useState<Guest[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadRecentCalls();
    loadFavoriteContacts();
  }, []);

  const loadRecentCalls = async () => {
    try {
      setLoading(true);
      const response = await twilioApi.getCallHistory({ limit: 10 });
      setRecentCalls(response.data.data.calls);
    } catch (error) {
      console.error('Failed to load recent calls:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFavoriteContacts = async () => {
    try {
      const response = await guestsApi.getAll({});
      const guests = response.data.data.guests || [];
      // Get guests with phone numbers as favorites (limit to 20)
      setFavoriteContacts(guests.filter((g: Guest) => g.phone).slice(0, 20));
    } catch (error) {
      console.error('Failed to load contacts:', error);
    }
  };

  const handleQuickCall = (phoneNumber: string, guestId?: string) => {
    if (!phoneNumber) {
      message.error('No phone number available');
      return;
    }
    openDialer(phoneNumber, guestId);
    setIsDialerOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; text: string }> = {
      completed: { color: 'success', text: 'Completed' },
      failed: { color: 'error', text: 'Failed' },
      busy: { color: 'warning', text: 'Busy' },
      'no-answer': { color: 'default', text: 'No Answer' },
      'in-progress': { color: 'processing', text: 'In Progress' },
      ringing: { color: 'processing', text: 'Ringing' },
    };

    const config = statusConfig[status] || { color: 'default', text: status };
    return <Badge status={config.color as any} text={config.text} />;
  };

  const filteredContacts = favoriteContacts.filter(
    (contact) =>
      contact.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.phone?.includes(searchQuery)
  );

  return (
    <div style={{ padding: '24px', background: '#f0f2f5', minHeight: '100vh' }}>
      <Row gutter={[24, 24]}>
        {/* Header Section */}
        <Col span={24}>
          <Card
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
              borderRadius: '16px',
            }}
          >
            <Row align="middle" justify="space-between">
              <Col>
                <Space direction="vertical" size="small">
                  <Title level={2} style={{ color: 'white', margin: 0 }}>
                    <PhoneOutlined /> {t('calls.phoneSystem')}
                  </Title>
                  <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: '16px' }}>
                    {t('calls.makeAndReceiveCalls')}
                  </Text>
                </Space>
              </Col>
              <Col>
                <Button
                  type="primary"
                  size="large"
                  icon={<PhoneOutlined />}
                  onClick={() => {
                    openDialer();
                    setIsDialerOpen(true);
                  }}
                  style={{
                    height: '56px',
                    fontSize: '18px',
                    padding: '0 32px',
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  }}
                >
                  {t('calls.newCall')}
                </Button>
              </Col>
            </Row>
          </Card>
        </Col>

        {/* Call Status Card */}
        {callState.status !== 'idle' && (
          <Col span={24}>
            <Card
              style={{
                background: callState.status === 'connected' ? '#52c41a' : '#1890ff',
                border: 'none',
                borderRadius: '12px',
              }}
            >
              <Row align="middle" justify="space-between">
                <Col>
                  <Space>
                    <PhoneOutlined style={{ fontSize: '24px', color: 'white' }} spin />
                    <div>
                      <Text strong style={{ color: 'white', fontSize: '18px', display: 'block' }}>
                        {callState.status === 'connecting' && 'Connecting...'}
                        {callState.status === 'ringing' && 'Ringing...'}
                        {callState.status === 'connected' && 'Call in Progress'}
                      </Text>
                      <Text style={{ color: 'rgba(255,255,255,0.9)' }}>
                        {callState.call ? 'Active call' : 'No active call'}
                      </Text>
                    </div>
                  </Space>
                </Col>
                <Col>
                  <Button
                    danger
                    size="large"
                    onClick={() => {
                      voiceService.hangUp();
                      message.success('Call ended');
                    }}
                    style={{
                      background: 'rgba(255,255,255,0.2)',
                      border: '1px solid rgba(255,255,255,0.3)',
                      color: 'white',
                    }}
                  >
                    End Call
                  </Button>
                </Col>
              </Row>
            </Card>
          </Col>
        )}

        {/* Quick Actions */}
        <Col xs={24} lg={8}>
          <Card
            title={
              <Space>
                <UserOutlined />
                <span>Quick Contacts</span>
              </Space>
            }
            style={{ borderRadius: '12px', height: '100%' }}
          >
            <Input
              placeholder="Search contacts..."
              prefix={<SearchOutlined />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ marginBottom: '16px', borderRadius: '8px' }}
            />
            <Space direction="vertical" style={{ width: '100%' }} size="small">
              {filteredContacts.length > 0 ? (
                filteredContacts.slice(0, 10).map((contact) => (
                  <Card
                    key={contact.id}
                    size="small"
                    hoverable
                    style={{
                      borderRadius: '8px',
                      cursor: 'pointer',
                      border: '1px solid #f0f0f0',
                    }}
                    onClick={() => handleQuickCall(contact.phone || '', contact.id)}
                  >
                    <Row align="middle" justify="space-between">
                      <Col>
                        <Space>
                          <div
                            style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '50%',
                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              fontWeight: 'bold',
                            }}
                          >
                            {contact.firstName?.[0]?.toUpperCase()}
                            {contact.lastName?.[0]?.toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: '500' }}>
                              {contact.firstName} {contact.lastName}
                            </div>
                            <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
                              {contact.phone}
                            </div>
                          </div>
                        </Space>
                      </Col>
                      <Col>
                        <Button
                          type="primary"
                          shape="circle"
                          icon={<PhoneOutlined />}
                          size="small"
                          style={{
                            background: '#52c41a',
                            borderColor: '#52c41a',
                          }}
                        />
                      </Col>
                    </Row>
                  </Card>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '20px', color: '#8c8c8c' }}>
                  {searchQuery ? 'No contacts found' : 'No contacts available'}
                </div>
              )}
            </Space>
          </Card>
        </Col>

        {/* Recent Calls & History */}
        <Col xs={24} lg={16}>
          <Card style={{ borderRadius: '12px', minHeight: '500px' }} bodyStyle={{ padding: 0 }}>
            <Tabs defaultActiveKey="recent" style={{ padding: '0 24px' }}>
              <TabPane
                tab={
                  <span>
                    <HistoryOutlined />
                    Recent Calls
                  </span>
                }
                key="recent"
              >
                <div style={{ padding: '24px 0' }}>
                  {recentCalls.length > 0 ? (
                    <Space direction="vertical" style={{ width: '100%' }} size="middle">
                      {recentCalls.map((call) => (
                        <Card
                          key={call.id}
                          size="small"
                          hoverable
                          style={{
                            borderRadius: '8px',
                            border: '1px solid #f0f0f0',
                          }}
                        >
                          <Row align="middle" justify="space-between">
                            <Col flex="auto">
                              <Space>
                                <div
                                  style={{
                                    width: '48px',
                                    height: '48px',
                                    borderRadius: '50%',
                                    background:
                                      call.direction === 'outbound'
                                        ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                                        : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                    fontSize: '20px',
                                  }}
                                >
                                  <PhoneOutlined />
                                </div>
                                <div>
                                  <div style={{ fontWeight: '500', fontSize: '16px' }}>
                                    {call.phoneNumber}
                                  </div>
                                  <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
                                    {call.guest
                                      ? `${call.guest.firstName} ${call.guest.lastName}`
                                      : 'Unknown'}
                                  </div>
                                  <div
                                    style={{ fontSize: '12px', color: '#8c8c8c', marginTop: '4px' }}
                                  >
                                    {new Date(call.startedAt).toLocaleString()}
                                  </div>
                                </div>
                              </Space>
                            </Col>
                            <Col>
                              <Space direction="vertical" align="end" size="small">
                                {getStatusBadge(call.status)}
                                <Space>
                                  <Button
                                    type="link"
                                    icon={<PhoneOutlined />}
                                    onClick={() => handleQuickCall(call.phoneNumber, call.guestId)}
                                  >
                                    Call Again
                                  </Button>
                                </Space>
                              </Space>
                            </Col>
                          </Row>
                        </Card>
                      ))}
                    </Space>
                  ) : (
                    <div
                      style={{
                        textAlign: 'center',
                        padding: '60px 20px',
                        color: '#8c8c8c',
                      }}
                    >
                      <PhoneOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
                      <div>No recent calls</div>
                      <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => {
                          openDialer();
                          setIsDialerOpen(true);
                        }}
                        style={{ marginTop: '16px' }}
                      >
                        Make Your First Call
                      </Button>
                    </div>
                  )}
                </div>
              </TabPane>
              <TabPane
                tab={
                  <span>
                    <HistoryOutlined />
                    Full History
                  </span>
                }
                key="history"
              >
                <div style={{ padding: '24px 0' }}>
                  <CallHistoryComponent onCall={handleQuickCall} />
                </div>
              </TabPane>
            </Tabs>
          </Card>
        </Col>
      </Row>

      {/* Dialer Panel */}
      <DialerPanel visible={isDialerOpen} onClose={() => setIsDialerOpen(false)} />
    </div>
  );
};

export default CallPage;
