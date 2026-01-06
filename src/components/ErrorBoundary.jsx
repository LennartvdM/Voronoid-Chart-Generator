import React from 'react';
import PropTypes from 'prop-types';

/**
 * Error Boundary component for graceful error handling
 * Catches JavaScript errors anywhere in the child component tree
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    // Log error for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary" role="alert">
          <div className="error-icon" aria-hidden="true">⚠️</div>
          <h2 className="error-title">Something went wrong</h2>
          <p className="error-message">
            {this.props.fallbackMessage || 'An unexpected error occurred while rendering the chart.'}
          </p>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details style={{ marginBottom: 16, textAlign: 'left', maxWidth: '100%', overflow: 'auto' }}>
              <summary style={{ cursor: 'pointer', marginBottom: 8 }}>Error details</summary>
              <pre style={{
                fontSize: 11,
                padding: 12,
                background: '#f5f5f5',
                borderRadius: 4,
                overflow: 'auto'
              }}>
                {this.state.error.toString()}
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
          )}
          <button
            className="btn btn-primary"
            onClick={this.handleRetry}
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
  fallbackMessage: PropTypes.string
};
