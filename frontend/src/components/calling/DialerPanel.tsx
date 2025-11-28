import React, { useState, useEffect } from 'react';
import { Modal, Input, Button, Space, message, Form } from 'antd';
import { PhoneOutlined, CloseOutlined } from '@ant-design/icons';
import { voiceService, CallState } from '../../services/twilio/voiceService';

interface DialerPanelProps {
  visible: boolean;
  onClose: () => void;
  defaultNumber?: string;
  guestId?: string;
}

const DialerPanel: React.FC<DialerPanelProps> = ({
  visible,
  onClose,
  defaultNumber = '',
  guestId,
}) => {
  const [phoneNumber, setPhoneNumber] = useState(defaultNumber);
  const [callState, setCallState] = useState<CallState>({ status: 'idle' });
  const [form] = Form.useForm();

  useEffect(() => {
    if (defaultNumber) {
      setPhoneNumber(defaultNumber);
      form.setFieldsValue({ phoneNumber: defaultNumber });
    }
  }, [defaultNumber, form]);

  useEffect(() => {
    if (visible && !voiceService.isInitialized()) {
      initializeVoice();
    }

    const unsubscribe = voiceService.onStatusChange((status) => {
      setCallState(status);
      if (status.status === 'disconnected') {
        message.info('Call ended');
      }
    });

    return () => {
      unsubscribe();
    };
  }, [visible]);

  const initializeVoice = async () => {
    try {
      await voiceService.initialize();
      message.success('Phone ready');
    } catch (error: any) {
      message.error('Failed to initialize phone: ' + (error.message || 'Unknown error'));
    }
  };

  const handleCall = async () => {
    if (!phoneNumber.trim()) {
      message.error('Please enter a phone number');
      return;
    }

    try {
      // Ensure device is initialized and ready
      if (!voiceService.isInitialized()) {
        message.loading('Initializing phone...', 0);
        await voiceService.initialize();
        message.destroy();
      }

      // Wait for device to be ready
      await voiceService.waitForReady();

      await voiceService.makeCall(phoneNumber, guestId);
      message.success('Calling...');
    } catch (error: any) {
      message.error('Failed to make call: ' + (error.message || 'Unknown error'));
    }
  };

  const handleHangUp = () => {
    voiceService.hangUp();
    setCallState({ status: 'idle' });
  };

  const handleMute = () => {
    if (voiceService.isMuted()) {
      voiceService.unmute();
      message.info('Unmuted');
    } else {
      voiceService.mute();
      message.info('Muted');
    }
  };

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digit characters
    const digits = value.replace(/\D/g, '');
    return digits;
  };

  const handleNumberInput = (value: string) => {
    const formatted = formatPhoneNumber(value);
    setPhoneNumber(formatted);
  };

  const addDigit = (digit: string) => {
    setPhoneNumber((prev) => prev + digit);
  };

  const handleBackspace = () => {
    setPhoneNumber((prev) => prev.slice(0, -1));
  };

  const isCallActive =
    callState.status === 'connected' ||
    callState.status === 'ringing' ||
    callState.status === 'connecting';

  return (
    <Modal
      title="Phone Dialer"
      open={visible}
      onCancel={onClose}
      footer={null}
      width={400}
      closable={!isCallActive}
      maskClosable={!isCallActive}
    >
      <Form form={form} layout="vertical">
        <Form.Item label="Phone Number">
          <Input
            value={phoneNumber}
            onChange={(e) => handleNumberInput(e.target.value)}
            placeholder="Enter phone number"
            size="large"
            disabled={isCallActive}
            prefix={<PhoneOutlined />}
          />
        </Form.Item>

        {!isCallActive ? (
          <>
            <div style={{ marginBottom: 16 }}>
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <Space>
                  <Button onClick={() => addDigit('1')} style={{ width: 60, height: 60 }}>
                    1
                  </Button>
                  <Button onClick={() => addDigit('2')} style={{ width: 60, height: 60 }}>
                    2
                  </Button>
                  <Button onClick={() => addDigit('3')} style={{ width: 60, height: 60 }}>
                    3
                  </Button>
                </Space>
                <Space>
                  <Button onClick={() => addDigit('4')} style={{ width: 60, height: 60 }}>
                    4
                  </Button>
                  <Button onClick={() => addDigit('5')} style={{ width: 60, height: 60 }}>
                    5
                  </Button>
                  <Button onClick={() => addDigit('6')} style={{ width: 60, height: 60 }}>
                    6
                  </Button>
                </Space>
                <Space>
                  <Button onClick={() => addDigit('7')} style={{ width: 60, height: 60 }}>
                    7
                  </Button>
                  <Button onClick={() => addDigit('8')} style={{ width: 60, height: 60 }}>
                    8
                  </Button>
                  <Button onClick={() => addDigit('9')} style={{ width: 60, height: 60 }}>
                    9
                  </Button>
                </Space>
                <Space>
                  <Button onClick={() => addDigit('*')} style={{ width: 60, height: 60 }}>
                    *
                  </Button>
                  <Button onClick={() => addDigit('0')} style={{ width: 60, height: 60 }}>
                    0
                  </Button>
                  <Button onClick={() => addDigit('#')} style={{ width: 60, height: 60 }}>
                    #
                  </Button>
                </Space>
                <Space>
                  <Button onClick={handleBackspace} style={{ width: 188, height: 60 }}>
                    ← Backspace
                  </Button>
                </Space>
              </Space>
            </div>

            <Button
              type="primary"
              icon={<PhoneOutlined />}
              onClick={handleCall}
              block
              size="large"
              style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
            >
              Call
            </Button>
          </>
        ) : (
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <div style={{ fontSize: 18, marginBottom: 10 }}>
                {callState.status === 'connecting' && 'Connecting...'}
                {callState.status === 'ringing' && 'Ringing...'}
                {callState.status === 'connected' && 'Call in progress'}
              </div>
              <div style={{ fontSize: 24, fontWeight: 'bold' }}>{phoneNumber}</div>
            </div>

            <Space style={{ width: '100%', justifyContent: 'center' }}>
              <Button type="default" onClick={handleMute} size="large" style={{ width: 100 }}>
                {voiceService.isMuted() ? 'Unmute' : 'Mute'}
              </Button>
              <Button
                type="primary"
                danger
                icon={<CloseOutlined />}
                onClick={handleHangUp}
                size="large"
                style={{ width: 100 }}
              >
                Hang Up
              </Button>
            </Space>
          </Space>
        )}
      </Form>
    </Modal>
  );
};

export default DialerPanel;
