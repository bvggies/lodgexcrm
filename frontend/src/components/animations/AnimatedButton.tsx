import React from 'react';
import { Button } from 'antd';
import { motion } from 'framer-motion';
import type { ButtonProps } from 'antd/es/button';

interface AnimatedButtonProps extends ButtonProps {
  children: React.ReactNode;
}

const AnimatedButton: React.FC<AnimatedButtonProps> = ({ children, ...buttonProps }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      <Button {...buttonProps}>{children}</Button>
    </motion.div>
  );
};

export default AnimatedButton;

