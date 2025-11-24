import React from 'react';

interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
}

// Animations temporarily disabled
const FadeIn: React.FC<FadeInProps> = ({ children }) => {
  return <>{children}</>;
};

export default FadeIn;
