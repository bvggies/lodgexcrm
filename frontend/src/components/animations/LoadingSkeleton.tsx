import React from 'react';
import { Skeleton, Card } from 'antd';
import { motion } from 'framer-motion';

interface LoadingSkeletonProps {
  rows?: number;
  showCard?: boolean;
}

const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ rows = 3, showCard = false }) => {
  const content = <Skeleton active paragraph={{ rows }} title={{ width: '40%' }} />;

  if (showCard) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
        <Card>{content}</Card>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      {content}
    </motion.div>
  );
};

export default LoadingSkeleton;
