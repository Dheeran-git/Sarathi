import React, { Component } from 'react';
import { motion } from 'framer-motion';

class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("ErrorBoundary caught an error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-navy flex items-center justify-center p-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="max-w-md w-full bg-navy-mid border border-red-500/30 p-8 rounded-2xl shadow-xl text-center"
                    >
                        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <span className="text-red-500 text-3xl">⚠️</span>
                        </div>
                        <h1 className="font-display text-2xl font-bold text-white mb-2">Something went wrong</h1>
                        <p className="font-body text-gray-400 text-sm mb-6">
                            {this.state.error?.message || "An unexpected error occurred in the component tree."}
                        </p>
                        <button
                            onClick={() => {
                                this.setState({ hasError: false, error: null });
                                window.location.reload();
                            }}
                            className="px-6 py-2 bg-saffron hover:bg-saffron-light text-white font-body rounded-xl transition-colors"
                        >
                            Refresh Page
                        </button>
                    </motion.div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
