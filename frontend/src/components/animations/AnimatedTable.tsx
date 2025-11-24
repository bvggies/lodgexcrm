import React from 'react';
import { Table } from 'antd';
import type { TableProps } from 'antd/es/table';

interface AnimatedTableProps<T> extends TableProps<T> {
  delay?: number;
}

// Animations temporarily disabled
function AnimatedTable<T extends object = any>({ ...tableProps }: AnimatedTableProps<T>) {
  return <Table {...tableProps} />;
}

export default AnimatedTable;
