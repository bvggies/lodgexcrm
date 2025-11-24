import React from 'react';
import { Modal } from 'antd';
import type { ModalProps } from 'antd/es/modal';

interface AnimatedModalProps extends ModalProps {
  children: React.ReactNode;
}

// Animations temporarily disabled
const AnimatedModal: React.FC<AnimatedModalProps> = ({ children, ...modalProps }) => {
  return <Modal {...modalProps}>{children}</Modal>;
};

export default AnimatedModal;
