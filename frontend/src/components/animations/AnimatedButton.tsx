import React from 'react';
import { Button } from 'antd';
import type { ButtonProps } from 'antd/es/button';

interface AnimatedButtonProps extends ButtonProps {
  children: React.ReactNode;
}

// Animations temporarily disabled
const AnimatedButton: React.FC<AnimatedButtonProps> = ({ children, ...buttonProps }) => {
  return <Button {...buttonProps}>{children}</Button>;
};

export default AnimatedButton;
