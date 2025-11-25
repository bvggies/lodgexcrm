import React from 'react';
import { Skeleton, Card } from 'antd';

interface LoadingSkeletonProps {
  rows?: number;
  showCard?: boolean;
}

const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ rows = 3, showCard = false }) => {
  const content = <Skeleton active paragraph={{ rows }} title={{ width: '40%' }} />;

  if (showCard) {
    return <Card>{content}</Card>;
  }

  return <>{content}</>;
};

export default LoadingSkeleton;
