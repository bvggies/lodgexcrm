import React from 'react';

interface StaggerContainerProps {
  children: React.ReactNode;
  staggerDelay?: number;
}

// Animations temporarily disabled
const StaggerContainer: React.FC<StaggerContainerProps> = ({ children }) => {
  return <>{children}</>;
};

export default StaggerContainer;
