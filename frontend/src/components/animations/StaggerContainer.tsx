import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface StaggerContainerProps {
  children: React.ReactNode;
  staggerDelay?: number;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0,
    },
  },
};

const StaggerContainer: React.FC<StaggerContainerProps> = ({ children, staggerDelay = 0.1 }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Force visibility after animation should complete
  useEffect(() => {
    const timer = setTimeout(() => {
      if (containerRef.current) {
        containerRef.current.style.opacity = '1';
      }
    }, 1000); // Buffer time for all animations

    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div 
      ref={containerRef}
      variants={containerVariants} 
      initial="hidden" 
      animate="visible"
      onAnimationComplete={() => {
        if (containerRef.current) {
          containerRef.current.style.opacity = '1';
        }
      }}
    >
      {children}
    </motion.div>
  );
};

export default StaggerContainer;
