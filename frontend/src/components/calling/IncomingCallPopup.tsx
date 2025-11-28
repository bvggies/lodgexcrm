import React, { useEffect } from 'react';
import { Modal, Button, Space, Typography } from 'antd';
import { PhoneOutlined, CloseOutlined } from '@ant-design/icons';
import { voiceService } from '../../services/twilio/voiceService';

const { Title, Text } = Typography;

interface IncomingCallPopupProps {
  visible: boolean;
  phoneNumber?: string;
  onAnswer: () => void;
  onReject: () => void;
}

const IncomingCallPopup: React.FC<IncomingCallPopupProps> = ({
  visible,
  phoneNumber,
  onAnswer,
  onReject,
}) => {
  useEffect(() => {
    const unsubscribe = voiceService.onStatusChange(() => {
      // Handle status changes if needed
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleAnswer = () => {
    voiceService.answerCall();
    onAnswer();
  };

  const handleReject = () => {
    voiceService.rejectCall();
    onReject();
  };

  return (
    <Modal open={visible} closable={false} footer={null} width={400} maskClosable={false} centered>
      <div style={{ textAlign: 'center', padding: '20px' }}>
        <PhoneOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 20 }} spin />
        <Title level={3}>Incoming Call</Title>
        <Text style={{ fontSize: 18, display: 'block', marginBottom: 30 }}>
          {phoneNumber || 'Unknown Caller'}
        </Text>

        <Space size="large">
          <Button
            type="primary"
            danger
            icon={<CloseOutlined />}
            onClick={handleReject}
            size="large"
            style={{ width: 120, height: 50 }}
          >
            Reject
          </Button>
          <Button
            type="primary"
            icon={<PhoneOutlined />}
            onClick={handleAnswer}
            size="large"
            style={{ width: 120, height: 50, backgroundColor: '#52c41a', borderColor: '#52c41a' }}
          >
            Answer
          </Button>
        </Space>
      </div>
    </Modal>
  );
};

export default IncomingCallPopup;
