import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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

export default function PanchayatForgotPasswordPage() {
    const navigate = useNavigate();
    const [step, setStep] = useState('request'); // 'request' | 'confirm'
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const passwordRules = useMemo(
        () => PASSWORD_RULES.map((r) => ({ ...r, pass: r.test(newPassword) })),
        [newPassword]
    );
    const passwordStrength = passwordRules.filter((r) => r.pass).length;
    const strengthColor = passwordStrength <= 1 ? 'bg-red-500' : passwordStrength === 2 ? 'bg-amber-500' : 'bg-success';

    const handleRequest = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            await authService.panchayatForgotPassword(email);
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
            await authService.panchayatConfirmForgotPassword(email, code, newPassword);
            navigate('/panchayat/login', { state: { message: 'Password reset successful. You can now log in.' } });
        } catch (err) {
            setError(mapError(err));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-off-white flex flex-col items-center justify-center px-4 py-12">
            <div className="w-full max-w-md bg-white rounded-xl border border-gray-200 shadow-card p-8">

                <div className="flex justify-center mb-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-teal-50 border border-teal-500/50 text-teal-600 font-body text-xs font-semibold tracking-wide uppercase">
                        Panchayat Official Portal
                    </span>
                </div>

                <div className="text-center mb-6">
                    <h1 className="font-display text-3xl text-gray-900 mt-4 mb-2">Reset Password</h1>
                    <p className="font-body text-sm text-gray-500">
                        {step === 'request'
                            ? 'Enter your email to receive a reset code.'
                            : `Enter the code sent to ${email}`}
                    </p>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-danger/10 border border-danger/20 text-danger rounded-lg font-body text-sm">
                        {error}
                    </div>
                )}

                {step === 'request' ? (
                    <form onSubmit={handleRequest} className="space-y-4">
                        <div>
                            <label className="block font-body text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full h-11 px-4 rounded-lg border border-gray-300 bg-white font-body text-sm text-gray-900 focus:outline-none focus:border-saffron focus:ring-2 focus:ring-saffron/20 transition-colors placeholder:text-gray-400"
                                placeholder="official@panchayat.gov.in"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-11 rounded-lg bg-saffron text-white font-body text-sm font-semibold hover:bg-saffron-light transition-colors shadow-saffron disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center mt-2"
                        >
                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Reset Code'}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleConfirm} className="space-y-4">
                        <div>
                            <label className="block font-body text-sm font-medium text-gray-700 mb-1">Verification Code</label>
                            <input
                                type="text"
                                required
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                className="w-full h-11 px-4 rounded-lg border border-gray-300 bg-white font-mono text-sm text-gray-900 tracking-widest text-center focus:outline-none focus:border-saffron focus:ring-2 focus:ring-saffron/20 transition-colors"
                                placeholder="123456"
                            />
                        </div>
                        <div>
                            <label className="block font-body text-sm font-medium text-gray-700 mb-1">New Password</label>
                            <input
                                type="password"
                                required
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full h-11 px-4 rounded-lg border border-gray-300 bg-white font-body text-sm text-gray-900 focus:outline-none focus:border-saffron focus:ring-2 focus:ring-saffron/20 transition-colors placeholder:text-gray-400"
                                placeholder="••••••••"
                            />
                            {newPassword.length > 0 && (
                                <div className="mt-2">
                                    <div className="flex gap-1 mb-2">
                                        {[0, 1, 2, 3].map((i) => (
                                            <div
                                                key={i}
                                                className={`h-1.5 flex-1 rounded-full transition-colors ${i < passwordStrength ? strengthColor : 'bg-gray-200'}`}
                                            />
                                        ))}
                                    </div>
                                    <ul className="space-y-1">
                                        {passwordRules.map((r) => (
                                            <li key={r.label} className={`font-body text-xs flex items-center gap-1 ${r.pass ? 'text-success' : 'text-gray-400'}`}>
                                                <span>{r.pass ? '✓' : '○'}</span> {r.label}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                        <button
                            type="submit"
                            disabled={isLoading || passwordStrength < 4}
                            className="w-full h-11 rounded-lg bg-saffron text-white font-body text-sm font-semibold hover:bg-saffron-light transition-colors shadow-saffron disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center mt-2"
                        >
                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Reset Password'}
                        </button>
                        <button
                            type="button"
                            onClick={() => setStep('request')}
                            className="w-full flex items-center justify-center gap-1 font-body text-xs text-gray-500 hover:text-saffron transition-colors"
                        >
                            <ArrowLeft size={12} /> Back — resend code
                        </button>
                    </form>
                )}

                <p className="mt-6 text-center font-body text-sm text-gray-500">
                    Remembered it?{' '}
                    <Link to="/panchayat/login" className="text-saffron hover:underline font-body text-sm font-medium">
                        Log in
                    </Link>
                </p>
            </div>
        </div>
    );
}
