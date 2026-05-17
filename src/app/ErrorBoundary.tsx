import { Component, type ErrorInfo, type ReactNode } from "react";
import { BootFallback } from "@/app/BootFallback";

type ErrorBoundaryProps = {
  children: ReactNode;
};

type ErrorBoundaryState = {
  error?: Error;
};

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = {};

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("SuperTerminal render error", error, info);
  }

  render() {
    if (this.state.error) {
      return <BootFallback error={this.state.error} />;
    }

    return this.props.children;
  }
}
