import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../services/authService';
import { Loader2 } from 'lucide-react';

export default function VerifyPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const defaultEmail = location.state?.email || '';

    const [email, setEmail] = useState(defaultEmail);
    const [code, setCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState(location.state?.message || '');

    const handleVerify = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await authService.confirmSignUp(email, code);
            navigate('/login', { state: { message: 'Verification successful! You can now log in.' } });
        } catch (err) {
            setError(err.message || 'Verification failed. Please check the code and try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4 font-sans">
            <div className="w-full max-w-md backdrop-blur-xl bg-[#0f172a] border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none rounded-3xl">
                    <div className="absolute -top-[20%] -left-[20%] w-[60%] h-[60%] bg-blue-600/20 blur-[80px] rounded-full"></div>
                </div>

                <div className="relative z-10">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-[#f8fafc] mb-2">Verify Email</h1>
                        <p className="text-slate-400 text-sm">Enter the OTP sent to your email.</p>
                    </div>

                    {successMessage && (
                        <div className="mb-4 p-3 bg-green-500/10 border border-green-500/50 rounded-lg text-green-400 text-sm">
                            {successMessage}
                        </div>
                    )}

                    {error && (
                        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleVerify} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1.5">Email</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-[#0f172a] border border-slate-800 rounded-xl px-4 py-3 text-[#f8fafc] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1.5">Verification Code</label>
                            <input
                                type="text"
                                required
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                className="w-full bg-[#0f172a] border border-slate-800 rounded-xl px-4 py-3 text-[#f8fafc] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-mono tracking-widest text-center"
                                placeholder="123456"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-[#f8fafc] font-medium py-3 rounded-xl transition-all shadow-lg hover:shadow-blue-500/25 flex items-center justify-center mt-6 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify Account'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
