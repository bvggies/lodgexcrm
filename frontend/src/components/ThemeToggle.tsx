import React from 'react';
import { Button, Tooltip } from 'antd';
import { SunOutlined, MoonOutlined } from '@ant-design/icons';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { toggleTheme } from '../store/slices/themeSlice';

const ThemeToggle: React.FC = () => {
  const dispatch = useAppDispatch();
  const { mode } = useAppSelector((state) => state.theme);

  const handleToggle = () => {
    dispatch(toggleTheme());
  };

  return (
    <Tooltip title={mode === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}>
      <Button
        type="text"
        icon={mode === 'light' ? <MoonOutlined /> : <SunOutlined />}
        onClick={handleToggle}
        style={{
          fontSize: '18px',
          width: 40,
          height: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      />
    </Tooltip>
  );
};

export default ThemeToggle;
