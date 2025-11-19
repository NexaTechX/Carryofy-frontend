import { Component, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Error Boundary caught an error:', error, info);
  }

  reset = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[200px] rounded-2xl border border-red-500/30 bg-red-500/10 px-6 py-8 text-center text-sm text-red-200">
          <p className="text-lg font-semibold mb-2 text-red-100">Something went wrong.</p>
          <p className="mb-4 text-red-200/80">
            Please try refreshing the page. If the issue persists, contact support and share what you were doing.
          </p>
          <button
            onClick={this.reset}
            className="inline-flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2 text-xs font-semibold text-black hover:bg-red-400 transition"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
