import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';

function AdminLoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await authService.adminSignIn(email, password);
            if (response.AuthenticationResult) {
                await login(email, 'admin');
                navigate('/admin');
            }
        } catch (err) {
            console.error('Admin login error:', err);
            setError(err.message || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-navy flex items-center justify-center px-4 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
                <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-saffron rounded-full filter blur-[100px] animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-red-600 rounded-full filter blur-[120px] animate-pulse" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md z-10"
            >
                <div className="bg-navy-mid/50 backdrop-blur-xl border border-navy-light/30 rounded-2xl p-8 shadow-2xl">
                    <div className="text-center mb-8">
                        <h1 className="font-display text-3xl text-white mb-2 underline decoration-saffron decoration-4 underline-offset-8">
                            Admin <span className="text-saffron">Portal</span>
                        </h1>
                        <p className="font-body text-gray-400 mt-4">Authorized access only</p>
                    </div>

                    {error && (
                        <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-500 text-sm font-body text-center">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-body font-medium text-gray-300 mb-2">Admin Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full h-12 px-4 rounded-xl bg-navy border border-navy-light/50 text-white font-body focus:outline-none focus:border-saffron transition-colors"
                                placeholder="admin@sarathi.gov.in"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-body font-medium text-gray-300 mb-2">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full h-12 px-4 rounded-xl bg-navy border border-navy-light/50 text-white font-body focus:outline-none focus:border-saffron transition-colors"
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full h-12 bg-saffron hover:bg-saffron-light text-white font-body font-bold rounded-xl shadow-lg shadow-saffron/20 transform active:scale-[0.98] transition-all disabled:opacity-50"
                        >
                            {loading ? 'Authenticating...' : 'Login to Admin Dashboard'}
                        </button>

                        <div className="text-center mt-6">
                            <p className="font-body text-sm text-gray-400">
                                Need administrative access?{' '}
                                <Link to="/admin/signup" className="text-saffron hover:underline font-bold">Request Access / Sign Up</Link>
                            </p>
                        </div>
                    </form>
                </div>
            </motion.div>
        </div>
    );
}

export default AdminLoginPage;
