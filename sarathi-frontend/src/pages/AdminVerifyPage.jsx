import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { authService } from '../services/authService';

function AdminVerifyPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const email = location.state?.email || '';

    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await authService.adminConfirmSignUp(email, code);
            navigate('/admin/login', { state: { message: 'Verification successful. Please login.' } });
        } catch (err) {
            console.error('Admin verification error:', err);
            setError(err.message || 'Verification failed. Please check your code.');
        } finally {
            setLoading(false);
        }
    };

    if (!email) {
        return (
            <div className="min-h-screen bg-navy flex flex-col items-center justify-center p-4">
                <p className="text-white font-body mb-4">No email provided for verification.</p>
                <Link to="/admin/signup" className="text-saffron hover:underline font-body">Go to Signup</Link>
            </div>
        );
    }

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-navy flex items-center justify-center px-4 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
                <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-saffron rounded-full filter blur-[100px] animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-600 rounded-full filter blur-[120px] animate-pulse" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md z-10"
            >
                <div className="bg-navy-mid/50 backdrop-blur-xl border border-navy-light/30 rounded-2xl p-8 shadow-2xl">
                    <div className="text-center mb-8">
                        <h1 className="font-display text-3xl text-white mb-2 underline decoration-saffron decoration-4 underline-offset-8">
                            Verify <span className="text-saffron">Email</span>
                        </h1>
                        <p className="font-body text-gray-400 mt-4 leading-relaxed">
                            We've sent a 6-digit confirmation code to: <br />
                            <strong className="text-white text-base">{email}</strong>
                        </p>
                    </div>

                    {error && (
                        <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-500 text-sm font-body text-center">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <input
                                type="text"
                                value={code}
                                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                className="w-full h-14 px-4 rounded-xl bg-navy border border-navy-light/50 text-white font-mono text-center text-2xl tracking-widest focus:outline-none focus:border-saffron transition-colors"
                                placeholder="000000"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full h-12 bg-saffron hover:bg-saffron-light text-white font-body font-bold rounded-xl shadow-lg shadow-saffron/20 transform active:scale-[0.98] transition-all disabled:opacity-50"
                        >
                            {loading ? 'Verifying...' : 'Confirm OTP'}
                        </button>

                        <div className="text-center mt-6">
                            <Link to="/admin/login" className="font-body text-sm text-gray-400 hover:text-white transition-colors">
                                Back to Login
                            </Link>
                        </div>
                    </form>
                </div>
            </motion.div>
        </div>
    );
}

export default AdminVerifyPage;
