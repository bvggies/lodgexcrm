import React from 'react';
import { Card } from 'antd';
import { motion } from 'framer-motion';
import type { CardProps } from 'antd/es/card';

interface AnimatedCardProps extends CardProps {
  index?: number;
}

const AnimatedCard: React.FC<AnimatedCardProps> = ({
  children,
  index = 0,
  ...cardProps
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
    >
      <Card {...cardProps}>{children}</Card>
    </motion.div>
  );
};

export default AnimatedCard;

