import React from 'react';
import { Card } from 'antd';
import { motion } from 'framer-motion';
import type { CardProps } from 'antd/es/card';

interface GlassCardProps extends CardProps {
  index?: number;
  glowColor?: string;
}

const GlassCard: React.FC<GlassCardProps> = ({
  children,
  index = 0,
  glowColor = 'rgba(102, 126, 234, 0.1)',
  ...cardProps
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: index * 0.1,
        duration: 0.5,
        type: 'spring',
        stiffness: 100,
      }}
      whileHover={{
        y: -4,
        transition: { duration: 0.2 },
      }}
      data-aos="fade-up"
      data-aos-delay={index * 50}
    >
      <Card
        {...cardProps}
        style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          boxShadow: `0 8px 32px ${glowColor}`,
          overflow: 'hidden',
          ...cardProps.style,
        }}
      >
        {children}
      </Card>
    </motion.div>
  );
};

export default GlassCard;
