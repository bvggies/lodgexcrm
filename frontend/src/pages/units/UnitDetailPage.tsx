import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Descriptions,
  Button,
  Space,
  Tag,
  Typography,
  Spin,
  message,
  Empty,
} from 'antd';
import { ArrowLeftOutlined, EditOutlined } from '@ant-design/icons';
import { unitsApi, Unit } from '../../services/api/unitsApi';

const { Title } = Typography;

const UnitDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [unit, setUnit] = useState<Unit | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadUnit();
    }
  }, [id]);

  const loadUnit = async () => {
    try {
      setLoading(true);
      const response = await unitsApi.getById(id!);
      setUnit(response.data.data.unit);
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to load unit details');
      navigate('/units');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!unit) {
    return (
      <Empty
        description="Unit not found"
        style={{ marginTop: '50px' }}
      >
        <Button type="primary" onClick={() => navigate('/units')}>
          Back to Units
        </Button>
      </Empty>
    );
  }

  const statusColors: Record<string, string> = {
    available: 'green',
    occupied: 'blue',
    maintenance: 'orange',
    unavailable: 'red',
  };

  return (
    <div style={{ padding: '24px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Card>
          <Space style={{ marginBottom: '16px' }}>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/units')}>
              Back
            </Button>
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() => navigate(`/units?edit=${unit.id}`)}
            >
              Edit Unit
            </Button>
          </Space>

          <Title level={2}>Unit Details</Title>

          <Descriptions bordered column={{ xs: 1, sm: 2, md: 3 }}>
            <Descriptions.Item label="Unit Code">
              <strong>{unit.unitCode}</strong>
            </Descriptions.Item>
            <Descriptions.Item label="Property">
              {(unit as any).property?.name || 'N/A'} ({(unit as any).property?.code || 'N/A'})
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={statusColors[unit.availabilityStatus] || 'default'}>
                {unit.availabilityStatus.toUpperCase()}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Bedrooms">
              {unit.bedrooms || 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Bathrooms">
              {unit.bathrooms || 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Max Occupancy">
              {unit.maxOccupancy || 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Size (sqft)">
              {unit.size ? `${unit.size} sqft` : 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Monthly Rent">
              {unit.monthlyRent ? `AED ${unit.monthlyRent.toLocaleString()}` : 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Created At">
              {new Date(unit.createdAt).toLocaleString()}
            </Descriptions.Item>
            <Descriptions.Item label="Updated At">
              {new Date(unit.updatedAt).toLocaleString()}
            </Descriptions.Item>
            {(unit as any).description && (
              <Descriptions.Item label="Description" span={3}>
                {(unit as any).description}
              </Descriptions.Item>
            )}
            {(unit as any).amenities && (
              <Descriptions.Item label="Amenities" span={3}>
                {(unit as any).amenities}
              </Descriptions.Item>
            )}
            {(unit as any).notes && (
              <Descriptions.Item label="Notes" span={3}>
                {(unit as any).notes}
              </Descriptions.Item>
            )}
          </Descriptions>
        </Card>
      </Space>
    </div>
  );
};

export default UnitDetailPage;

