import React from 'react';

interface PageTransitionProps {
  children: React.ReactNode;
}

// Animations temporarily disabled
const PageTransition: React.FC<PageTransitionProps> = ({ children }) => {
  return <>{children}</>;
};

export default PageTransition;
