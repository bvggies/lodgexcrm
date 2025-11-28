import React from 'react';
import { Button, Tooltip, Dropdown, Space } from 'antd';
import { GlobalOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { MenuProps } from 'antd';

const LanguageSwitcher: React.FC = () => {
  const { i18n, t } = useTranslation();

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
    // Update document direction for RTL languages
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  };

  const menuItems: MenuProps['items'] = [
    {
      key: 'en',
      label: (
        <Space>
          <span>🇬🇧</span>
          <span>{t('language.english')}</span>
          {i18n.language === 'en' && <span>✓</span>}
        </Space>
      ),
      onClick: () => handleLanguageChange('en'),
    },
    {
      key: 'ar',
      label: (
        <Space>
          <span>🇸🇦</span>
          <span>{t('language.arabic')}</span>
          {i18n.language === 'ar' && <span>✓</span>}
        </Space>
      ),
      onClick: () => handleLanguageChange('ar'),
    },
  ];

  return (
    <Tooltip title={t('language.switchLanguage')}>
      <Dropdown menu={{ items: menuItems }} placement="bottomRight">
        <Button
          type="text"
          icon={<GlobalOutlined />}
          style={{
            fontSize: '18px',
            width: 40,
            height: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        />
      </Dropdown>
    </Tooltip>
  );
};

export default LanguageSwitcher;
