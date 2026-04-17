import { Component, type ErrorInfo, type ReactNode } from 'react';
import ErrorState from './ErrorState';

interface Props {
  children: ReactNode;
}

interface State {
  caught: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { caught: false };

  static getDerivedStateFromError(): State {
    return { caught: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(
      '[ErrorBoundary] Uncaught error:',
      error,
      info.componentStack
    );
  }

  render() {
    if (this.state.caught) {
      return (
        <ErrorState
          error={{
            type: 'dataLoadFailed',
            message: 'Something went wrong. Please refresh the page.',
          }}
        />
      );
    }
    return this.props.children;
  }
}
