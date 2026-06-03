import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  onRetry: () => void;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

export default class AIErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorMessage: "" };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error.message || "未知错误" };
  }

  handleRetry = () => {
    this.setState({ hasError: false, errorMessage: "" });
    this.props.onRetry();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 text-center">
          <p className="text-xs text-error mb-2">
            AI 助手出错: {this.state.errorMessage}
          </p>
          <button
            type="button"
            onClick={this.handleRetry}
            className="px-3 py-1 text-xs bg-amber text-ink-bg rounded hover:bg-amber-hover transition-ink"
          >
            重试
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
