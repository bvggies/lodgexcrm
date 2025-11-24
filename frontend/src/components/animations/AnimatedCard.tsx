import React from 'react';
import { Card } from 'antd';
import type { CardProps } from 'antd/es/card';

interface AnimatedCardProps extends CardProps {
  index?: number;
}

// Animations temporarily disabled
const AnimatedCard: React.FC<AnimatedCardProps> = ({ children, ...cardProps }) => {
  return <Card {...cardProps}>{children}</Card>;
};

export default AnimatedCard;
