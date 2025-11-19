import React from 'react';
import { Modal } from 'antd';
import { motion, AnimatePresence } from 'framer-motion';
import type { ModalProps } from 'antd/es/modal';

interface AnimatedModalProps extends ModalProps {
  children: React.ReactNode;
}

const AnimatedModal: React.FC<AnimatedModalProps> = ({ children, ...modalProps }) => {
  return (
    <Modal {...modalProps}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.2 }}
      >
        {children}
      </motion.div>
    </Modal>
  );
};

export default AnimatedModal;

