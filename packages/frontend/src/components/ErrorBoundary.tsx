import { Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';
import { logger } from '@/utils/logger';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--theme-layout-bg,#f9fafb)] px-4">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-6">
              <span role="img" aria-label="warning">&#x26A0;&#xFE0F;</span>
            </div>
            <h1 className="text-2xl font-bold text-[var(--theme-dashboard-title,#111)] mb-3">
              Something went wrong
            </h1>
            <p className="text-[var(--theme-dashboard-text-muted,#666)] mb-6">
              An unexpected error occurred. Please try again.
            </p>
            {import.meta.env.DEV && this.state.error && (
              <pre className="text-left text-xs bg-red-50 text-red-700 p-3 rounded-lg mb-6 overflow-auto max-h-32 border border-red-200">
                {this.state.error.message}
              </pre>
            )}
            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="px-5 py-2.5 rounded-lg bg-[var(--theme-dashboard-accent,#3b82f6)] text-white font-medium hover:opacity-90 transition-opacity"
              >
                Try Again
              </button>
              <button
                onClick={this.handleGoHome}
                className="px-5 py-2.5 rounded-lg border border-[var(--theme-dashboard-card-border,#e5e7eb)] text-[var(--theme-dashboard-text-muted,#666)] font-medium hover:bg-[var(--theme-dashboard-section-header-bg,#f3f4f6)] transition-colors"
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
