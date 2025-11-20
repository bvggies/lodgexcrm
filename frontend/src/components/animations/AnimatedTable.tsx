import React from 'react';
import { Table } from 'antd';
import { motion } from 'framer-motion';
import type { TableProps } from 'antd/es/table';

interface AnimatedTableProps<T> extends TableProps<T> {
  delay?: number;
}

function AnimatedTable<T extends object = any>({
  delay = 0.2,
  ...tableProps
}: AnimatedTableProps<T>) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
    >
      <Table {...tableProps} />
    </motion.div>
  );
}

export default AnimatedTable;
