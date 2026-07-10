import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui';

interface Props {
  children: ReactNode;
}
interface State {
  hasError: boolean;
  message?: string;
}

/** Catches render-time errors anywhere in the tree and shows a recovery UI. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Uncaught error:', error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, message: undefined });
    window.location.assign('/dashboard');
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 px-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 text-red-600">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Something went wrong</h1>
          <p className="max-w-md text-sm text-slate-500">
            An unexpected error occurred. Try reloading the page.
            {this.state.message ? ` (${this.state.message})` : ''}
          </p>
          <Button onClick={this.handleReset}>Back to dashboard</Button>
        </div>
      );
    }
    return this.props.children;
  }
}
