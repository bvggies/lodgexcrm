import React from 'react';

interface LogoProps {
  height?: number;
  showText?: boolean;
  style?: React.CSSProperties;
}

const Logo: React.FC<LogoProps> = ({ height = 40, showText = true, style }) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, ...style }}>
      <img
        src="/logo.svg"
        alt="Lodgex CRM"
        style={{ height, width: 'auto' }}
        onError={(e) => {
          // Fallback if logo doesn't load
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
          if (target.nextElementSibling) {
            (target.nextElementSibling as HTMLElement).style.display = 'block';
          }
        }}
      />
      {showText && (
        <span
          style={{
            fontSize: height * 0.6,
            fontWeight: 'bold',
            background: 'linear-gradient(135deg, #1890ff 0%, #722ed1 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Lodgex CRM
        </span>
      )}
      <span
        style={{
          display: 'none',
          fontSize: height * 0.6,
          fontWeight: 'bold',
          color: '#1890ff',
        }}
      >
        Lodgex CRM
      </span>
    </div>
  );
};

export default Logo;
