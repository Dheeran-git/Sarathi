import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../services/authService';
import { Loader2 } from 'lucide-react';
import { claimPanchayat } from '../utils/api';

export default function PanchayatVerifyPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const defaultEmail = location.state?.email || '';
    const claimData = location.state?.claimData || null;

    const [email, setEmail] = useState(defaultEmail);
    const [code, setCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage] = useState(location.state?.message || '');
    const [resendCountdown, setResendCountdown] = useState(0);
    const [resendStatus, setResendStatus] = useState('');

    const codeInputRef = useRef(null);

    useEffect(() => {
        codeInputRef.current?.focus();
    }, []);

    useEffect(() => {
        if (resendCountdown <= 0) return;
        const timer = setTimeout(() => setResendCountdown((c) => c - 1), 1000);
        return () => clearTimeout(timer);
    }, [resendCountdown]);

    const handleVerify = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            // 1. Confirm Cognito Signup
            await authService.panchayatConfirmSignUp(email, code);

            // 2. Claim Panchayat was already done in PanchayatSignupPage.jsx!

            navigate('/panchayat/login', { state: { message: 'Verification successful! You can now log in.' } });
        } catch (err) {
            setError(err.message || 'Verification failed. Please check the code and try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResend = async () => {
        setResendStatus('');
        setError('');
        try {
            await authService.panchayatResendConfirmationCode(email);
            setResendStatus('A new code has been sent to your email.');
            setResendCountdown(60);
        } catch (err) {
            setError(err.message || 'Failed to resend code. Please try again.');
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
                    <h1 className="font-display text-3xl text-gray-900 mt-4 mb-2">Verify Email</h1>
                    <p className="font-body text-sm text-gray-500">Enter the OTP sent to your email.</p>
                </div>

                {/* Success message */}
                {successMessage && (
                    <div className="mb-4 p-3 bg-success/10 border border-success/20 text-success rounded-lg font-body text-sm">
                        {successMessage}
                    </div>
                )}

                {/* Resend status */}
                {resendStatus && (
                    <div className="mb-4 p-3 bg-success/10 border border-success/20 text-success rounded-lg font-body text-sm">
                        {resendStatus}
                    </div>
                )}

                {/* Error message */}
                {error && (
                    <div className="mb-4 p-3 bg-danger/10 border border-danger/20 text-danger rounded-lg font-body text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleVerify} className="space-y-4">
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
                        />
                    </div>

                    <div>
                        <label className="block font-body text-sm font-medium text-gray-700 mb-1">
                            Verification Code
                        </label>
                        <input
                            ref={codeInputRef}
                            type="text"
                            required
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            className="w-full h-11 px-4 rounded-lg border border-gray-300 bg-white font-mono text-sm text-gray-900 tracking-widest text-center focus:outline-none focus:border-saffron focus:ring-2 focus:ring-saffron/20 transition-colors placeholder:text-gray-400"
                            placeholder="123456"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full h-11 rounded-lg bg-saffron text-white font-body text-sm font-semibold hover:bg-saffron-light transition-colors shadow-saffron disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center mt-2"
                    >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify Account'}
                    </button>
                </form>

                <div className="mt-4 text-center">
                    <button
                        type="button"
                        onClick={handleResend}
                        disabled={resendCountdown > 0}
                        className="font-body text-xs text-gray-500 hover:text-saffron transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {resendCountdown > 0 ? `Resend in ${resendCountdown}s` : 'Resend Code'}
                    </button>
                </div>
            </div>
        </div>
    );
}
