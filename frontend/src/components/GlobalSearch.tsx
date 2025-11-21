import React, { useState, useEffect } from 'react';
import { Input, AutoComplete, Empty } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { bookingsApi } from '../services/api/bookingsApi';
import { guestsApi } from '../services/api/guestsApi';
import { propertiesApi } from '../services/api/propertiesApi';
import type { AutoCompleteProps } from 'antd/es/auto-complete';

interface SearchResult {
  type: 'booking' | 'guest' | 'property';
  id: string;
  title: string;
  description: string;
  link: string;
}

const GlobalSearch: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [options, setOptions] = useState<AutoCompleteProps['options']>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const search = async () => {
      if (!searchText || searchText.length < 2) {
        setOptions([]);
        return;
      }

      setLoading(true);
      try {
        const [bookingsRes, guestsRes, propertiesRes] = await Promise.all([
          bookingsApi
            .getAll({ search: searchText })
            .catch(() => ({ data: { data: { bookings: [] } } })),
          guestsApi
            .getAll({ search: searchText })
            .catch(() => ({ data: { data: { guests: [] } } })),
          propertiesApi
            .getAll({ search: searchText })
            .catch(() => ({ data: { data: { properties: [] } } })),
        ]);

        const results: SearchResult[] = [];

        // Add bookings
        bookingsRes.data.data.bookings?.slice(0, 5).forEach((booking: any) => {
          results.push({
            type: 'booking',
            id: booking.id,
            title: `Booking: ${booking.reference}`,
            description: `${booking.guest?.firstName || ''} ${booking.guest?.lastName || ''} - ${booking.property?.name || ''}`,
            link: `/bookings/${booking.id}`,
          });
        });

        // Add guests
        guestsRes.data.data.guests?.slice(0, 5).forEach((guest: any) => {
          results.push({
            type: 'guest',
            id: guest.id,
            title: `Guest: ${guest.firstName} ${guest.lastName}`,
            description: guest.email || guest.phone || '',
            link: `/guests/${guest.id}`,
          });
        });

        // Add properties
        propertiesRes.data.data.properties?.slice(0, 5).forEach((property: any) => {
          results.push({
            type: 'property',
            id: property.id,
            title: `Property: ${property.name}`,
            description: property.code || '',
            link: `/properties/${property.id}`,
          });
        });

        const groupedOptions: AutoCompleteProps['options'] = [];

        if (results.length > 0) {
          const bookings = results.filter((r) => r.type === 'booking');
          const guests = results.filter((r) => r.type === 'guest');
          const properties = results.filter((r) => r.type === 'property');

          if (bookings.length > 0) {
            groupedOptions.push({
              label: <span style={{ fontWeight: 600, color: '#1890ff' }}>Bookings</span>,
              options: bookings.map((r) => ({
                value: r.link,
                label: (
                  <div>
                    <div style={{ fontWeight: 500 }}>{r.title}</div>
                    <div style={{ fontSize: '12px', color: '#999' }}>{r.description}</div>
                  </div>
                ),
              })),
            });
          }

          if (guests.length > 0) {
            groupedOptions.push({
              label: <span style={{ fontWeight: 600, color: '#52c41a' }}>Guests</span>,
              options: guests.map((r) => ({
                value: r.link,
                label: (
                  <div>
                    <div style={{ fontWeight: 500 }}>{r.title}</div>
                    <div style={{ fontSize: '12px', color: '#999' }}>{r.description}</div>
                  </div>
                ),
              })),
            });
          }

          if (properties.length > 0) {
            groupedOptions.push({
              label: <span style={{ fontWeight: 600, color: '#fa8c16' }}>Properties</span>,
              options: properties.map((r) => ({
                value: r.link,
                label: (
                  <div>
                    <div style={{ fontWeight: 500 }}>{r.title}</div>
                    <div style={{ fontSize: '12px', color: '#999' }}>{r.description}</div>
                  </div>
                ),
              })),
            });
          }
        } else {
          groupedOptions.push({
            label: <Empty description="No results found" image={Empty.PRESENTED_IMAGE_SIMPLE} />,
            options: [],
          });
        }

        setOptions(groupedOptions);
      } catch (error) {
        console.error('Search error:', error);
        setOptions([]);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(search, 300);
    return () => clearTimeout(timeoutId);
  }, [searchText]);

  const handleSelect = (value: string) => {
    navigate(value);
    setSearchText('');
    setOptions([]);
  };

  return (
    <AutoComplete
      value={searchText}
      onChange={setSearchText}
      onSelect={handleSelect}
      options={options}
      style={{ width: 400 }}
      placeholder="Search bookings, guests, properties..."
      allowClear
      notFoundContent={loading ? 'Searching...' : null}
    >
      <Input
        prefix={<SearchOutlined />}
        placeholder="Search bookings, guests, properties..."
        allowClear
      />
    </AutoComplete>
  );
};

export default GlobalSearch;
