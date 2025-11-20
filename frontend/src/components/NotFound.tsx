import React from 'react';
import { Result, Button } from 'antd';
import { HomeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Result
      status="404"
      title="404"
      subTitle="Sorry, the page you visited does not exist."
      extra={
        <Button type="primary" icon={<HomeOutlined />} onClick={() => navigate('/')}>
          Back Home
        </Button>
      }
    />
  );
};

export default NotFound;
