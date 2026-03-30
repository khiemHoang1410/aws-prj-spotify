import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-4">
          <div className="text-5xl mb-4">😵</div>
          <h2 className="text-xl font-bold text-white mb-2">Có lỗi xảy ra</h2>
          <p className="text-neutral-400 text-sm mb-6 max-w-md">
            {this.state.error?.message || 'Đã xảy ra lỗi không mong muốn.'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-6 py-2 bg-green-500 text-black font-semibold rounded-full hover:bg-green-400 transition"
          >
            Thử lại
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
