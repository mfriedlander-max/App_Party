import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
  readonly children: ReactNode;
}

interface State {
  readonly hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Log to console in development; replace with error reporting service in prod
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.error('[ErrorBoundary]', error, info.componentStack);
    }
  }

  private handleRetry = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-base flex flex-col items-center justify-center p-6 text-center">
          <div className="text-6xl mb-6" role="img" aria-label="Error">
            💥
          </div>
          <h1 className="text-text-primary text-2xl font-bold mb-2">Something went wrong</h1>
          <p className="text-text-secondary text-base mb-8 max-w-xs">
            An unexpected error occurred. Please try again.
          </p>
          <button
            onClick={this.handleRetry}
            className="bg-glow text-base-900 font-semibold px-6 py-3 rounded-2xl hover:opacity-90 active:scale-95 transition-all"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
