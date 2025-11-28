import React from 'react';
import { Button, Tooltip } from 'antd';
import { SunOutlined, MoonOutlined } from '@ant-design/icons';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { toggleTheme } from '../store/slices/themeSlice';
import { useTranslation } from 'react-i18next';

const ThemeToggle: React.FC = () => {
  const dispatch = useAppDispatch();
  const { mode } = useAppSelector((state) => state.theme);
  const { t } = useTranslation();

  const handleToggle = () => {
    dispatch(toggleTheme());
  };

  return (
    <Tooltip title={mode === 'light' ? t('theme.switchToDark') : t('theme.switchToLight')}>
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
