import React, { useEffect, useRef, useState } from 'react';
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
  const motionRef = useRef<HTMLDivElement>(null);
  const [isLargeScreen, setIsLargeScreen] = useState(false);

  // Check screen size on mount and resize
  useEffect(() => {
    const checkScreenSize = () => {
      setIsLargeScreen(window.innerWidth >= 768);
    };
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Force visibility after animation should complete - with immediate fallback for large screens
  useEffect(() => {
    // Immediate visibility for larger screens
    if (isLargeScreen && motionRef.current) {
      // Force immediate visibility on large screens
      motionRef.current.style.opacity = '1';
      motionRef.current.style.transform = 'translateY(0)';
    }

    // Also set a timeout as backup
    const timer = setTimeout(
      () => {
        if (motionRef.current) {
          motionRef.current.style.opacity = '1';
          motionRef.current.style.transform = 'translateY(0)';
        }
      },
      isLargeScreen ? 100 : (index * 0.03 + 0.5) * 1000
    ); // Shorter delay for large screens

    return () => clearTimeout(timer);
  }, [index, isLargeScreen]);

  return (
    <motion.div
      ref={motionRef}
      initial={{ opacity: isLargeScreen ? 1 : 0, y: isLargeScreen ? 0 : 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: isLargeScreen ? 0 : index * 0.03,
        duration: isLargeScreen ? 0 : 0.25,
        ease: 'easeOut',
      }}
      whileHover={{
        y: -2,
        transition: { duration: 0.15 },
      }}
      data-aos="fade-up"
      data-aos-delay={index * 30}
      style={{
        willChange: 'transform',
      }}
      onAnimationComplete={() => {
        if (motionRef.current) {
          motionRef.current.style.opacity = '1';
          motionRef.current.style.transform = 'translateY(0)';
        }
      }}
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
