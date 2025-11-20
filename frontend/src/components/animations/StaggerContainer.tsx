import React from 'react';
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
      staggerChildren: 0.1,
    },
  },
};

const StaggerContainer: React.FC<StaggerContainerProps> = ({ children, staggerDelay = 0.1 }) => {
  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      {children}
    </motion.div>
  );
};

export default StaggerContainer;
