import React from 'react';
import { Card } from 'antd';
import type { CardProps } from 'antd/es/card';
import { useAppSelector } from '../../store/hooks';

interface GlassCardProps extends CardProps {
  index?: number;
  glowColor?: string;
}

// Animations temporarily disabled
const GlassCard: React.FC<GlassCardProps> = ({
  children,
  glowColor = 'rgba(102, 126, 234, 0.1)',
  ...cardProps
}) => {
  const { mode: themeMode } = useAppSelector((state) => state.theme);

  return (
    <Card
      {...cardProps}
      style={{
        background: themeMode === 'light' ? '#ffffff' : '#1e293b',
        backdropFilter: 'blur(20px)',
        borderRadius: '16px',
        border: themeMode === 'light' ? '1px solid #e2e8f0' : '1px solid #334155',
        boxShadow:
          themeMode === 'light' ? '0 8px 32px rgba(0, 0, 0, 0.1)' : `0 8px 32px ${glowColor}`,
        overflow: 'hidden',
        ...cardProps.style,
      }}
    >
      {children}
    </Card>
  );
};

export default GlassCard;
