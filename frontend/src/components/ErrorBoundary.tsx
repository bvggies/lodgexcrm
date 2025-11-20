import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Result, Button } from 'antd';
import { HomeOutlined, ReloadOutlined } from '@ant-design/icons';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <Result
          status="500"
          title="500"
          subTitle="Sorry, something went wrong."
          extra={[
            <Button type="primary" key="home" icon={<HomeOutlined />} onClick={this.handleReset}>
              Go Home
            </Button>,
            <Button key="reload" icon={<ReloadOutlined />} onClick={this.handleReload}>
              Reload Page
            </Button>,
          ]}
        >
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <div style={{ marginTop: 24, textAlign: 'left' }}>
              <pre
                style={{ background: '#f5f5f5', padding: 16, borderRadius: 4, overflow: 'auto' }}
              >
                {this.state.error.toString()}
                {this.state.error.stack}
              </pre>
            </div>
          )}
        </Result>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
