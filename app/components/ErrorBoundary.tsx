'use client';

import React, { Component, ReactNode, ErrorInfo } from 'react';
import { useAuth } from '../context/AuthContext';
import { isOfflineError } from '../utils/offlineHelper';
import { WifiIcon, ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import Button from './ui/Button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  isOfflineError: boolean;
}

// This component cannot be a function component because it needs to use componentDidCatch
class ErrorBoundaryClass extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      isOfflineError: false
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      isOfflineError: isOfflineError(error)
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null, isOfflineError: false });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex items-center justify-center min-h-screen bg-slate-900 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 max-w-md w-full text-center">
            {this.state.isOfflineError ? (
              <>
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-900/30 mb-4">
                  <WifiIcon className="h-8 w-8 text-yellow-400" />
                </div>
                <h2 className="text-xl font-bold text-white font-heading mb-2">Network Connection Error</h2>
                <p className="text-gray-300 mb-6">
                  You appear to be offline. Please check your internet connection and try again.
                </p>
              </>
            ) : (
              <>
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-900/30 mb-4">
                  <ExclamationTriangleIcon className="h-8 w-8 text-red-400" />
                </div>
                <h2 className="text-xl font-bold text-white font-heading mb-2">Something went wrong</h2>
                <p className="text-gray-300 mb-6">
                  Sorry, an unexpected error has occurred. Please try refreshing the page.
                </p>
                {this.state.error && (
                  <div className="bg-slate-900 p-3 rounded-lg text-left mb-6 overflow-auto max-h-32">
                    <p className="text-sm font-mono text-red-300">{this.state.error.toString()}</p>
                  </div>
                )}
              </>
            )}
            <Button
              variant="primary"
              onClick={this.handleRetry}
              icon={<ArrowPathIcon className="h-5 w-5" />}
            >
              Retry
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Wrapper function component to access hooks
export default function ErrorBoundary({ children, fallback }: Props) {
  const auth = useAuth();
  
  return (
    <ErrorBoundaryClass fallback={fallback}>
      {children}
    </ErrorBoundaryClass>
  );
} 