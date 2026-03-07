import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { authService } from '../services/authService';
import { Loader2, ArrowLeft } from 'lucide-react';

const COGNITO_ERROR_MAP = {
    UserNotFoundException: 'No account found with this email.',
    LimitExceededException: 'Too many attempts. Please try again later.',
    CodeMismatchException: 'Incorrect verification code. Please try again.',
    ExpiredCodeException: 'This code has expired. Please request a new one.',
    InvalidPasswordException: 'Password does not meet requirements.',
};

function mapError(err) {
    return COGNITO_ERROR_MAP[err.name] || err.message || 'Something went wrong.';
}

const PASSWORD_RULES = [
    { label: 'At least 8 characters', test: (p) => p.length >= 8 },
    { label: 'One uppercase letter', test: (p) => /[A-Z]/.test(p) },
    { label: 'One number', test: (p) => /[0-9]/.test(p) },
    { label: 'One special character', test: (p) => /[^A-Za-z0-9]/.test(p) },
];

export default function AdminForgotPasswordPage() {
    const navigate = useNavigate();
    const [step, setStep] = useState('request');
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const passwordRules = useMemo(() =>
        PASSWORD_RULES.map((r) => ({ ...r, pass: r.test(newPassword) })),
        [newPassword]
    );
    const passwordStrength = passwordRules.filter((r) => r.pass).length;
    const strengthColor = passwordStrength <= 1 ? 'bg-red-500' : passwordStrength === 2 ? 'bg-amber-500' : 'bg-green-500';

    const handleRequest = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            await authService.adminForgotPassword(email);
            setStep('confirm');
        } catch (err) {
            setError(mapError(err));
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfirm = async (e) => {
        e.preventDefault();
        setError('');
        if (passwordStrength < 4) {
            setError('Please use a stronger password before continuing.');
            return;
        }
        setIsLoading(true);
        try {
            await authService.adminConfirmForgotPassword(email, code, newPassword);
            navigate('/admin/login', { state: { message: 'Password reset successful. You can now log in.' } });
        } catch (err) {
            setError(mapError(err));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-navy flex items-center justify-center px-4 relative overflow-hidden">
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
                    <div className="text-center mb-6">
                        <h1 className="font-display text-3xl text-white mb-2 underline decoration-saffron decoration-4 underline-offset-8">
                            Reset <span className="text-saffron">Password</span>
                        </h1>
                        <p className="font-body text-gray-400 mt-4">
                            {step === 'request'
                                ? 'Enter your admin email to receive a reset code.'
                                : `Enter the code sent to ${email}`}
                        </p>
                    </div>

                    {error && (
                        <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm font-body text-center">
                            {error}
                        </div>
                    )}

                    {step === 'request' ? (
                        <form onSubmit={handleRequest} className="space-y-6">
                            <div>
                                <label className="block text-sm font-body font-medium text-gray-300 mb-2">Admin Email</label>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full h-12 px-4 rounded-xl bg-navy border border-navy-light/50 text-white font-body focus:outline-none focus:border-saffron transition-colors"
                                    placeholder="admin@sarathi.gov.in"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full h-12 bg-saffron hover:bg-saffron-light text-white font-body font-bold rounded-xl shadow-lg shadow-saffron/20 transition-all disabled:opacity-50"
                            >
                                {isLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Send Reset Code'}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleConfirm} className="space-y-6">
                            <div>
                                <label className="block text-sm font-body font-medium text-gray-300 mb-2">Verification Code</label>
                                <input
                                    type="text"
                                    required
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                    className="w-full h-12 px-4 rounded-xl bg-navy border border-navy-light/50 text-white font-mono tracking-widest text-center focus:outline-none focus:border-saffron transition-colors"
                                    placeholder="123456"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-body font-medium text-gray-300 mb-2">New Password</label>
                                <input
                                    type="password"
                                    required
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full h-12 px-4 rounded-xl bg-navy border border-navy-light/50 text-white font-body focus:outline-none focus:border-saffron transition-colors"
                                    placeholder="********"
                                />
                                {newPassword.length > 0 && (
                                    <div className="mt-3">
                                        <div className="flex gap-1 mb-2">
                                            {[0, 1, 2, 3].map((i) => (
                                                <div
                                                    key={i}
                                                    className={`h-1.5 flex-1 rounded-full transition-colors ${i < passwordStrength ? strengthColor : 'bg-gray-700'}`}
                                                />
                                            ))}
                                        </div>
                                        <ul className="space-y-1">
                                            {passwordRules.map((r) => (
                                                <li key={r.label} className={`font-body text-xs flex items-center gap-1 ${r.pass ? 'text-green-400' : 'text-gray-500'}`}>
                                                    <span>{r.pass ? '\u2713' : '\u25CB'}</span> {r.label}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                            <button
                                type="submit"
                                disabled={isLoading || passwordStrength < 4}
                                className="w-full h-12 bg-saffron hover:bg-saffron-light text-white font-body font-bold rounded-xl shadow-lg shadow-saffron/20 transition-all disabled:opacity-50"
                            >
                                {isLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Reset Password'}
                            </button>
                            <button
                                type="button"
                                onClick={() => setStep('request')}
                                className="w-full flex items-center justify-center gap-1 font-body text-xs text-gray-400 hover:text-saffron transition-colors"
                            >
                                <ArrowLeft size={12} /> Back — resend code
                            </button>
                        </form>
                    )}

                    <p className="mt-6 text-center font-body text-sm text-gray-400">
                        Remembered it?{' '}
                        <Link to="/admin/login" className="text-saffron hover:underline font-body text-sm font-medium">
                            Log in
                        </Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
