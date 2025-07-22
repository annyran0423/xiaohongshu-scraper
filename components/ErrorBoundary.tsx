'use client';

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
}

interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('错误边界捕获到错误:', error, errorInfo);
    
    // 可以在这里发送错误报告到监控服务
    if (typeof window !== 'undefined') {
      // 客户端错误报告
      console.error('Client-side error:', error.message, error.stack);
    }
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return (
        <FallbackComponent
          error={this.state.error!}
          resetError={this.resetError}
        />
      );
    }

    return this.props.children;
  }
}

const DefaultErrorFallback: React.FC<ErrorFallbackProps> = ({ error, resetError }) => {
  const isDevelopment = process.env.NODE_ENV === 'development';

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 max-w-md w-full text-center">
        <div className="flex justify-center mb-4">
          <AlertTriangle className="h-12 w-12 text-red-500" />
        </div>
        
        <h1 className="text-xl font-semibold text-gray-900 mb-2">
          页面出现错误
        </h1>
        
        <p className="text-gray-600 mb-6">
          抱歉，页面运行时出现了问题。请尝试刷新页面或稍后再试。
        </p>

        {isDevelopment && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-left">
            <h3 className="text-sm font-medium text-red-800 mb-2">开发环境错误信息：</h3>
            <pre className="text-xs text-red-700 whitespace-pre-wrap break-words">
              {error.message}
              {error.stack && `\n\n${error.stack}`}
            </pre>
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={resetError}
            className="w-full flex items-center justify-center space-x-2 bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            <span>重新加载</span>
          </button>
          
          <button
            onClick={() => window.location.href = '/'}
            className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
          >
            返回首页
          </button>
        </div>

        <div className="mt-6 text-xs text-gray-500">
          如果问题持续存在，请联系技术支持
        </div>
      </div>
    </div>
  );
};

// 自定义Hook用于函数组件的错误处理
export const useErrorHandler = () => {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const captureError = React.useCallback((error: Error) => {
    console.error('useErrorHandler captured error:', error);
    setError(error);
  }, []);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return { captureError, resetError, error };
};

// 异步错误处理Hook
export const useAsyncError = () => {
  const [, setError] = React.useState<Error | null>(null);

  return React.useCallback(
    (error: Error) => {
      setError(() => {
        throw error;
      });
    },
    []
  );
};

export default ErrorBoundary;
