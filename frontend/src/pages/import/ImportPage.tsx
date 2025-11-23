import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Typography,
  Button,
  Upload,
  Select,
  Space,
  Alert,
  Table,
  Tag,
  message,
  Divider,
  Descriptions,
  InputNumber,
  Checkbox,
} from 'antd';
import {
  UploadOutlined,
  DownloadOutlined,
  FileExcelOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import { importApi, ImportResult } from '../../services/api/importApi';
import FadeIn from '../../components/animations/FadeIn';
import type { UploadFile, RcFile } from 'antd/es/upload/interface';

const { Title, Text } = Typography;
const { Option } = Select;

type ImportType =
  | 'properties'
  | 'guests'
  | 'bookings'
  | 'finance'
  | 'owners'
  | 'staff'
  | 'units'
  | 'cleaning_tasks'
  | 'maintenance_tasks';

const ImportPage: React.FC = () => {
  const navigate = useNavigate();
  const [importType, setImportType] = useState<ImportType>('properties');
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isHistoricalData, setIsHistoricalData] = useState(false);
  const [historicalYear, setHistoricalYear] = useState<number>(new Date().getFullYear() - 1);

  // Map import types to their corresponding routes
  const getRouteForImportType = (type: ImportType): string => {
    const routeMap: Record<ImportType, string> = {
      properties: '/properties',
      units: '/units',
      guests: '/guests',
      bookings: '/bookings',
      finance: '/finance',
      owners: '/owners',
      staff: '/staff',
      cleaning_tasks: '/cleaning',
      maintenance_tasks: '/maintenance',
    };
    return routeMap[type] || '/';
  };

  const handleDownloadTemplate = async () => {
    try {
      setLoading(true);
      const response = await importApi.downloadTemplate(importType);

      // Create blob and download
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `lodgexcrm-${importType}-template.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      message.success('Template downloaded successfully');
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to download template');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (fileList.length === 0) {
      message.error('Please select a file to upload');
      return;
    }

    const file = fileList[0].originFileObj as File;
    if (!file) {
      message.error('Invalid file');
      return;
    }

    try {
      setLoading(true);
      setImportResult(null);

      const response = await importApi.importData(file, importType, {
        isHistoricalData,
        historicalYear: isHistoricalData ? historicalYear : undefined,
      });
      setImportResult(response.data.data);

      if (response.data.data.failed === 0) {
        message.success(`Successfully imported ${response.data.data.imported} records`);
        // Navigate to the appropriate page after successful import
        setTimeout(() => {
          navigate(getRouteForImportType(importType));
        }, 1500);
      } else {
        message.warning(
          `Imported ${response.data.data.imported} records, ${response.data.data.failed} failed`
        );
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to import data');
    } finally {
      setLoading(false);
    }
  };

  const uploadProps = {
    accept: '.xlsx,.xls',
    fileList,
    beforeUpload: (file: RcFile) => {
      const isExcel =
        file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.type === 'application/vnd.ms-excel';
      if (!isExcel) {
        message.error('You can only upload Excel files!');
        return false;
      }
      const isLt10M = file.size / 1024 / 1024 < 10;
      if (!isLt10M) {
        message.error('File must be smaller than 10MB!');
        return false;
      }
      setFileList([{ uid: '-1', name: file.name, status: 'done', originFileObj: file }]);
      return false; // Prevent auto upload
    },
    onRemove: () => {
      setFileList([]);
      setImportResult(null);
    },
  };

  const errorColumns = [
    {
      title: 'Error',
      dataIndex: 'error',
      key: 'error',
    },
  ];

  const warningColumns = [
    {
      title: 'Warning',
      dataIndex: 'warning',
      key: 'warning',
    },
  ];

  return (
    <div>
      <FadeIn>
        <Title level={2}>Data Import</Title>
        <Text type="secondary">
          Import historical data from Excel files. Download a template, fill it with your data, and
          upload it.
        </Text>
      </FadeIn>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
        <Card style={{ marginTop: 24 }}>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <div>
              <Text strong>Step 1: Select Data Type</Text>
              <Select
                value={importType}
                onChange={setImportType}
                style={{ width: 200, marginLeft: 16 }}
              >
                <Option value="properties">Properties</Option>
                <Option value="units">Units</Option>
                <Option value="guests">Guests</Option>
                <Option value="bookings">Bookings</Option>
                <Option value="finance">Finance Records</Option>
                <Option value="owners">Owners</Option>
                <Option value="staff">Staff</Option>
                <Option value="cleaning_tasks">Cleaning Tasks</Option>
                <Option value="maintenance_tasks">Maintenance Tasks</Option>
              </Select>
            </div>

            <Divider />

            <div>
              <Text strong>Step 2: Download Template</Text>
              <br />
              <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 8 }}>
                Download the Excel template for {importType}. The template includes:
              </Text>
              <ul style={{ fontSize: 12, color: '#666', marginTop: 8, marginBottom: 8 }}>
                <li>An "Instructions" sheet with detailed field descriptions</li>
                <li>Example rows showing the correct format</li>
                <li>All required and optional fields clearly marked</li>
              </ul>
              <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 8 }}>
                Fill the template with your data (delete example rows), then upload it.
              </Text>
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                onClick={handleDownloadTemplate}
                loading={loading}
                style={{ marginTop: 8 }}
              >
                Download Template
              </Button>
            </div>

            <Divider />

            <div>
              <Text strong>Step 3: Historical Data Options (Optional)</Text>
              <br />
              <Space direction="vertical" style={{ marginTop: 8, width: '100%' }}>
                <div>
                  <Checkbox
                    checked={isHistoricalData}
                    onChange={(e) => setIsHistoricalData(e.target.checked)}
                  >
                    <Text>This is historical data from previous years</Text>
                  </Checkbox>
                </div>
                {isHistoricalData && (
                  <div>
                    <Text type="secondary" style={{ marginRight: 8 }}>
                      Year of data:
                    </Text>
                    <InputNumber
                      min={2000}
                      max={new Date().getFullYear()}
                      value={historicalYear}
                      onChange={(value) => setHistoricalYear(value || new Date().getFullYear())}
                      style={{ width: 120 }}
                    />
                  </div>
                )}
                {isHistoricalData && (
                  <Alert
                    message="Historical Data Import"
                    description="Historical data will be imported with the specified year. This is useful for importing past bookings, finance records, and other data from previous years. The system will preserve the original dates from your Excel file."
                    type="info"
                    showIcon
                    style={{ marginTop: 8 }}
                  />
                )}
              </Space>
            </div>

            <Divider />

            <div>
              <Text strong>Step 4: Upload Filled Excel File</Text>
              <br />
              <Upload {...uploadProps} style={{ marginTop: 8 }}>
                <Button icon={<UploadOutlined />}>Select Excel File</Button>
              </Upload>
              {fileList.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  <FileExcelOutlined style={{ marginRight: 8 }} />
                  <Text>{fileList[0].name}</Text>
                </div>
              )}
            </div>

            <Divider />

            <Button
              type="primary"
              size="large"
              onClick={handleImport}
              loading={loading}
              disabled={fileList.length === 0}
              icon={<UploadOutlined />}
            >
              Import Data
            </Button>
          </Space>
        </Card>

        {importResult && (
          <Card style={{ marginTop: 24 }}>
            <Title level={4}>Import Results</Title>
            <Descriptions bordered column={2} style={{ marginBottom: 24 }}>
              <Descriptions.Item label="Total Records">{importResult.total}</Descriptions.Item>
              <Descriptions.Item label="Successfully Imported">
                <Tag color="green" icon={<CheckCircleOutlined />}>
                  {importResult.imported}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Failed">
                <Tag color="red" icon={<CloseCircleOutlined />}>
                  {importResult.failed}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Warnings">
                <Tag color="orange">{importResult.warnings.length}</Tag>
              </Descriptions.Item>
            </Descriptions>

            {importResult.errors.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <Title level={5}>Errors ({importResult.errors.length})</Title>
                <Table
                  dataSource={importResult.errors.map((error, index) => ({ key: index, error }))}
                  columns={errorColumns}
                  pagination={{ pageSize: 10 }}
                  size="small"
                />
              </div>
            )}

            {importResult.warnings.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <Title level={5}>Warnings ({importResult.warnings.length})</Title>
                <Table
                  dataSource={importResult.warnings.map((warning, index) => ({
                    key: index,
                    warning,
                  }))}
                  columns={warningColumns}
                  pagination={{ pageSize: 10 }}
                  size="small"
                />
              </div>
            )}
          </Card>
        )}

        <Card style={{ marginTop: 24 }}>
          <Alert
            message="Import Guidelines"
            description={
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                <li>
                  <strong>Download the template</strong> - Each template includes an "Instructions"
                  sheet with detailed field descriptions
                </li>
                <li>
                  <strong>Read the instructions</strong> - Check the Instructions sheet in the
                  downloaded Excel file for field requirements
                </li>
                <li>
                  <strong>Fill in your data</strong> - Delete the example rows and add your actual
                  data (keep the header row)
                </li>
                <li>
                  <strong>Required fields</strong> - Make sure all required fields are filled
                  (marked in Instructions sheet)
                </li>
                <li>
                  <strong>Date format</strong> - Dates must be in YYYY-MM-DD format (e.g.,
                  2024-01-15)
                </li>
                <li>
                  <strong>JSON fields</strong> - Address and other JSON fields must be valid JSON
                  strings (see examples in template)
                </li>
                <li>
                  <strong>Unique identifiers</strong> - Email addresses, property codes, etc. must
                  be unique
                </li>
                <li>
                  <strong>Duplicate handling</strong> - Duplicate records (by email/code) will be
                  skipped with a warning
                </li>
                <li>
                  <strong>File size</strong> - Maximum file size: 10MB
                </li>
                <li>
                  <strong>Historical data</strong> - Use the historical data option for importing
                  past years' data
                </li>
              </ul>
            }
            type="info"
            showIcon
          />
        </Card>
      </motion.div>
    </div>
  );
};

export default ImportPage;
