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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: index * 0.03,
        duration: 0.25,
        ease: 'easeOut',
      }}
      whileHover={{
        y: -2,
        transition: { duration: 0.15 },
      }}
      data-aos="fade-up"
      data-aos-delay={index * 30}
      style={{ willChange: 'transform' }}
    >
      <Card
        {...cardProps}
        style={{
          background: '#1e293b',
          backdropFilter: 'blur(20px)',
          borderRadius: '16px',
          border: '1px solid #334155',
          boxShadow: `0 8px 32px ${glowColor}`,
          overflow: 'hidden',
          transition: 'all 0.2s ease',
          ...cardProps.style,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = `0 12px 40px ${glowColor}`;
          e.currentTarget.style.borderColor = '#475569';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = `0 8px 32px ${glowColor}`;
          e.currentTarget.style.borderColor = '#334155';
        }}
      >
        {children}
      </Card>
    </motion.div>
  );
};

export default GlassCard;
