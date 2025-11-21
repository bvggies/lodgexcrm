import React from 'react';
import { Card, Statistic } from 'antd';
import { motion } from 'framer-motion';
import type { StatisticProps } from 'antd/es/statistic';

interface ModernStatCardProps extends Omit<StatisticProps, 'value'> {
  value: number | string;
  icon?: React.ReactNode;
  gradient?: string;
  index?: number;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const ModernStatCard: React.FC<ModernStatCardProps> = ({
  value,
  icon,
  gradient = 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
  index = 0,
  trend,
  ...statisticProps
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: index * 0.05,
        duration: 0.3,
        ease: 'easeOut',
      }}
      whileHover={{
        y: -4,
        transition: { duration: 0.2 },
      }}
      data-aos="fade-up"
      data-aos-delay={index * 50}
      style={{ willChange: 'transform' }}
    >
      <Card
        style={{
          background: '#1e293b',
          backdropFilter: 'blur(10px)',
          borderRadius: '16px',
          border: '1px solid #334155',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          overflow: 'hidden',
          position: 'relative',
        }}
        bodyStyle={{ padding: '24px' }}
      >
        {/* Gradient overlay */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: gradient,
          }}
        />

        {/* Icon background */}
        {icon && (
          <motion.div
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              width: '60px',
              height: '60px',
              borderRadius: '12px',
              background: gradient,
              opacity: 0.3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              willChange: 'transform',
            }}
            animate={{
              rotate: [0, 3, -3, 0],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              repeatType: 'reverse',
              ease: 'easeInOut',
            }}
          >
            <div style={{ color: '#ffffff', fontSize: '24px', opacity: 1 }}>{icon}</div>
          </motion.div>
        )}

        <Statistic
          {...statisticProps}
          value={value}
          valueStyle={{
            fontSize: '28px',
            fontWeight: 700,
            color: '#e2e8f0',
          }}
          prefix={icon && <span style={{ marginRight: '8px', fontSize: '20px' }}>{icon}</span>}
        />

        {trend && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            style={{
              marginTop: '8px',
              fontSize: '12px',
              color: trend.isPositive ? '#52c41a' : '#ff4d4f',
              fontWeight: 500,
            }}
          >
            {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
          </motion.div>
        )}
      </Card>
    </motion.div>
  );
};

export default ModernStatCard;
