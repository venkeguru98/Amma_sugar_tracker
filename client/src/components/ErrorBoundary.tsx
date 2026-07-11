import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  name?: string;
  isTamil?: boolean;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(
      `[ErrorBoundary] Component crash detected! Widget name: "${this.props.name || 'Unknown'}". Details:`,
      error,
      errorInfo
    );
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      const isTa = this.props.isTamil;
      return (
        <div className="p-5 bg-rose-50 dark:bg-rose-955/10 border border-rose-100 dark:border-rose-900 rounded-3xl text-center space-y-2 shadow-xxs">
          <span className="text-xl block">⚠️</span>
          <h4 className="font-extrabold text-xs text-rose-600 dark:text-rose-400 uppercase tracking-wider">
            {isTa ? "பகுதி பிழை" : "Section Error"}
          </h4>
          <p className="text-xxs font-semibold text-rose-550 dark:text-rose-455 leading-relaxed">
            {isTa 
              ? `${this.props.name || 'இந்தப் பகுதி'}யை ஏற்ற முடியவில்லை.` 
              : `This section "${this.props.name || 'widget'}" couldn't be loaded.`}
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
