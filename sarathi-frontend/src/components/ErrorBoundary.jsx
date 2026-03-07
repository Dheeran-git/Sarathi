import React from 'react';
import { Link } from 'react-router-dom';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('[ErrorBoundary]', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-off-white flex items-center justify-center px-4">
                    <div className="text-center max-w-md">
                        <p className="font-display text-6xl text-gray-200 mb-4">Oops</p>
                        <p className="font-body text-gray-600 mb-2">Something went wrong.</p>
                        <p className="font-body text-sm text-gray-400 mb-6">
                            {this.state.error?.message || 'An unexpected error occurred.'}
                        </p>
                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={() => this.setState({ hasError: false, error: null })}
                                className="px-5 py-2 rounded-lg bg-saffron text-white font-body text-sm font-semibold hover:bg-saffron-light transition-colors"
                            >
                                Try Again
                            </button>
                            <Link
                                to="/"
                                className="px-5 py-2 rounded-lg border border-gray-300 text-gray-600 font-body text-sm font-semibold hover:bg-gray-50 transition-colors"
                            >
                                Go Home
                            </Link>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
