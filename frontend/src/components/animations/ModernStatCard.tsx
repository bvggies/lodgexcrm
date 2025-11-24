import React from 'react';
import { Card, Statistic } from 'antd';
import type { StatisticProps } from 'antd/es/statistic';
import { useAppSelector } from '../../store/hooks';

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

// Animations temporarily disabled
const ModernStatCard: React.FC<ModernStatCardProps> = ({
  value,
  icon,
  gradient = 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
  trend,
  ...statisticProps
}) => {
  const { mode: themeMode } = useAppSelector((state) => state.theme);

  return (
    <Card
      style={{
        background: themeMode === 'light' ? '#ffffff' : '#1e293b',
        backdropFilter: 'blur(10px)',
        borderRadius: '16px',
        border: themeMode === 'light' ? '1px solid #e2e8f0' : '1px solid #334155',
        boxShadow:
          themeMode === 'light' ? '0 8px 32px rgba(0, 0, 0, 0.1)' : '0 8px 32px rgba(0, 0, 0, 0.3)',
        overflow: 'hidden',
        position: 'relative',
        cursor: 'pointer',
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
        <div
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
          }}
        >
          <div style={{ color: '#ffffff', fontSize: '24px', opacity: 1 }}>{icon}</div>
        </div>
      )}

      <Statistic
        {...statisticProps}
        value={value}
        valueStyle={{
          fontSize: '28px',
          fontWeight: 700,
          color: themeMode === 'light' ? '#1e293b' : '#e2e8f0',
          ...statisticProps.valueStyle,
        }}
        title={
          statisticProps.title ? (
            <span
              style={{
                color: themeMode === 'light' ? '#64748b' : '#94a3b8',
                fontSize: '14px',
                fontWeight: 500,
              }}
            >
              {statisticProps.title}
            </span>
          ) : null
        }
      />

      {trend && (
        <div
          style={{
            marginTop: '8px',
            fontSize: '12px',
            color: trend.isPositive ? '#52c41a' : '#ff4d4f',
            fontWeight: 500,
          }}
        >
          {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
        </div>
      )}
    </Card>
  );
};

export default ModernStatCard;
