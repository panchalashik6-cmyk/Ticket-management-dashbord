import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import '../styles/ErrorMessage.css';

function ErrorMessage({
  title = 'Something went wrong',
  message = 'Unable to load records from the server.',
  onRetry
}) {
  return (
    <div className="error-message-card" role="alert">
      <div className="error-message-icon">
        <AlertTriangle size={22} />
      </div>
      <h3 className="error-message-title">{title}</h3>
      <p className="error-message-text">{message}</p>
      {onRetry && (
        <button type="button" className="btn btn-danger" onClick={onRetry}>
          <RefreshCw size={15} />
          <span>Try Again</span>
        </button>
      )}
    </div>
  );
}

// React Error Boundary to catch unexpected component render errors
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      errorMessage: error?.message || 'An unexpected UI error occurred.'
    };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '32px' }}>
          <ErrorMessage
            title="Application Render Error"
            message={this.state.errorMessage}
            onRetry={() => {
              this.setState({ hasError: false, errorMessage: '' });
              window.location.href = '/';
            }}
          />
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorMessage;
