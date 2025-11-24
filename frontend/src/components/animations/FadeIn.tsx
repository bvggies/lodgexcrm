import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
}

const FadeIn: React.FC<FadeInProps> = ({
  children,
  delay = 0,
  duration = 0.5,
  direction = 'up',
}) => {
  const motionRef = useRef<HTMLDivElement>(null);
  const directions = {
    up: { y: 20 },
    down: { y: -20 },
    left: { x: 20 },
    right: { x: -20 },
  };

  // Force visibility after animation should complete
  useEffect(() => {
    const timer = setTimeout(() => {
      if (motionRef.current) {
        motionRef.current.style.opacity = '1';
        motionRef.current.style.transform = 'translate(0, 0)';
      }
    }, (delay + duration) * 1000 + 100); // Animation delay + duration + buffer

    return () => clearTimeout(timer);
  }, [delay, duration]);

  return (
    <motion.div
      ref={motionRef}
      initial={{ opacity: 0, ...directions[direction] }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ delay, duration }}
      onAnimationComplete={() => {
        if (motionRef.current) {
          motionRef.current.style.opacity = '1';
          motionRef.current.style.transform = 'translate(0, 0)';
        }
      }}
    >
      {children}
    </motion.div>
  );
};

export default FadeIn;
