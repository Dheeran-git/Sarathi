import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { authService } from '../services/authService';

function AdminSignupPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            return setError('Passwords do not match');
        }

        if (password.length < 8) {
            return setError('Password must be at least 8 characters long');
        }

        setLoading(true);

        try {
            await authService.adminSignUp(email, password);
            navigate('/admin/verify', { state: { email } });
        } catch (err) {
            console.error('Admin signup error:', err);
            setError(err.message || 'Registration failed. Please try again.');
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
                            Admin <span className="text-saffron">Registration</span>
                        </h1>
                        <p className="font-body text-gray-400 mt-4">Join the central administrative team</p>
                    </div>

                    {error && (
                        <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-500 text-sm font-body text-center">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-body font-medium text-gray-300 mb-2">Official Email</label>
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
                                minLength={8}
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-body font-medium text-gray-300 mb-2">Confirm Password</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full h-12 px-4 rounded-xl bg-navy border border-navy-light/50 text-white font-body focus:outline-none focus:border-saffron transition-colors"
                                placeholder="••••••••"
                                minLength={8}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full h-12 mt-4 bg-saffron hover:bg-saffron-light text-white font-body font-bold rounded-xl shadow-lg shadow-saffron/20 transform active:scale-[0.98] transition-all disabled:opacity-50"
                        >
                            {loading ? 'Registering...' : 'Complete Registration'}
                        </button>

                        <div className="text-center mt-6">
                            <p className="font-body text-sm text-gray-400">
                                Already have an account?{' '}
                                <Link to="/admin/login" className="text-saffron hover:underline font-bold">Login</Link>
                            </p>
                        </div>
                    </form>
                </div>
            </motion.div>
        </div>
    );
}

export default AdminSignupPage;
