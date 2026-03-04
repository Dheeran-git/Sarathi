import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/authService';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

const PASSWORD_RULES = [
    { label: 'At least 8 characters', test: (p) => p.length >= 8 },
    { label: 'One uppercase letter', test: (p) => /[A-Z]/.test(p) },
    { label: 'One number', test: (p) => /[0-9]/.test(p) },
    { label: 'One special character', test: (p) => /[^A-Za-z0-9]/.test(p) },
];

export default function SignupPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    // C3: Password strength
    const passwordRules = useMemo(() =>
        PASSWORD_RULES.map((r) => ({ ...r, pass: r.test(password) })),
        [password]
    );
    const passwordStrength = passwordRules.filter((r) => r.pass).length;
    const strengthColor = passwordStrength <= 1 ? 'bg-red-500' : passwordStrength === 2 ? 'bg-amber-500' : 'bg-success';

    const handleSignup = async (e) => {
        e.preventDefault();
        setError('');

        if (passwordStrength < 4) {
            setError('Please use a stronger password.');
            return;
        }
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setIsLoading(true);
        try {
            await authService.citizenSignUp(email, password);
            navigate('/citizen/verify', { state: { email, message: 'Account created! Please verify your email.' } });
        } catch (err) {
            setError(err.message || 'Failed to sign up');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-off-white flex flex-col items-center justify-center px-4 py-12">
            <div className="w-full max-w-md bg-white rounded-xl border border-gray-200 shadow-card p-8">

                {/* Badge */}
                <div className="flex justify-center mb-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-navy text-white font-body text-xs font-semibold tracking-wide uppercase">
                        Citizen Portal
                    </span>
                </div>

                {/* Header */}
                <div className="text-center mb-6">
                    <h1 className="font-display text-3xl text-gray-900 mt-4 mb-2">Create Account</h1>
                    <p className="font-body text-sm text-gray-500">Join Sarathi to discover your benefits</p>
                </div>

                {/* Error message */}
                {error && (
                    <div className="mb-4 p-3 bg-danger/10 border border-danger/20 text-danger rounded-lg font-body text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSignup} className="space-y-4">
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
                            placeholder="you@example.com"
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
                        {/* C3: Strength meter */}
                        {password.length > 0 && (
                            <div className="mt-2">
                                <div className="flex gap-1 mb-2">
                                    {[0, 1, 2, 3].map((i) => (
                                        <div
                                            key={i}
                                            className={`h-1.5 flex-1 rounded-full transition-colors ${i < passwordStrength ? strengthColor : 'bg-gray-200'}`}
                                        />
                                    ))}
                                </div>
                                <ul className="space-y-0.5">
                                    {passwordRules.map((r) => (
                                        <li key={r.label} className={`font-body text-xs flex items-center gap-1 ${r.pass ? 'text-success' : 'text-gray-400'}`}>
                                            <span>{r.pass ? '✓' : '○'}</span> {r.label}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block font-body text-sm font-medium text-gray-700 mb-1">
                            Confirm Password
                        </label>
                        <input
                            type={showPassword ? 'text' : 'password'}
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full h-11 px-4 rounded-lg border border-gray-300 bg-white font-body text-sm text-gray-900 focus:outline-none focus:border-saffron focus:ring-2 focus:ring-saffron/20 transition-colors placeholder:text-gray-400"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading || passwordStrength < 4}
                        className="w-full h-11 rounded-lg bg-saffron text-white font-body text-sm font-semibold hover:bg-saffron-light transition-colors shadow-saffron disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center mt-2"
                    >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign Up'}
                    </button>
                </form>

                <p className="mt-6 text-center font-body text-sm text-gray-500">
                    Already have an account?{' '}
                    <Link to="/citizen/login" className="text-saffron hover:underline font-body text-sm font-medium">
                        Log in
                    </Link>
                </p>
                <p className="mt-3 text-center font-body text-xs text-gray-400">
                    Are you a Panchayat official?{' '}
                    <Link to="/panchayat/login" className="text-teal-600 hover:underline">
                        Panchayat Login →
                    </Link>
                </p>
            </div>
        </div>
    );
}
