import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { authService } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

export default function PanchayatLoginPage() {
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const navigate = useNavigate();
    const location = useLocation();
    const successMessage = location.state?.message || '';
    const from = location.state?.from?.pathname || '/panchayat';

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await authService.panchayatSignIn(email, password);
            login(email, 'panchayat');
            navigate(from, { replace: true });
        } catch (err) {
            const errorMap = {
                UserNotConfirmedException: null, // handled below
                NotAuthorizedException: 'Incorrect email or password.',
                UserNotFoundException: 'No account found with this email.',
                TooManyRequestsException: 'Too many login attempts. Please try again later.',
                PasswordResetRequiredException: 'A password reset is required.',
            };
            if (err.name === 'UserNotConfirmedException') {
                navigate('/panchayat/verify', { state: { email } });
            } else {
                setError(errorMap[err.name] || err.message || 'Failed to login');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-off-white flex flex-col items-center justify-center px-4 py-12">
            <div className="w-full max-w-md bg-white rounded-xl border border-gray-200 shadow-card p-8">

                {/* Badge — teal accent for Panchayat */}
                <div className="flex justify-center mb-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-teal-50 border border-teal-500/50 text-teal-600 font-body text-xs font-semibold tracking-wide uppercase">
                        Panchayat Official Portal
                    </span>
                </div>

                {/* Header */}
                <div className="text-center mb-6">
                    <h1 className="font-display text-3xl text-gray-900 mt-4 mb-2">Panchayat Login</h1>
                    <p className="font-body text-sm text-gray-500">Sign in to manage your village dashboard</p>
                </div>

                {/* Success message */}
                {successMessage && (
                    <div className="mb-4 p-3 bg-success/10 border border-success/20 text-success rounded-lg font-body text-sm">
                        {successMessage}
                    </div>
                )}

                {/* Error message */}
                {error && (
                    <div className="mb-4 p-3 bg-danger/10 border border-danger/20 text-danger rounded-lg font-body text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block font-body text-sm font-medium text-gray-700 mb-1">
                            Email
                        </label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full h-11 px-4 rounded-lg border border-gray-300 bg-white font-body text-sm text-gray-900 focus:outline-none focus:border-saffron focus:ring-2 focus:ring-saffron/20 transition-colors placeholder:text-gray-400"
                            placeholder="official@panchayat.gov.in"
                        />
                    </div>

                    <div>
                        <label className="block font-body text-sm font-medium text-gray-700 mb-1">
                            Password
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full h-11 px-4 rounded-lg border border-gray-300 bg-white font-body text-sm text-gray-900 focus:outline-none focus:border-saffron focus:ring-2 focus:ring-saffron/20 transition-colors placeholder:text-gray-400"
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none p-1"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        <div className="flex justify-end mt-1">
                            <Link to="/panchayat/forgot-password" className="font-body text-xs text-saffron hover:underline">
                                Forgot Password?
                            </Link>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full h-11 rounded-lg bg-saffron text-white font-body text-sm font-semibold hover:bg-saffron-light transition-colors shadow-saffron disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center mt-2"
                    >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Log In'}
                    </button>
                </form>

                <p className="mt-6 text-center font-body text-sm text-gray-500">
                    New panchayat official?{' '}
                    <Link to="/panchayat/signup" className="text-saffron hover:underline font-body text-sm font-medium">
                        Create account
                    </Link>
                </p>
                <p className="mt-3 text-center font-body text-xs text-gray-400">
                    Are you a citizen?{' '}
                    <Link to="/citizen/login" className="text-teal-600 hover:underline">
                        Citizen Login →
                    </Link>
                </p>
            </div>
        </div>
    );
}
