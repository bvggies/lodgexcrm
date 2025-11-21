import React from 'react';
import { Dropdown, Badge, List, Empty, Button, Space, Typography } from 'antd';
import {
  BellOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
  ExclamationCircleOutlined,
  CloseCircleOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { markAsRead, markAllAsRead, removeNotification } from '../store/slices/notificationsSlice';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const { Text } = Typography;

const NotificationsDropdown: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { notifications, unreadCount } = useAppSelector((state) => state.notifications);

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'warning':
        return <ExclamationCircleOutlined style={{ color: '#faad14' }} />;
      case 'error':
        return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />;
      default:
        return <InfoCircleOutlined style={{ color: '#1890ff' }} />;
    }
  };

  const handleNotificationClick = (notification: any) => {
    if (!notification.read) {
      dispatch(markAsRead(notification.id));
    }
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const handleMarkAllRead = () => {
    dispatch(markAllAsRead());
  };

  const handleRemove = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    dispatch(removeNotification(id));
  };

  const menuItems = {
    items: [
      {
        key: 'header',
        label: (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '8px 0',
              borderBottom: '1px solid #f0f0f0',
            }}
          >
            <Text strong>Notifications</Text>
            {unreadCount > 0 && (
              <Button type="link" size="small" onClick={handleMarkAllRead}>
                Mark all as read
              </Button>
            )}
          </div>
        ),
      },
      {
        key: 'notifications',
        label: (
          <div style={{ maxHeight: '400px', overflowY: 'auto', width: '350px' }}>
            {notifications.length === 0 ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="No notifications"
                style={{ padding: '20px' }}
              />
            ) : (
              <List
                dataSource={notifications}
                renderItem={(notification) => (
                  <List.Item
                    style={{
                      padding: '12px 16px',
                      cursor: 'pointer',
                      backgroundColor: notification.read ? 'transparent' : '#e6f7ff',
                      borderLeft: notification.read ? 'none' : '3px solid #1890ff',
                    }}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <List.Item.Meta
                      avatar={getIcon(notification.type)}
                      title={
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                          }}
                        >
                          <Text strong={!notification.read} style={{ fontSize: '14px' }}>
                            {notification.title}
                          </Text>
                          <Button
                            type="text"
                            size="small"
                            icon={<DeleteOutlined />}
                            onClick={(e) => handleRemove(e, notification.id)}
                            style={{ opacity: 0.6 }}
                          />
                        </div>
                      }
                      description={
                        <div>
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            {notification.message}
                          </Text>
                          <div style={{ marginTop: '4px' }}>
                            <Text type="secondary" style={{ fontSize: '11px' }}>
                              {dayjs(notification.createdAt).fromNow()}
                            </Text>
                          </div>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </div>
        ),
      },
    ],
  };

  return (
    <Dropdown menu={menuItems} placement="bottomRight" trigger={['click']}>
      <Badge count={unreadCount} size="small" offset={[-5, 5]}>
        <BellOutlined
          style={{
            fontSize: 20,
            cursor: 'pointer',
            color: unreadCount > 0 ? '#1890ff' : undefined,
          }}
        />
      </Badge>
    </Dropdown>
  );
};

export default NotificationsDropdown;
