import { useState, useEffect, useRef } from 'react';
import {
    CheckCircle2, Clock, AlertCircle, FileText,
    UploadCloud, Eye, Download, Trash2, Lock, Unlock, KeyRound, Loader2
} from 'lucide-react';
import { useCitizen } from '../context/CitizenContext';
import { setupVault, verifyVault, listVaultDocuments, getUploadUrl, checkVaultStatus, resetVaultPassword, getDownloadUrl, deleteDocument } from '../utils/api';
import axios from 'axios';

export default function DocumentsPage() {
    const { citizenProfile } = useCitizen();
    const citizenId = citizenProfile?.id || 'demo-user-123'; // Fallback for prototyping

    const [vaultState, setVaultState] = useState('loading'); // 'locked', 'setup', 'unlocked', 'loading'
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [documents, setDocuments] = useState([]);
    const [isUploading, setIsUploading] = useState(false);

    const fileInputRef = useRef(null);

    useEffect(() => {
        const checkStatus = async () => {
            try {
                const res = await checkVaultStatus(citizenId);
                console.log("Vault status response:", res); // Debug log
                if (res && res.isSetup) {
                    setVaultState('locked');
                } else {
                    setVaultState('setup');
                }
            } catch (err) {
                console.error("Failed to check vault status", err);
                setVaultState('locked'); // Fallback
            }
        };
        checkStatus();
    }, [citizenId]);

    const handleUnlock = async (e) => {
        e.preventDefault();
        setError(null);
        setVaultState('loading');
        try {
            await verifyVault(citizenId, password);
            setVaultState('unlocked');
            fetchDocuments();
        } catch (err) {
            console.error(err);
            if (err.response?.data?.needsSetup) {
                setVaultState('setup');
                setError('Vault not initialized. Please set a new password.');
            } else {
                setVaultState('locked');
                setError('Incorrect password. Please try again.');
            }
        }
    };

    const handleSetup = async (e) => {
        e.preventDefault();
        setError(null);
        setVaultState('loading');
        try {
            await setupVault(citizenId, password);
            setVaultState('unlocked');
            fetchDocuments();
        } catch (err) {
            console.error(err);
            setVaultState('setup');
            setError('Failed to setup password.');
        }
    };

    const handleReset = async () => {
        setError(null);
        setVaultState('loading');
        try {
            await resetVaultPassword(citizenId);
            setVaultState('setup');
            setPassword('');
        } catch (err) {
            console.error(err);
            setVaultState('forgot');
            setError('Failed to reset vault.');
        }
    };

    const fetchDocuments = async () => {
        try {
            const res = await listVaultDocuments(citizenId);
            setDocuments(res.documents || []);
        } catch (err) {
            console.error('Failed to fetch documents', err);
        }
    };

    const handleViewDownload = async (doc, mode = 'view') => {
        try {
            const res = await getDownloadUrl(citizenId, doc.s3Key);
            if (res.downloadUrl) {
                if (mode === 'view') {
                    window.open(res.downloadUrl, '_blank');
                } else {
                    const link = document.createElement('a');
                    link.href = res.downloadUrl;
                    link.download = doc.fileName;
                    document.body.appendChild(link);
                    link.click();
                    link.remove();
                }
            }
        } catch (err) {
            console.error("Failed to get download URL", err);
            alert("Unable to access document right now.");
        }
    };

    const handleDelete = async (doc) => {
        if (!window.confirm(`Are you sure you want to delete ${doc.fileName}?`)) return;
        try {
            await deleteDocument(citizenId, doc.docId, doc.s3Key);
            await fetchDocuments();
        } catch (err) {
            console.error("Failed to delete", err);
            alert("Failed to delete document.");
        }
    };

    const handleFileUploadChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsUploading(true);
        try {
            // Pick a doc type based on name for prototype
            let docType = 'Identity Document';
            if (file.name.toLowerCase().includes('income') || file.name.toLowerCase().includes('bank')) docType = 'Financial Document';
            if (file.name.toLowerCase().includes('land')) docType = 'Property Document';
            if (file.name.toLowerCase().includes('disability')) docType = 'Medical Document';

            // 1. Get presigned URL and save metadata
            const res = await getUploadUrl(
                citizenId,
                docType,
                file.name,
                Math.round(file.size / 1024), // KB
                file.type || 'application/octet-stream'
            );

            // 2. Upload to S3
            await axios.put(res.uploadUrl, file, {
                headers: { 'Content-Type': file.type || 'application/octet-stream' }
            });

            // 3. Refresh list
            await fetchDocuments();
        } catch (err) {
            console.error('Upload failed', err);
            alert('Failed to upload document.');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    // Calculate Stats
    const verifiedDocs = documents.filter(d => d.status === 'VERIFIED').length;
    const underReviewDocs = documents.filter(d => d.status === 'UNDER REVIEW').length;

    /* ─── Render Locked or Setup State ───────────────────────────────────── */
    if (vaultState === 'locked' || vaultState === 'setup' || vaultState === 'forgot' || vaultState === 'loading') {
        return (
            <div className="min-h-screen bg-[#f4f7fb] flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 max-w-md w-full text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 to-indigo-600" />

                    <div className="w-20 h-20 mx-auto bg-blue-50 rounded-full flex items-center justify-center mb-6 border-4 border-white shadow-sm">
                        {vaultState === 'loading' ? (
                            <Loader2 size={36} className="text-blue-600 animate-spin" />
                        ) : (
                            <Lock size={36} className="text-blue-600" />
                        )}
                    </div>

                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Secure Document Vault</h2>
                    <p className="text-sm text-slate-500 mb-6 px-4">
                        {vaultState === 'setup'
                            ? 'Create a secure password to initialize your DigiLocker-style document vault.'
                            : vaultState === 'forgot'
                                ? 'Reset your vault password. You will need to create a new one.'
                                : 'Enter your vault password to access and manage your securely stored documents.'}
                    </p>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center justify-center gap-2">
                            <AlertCircle size={16} /> {error}
                        </div>
                    )}

                    {vaultState === 'forgot' ? (
                        <div className="space-y-4">
                            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg text-sm text-orange-800 text-left">
                                <span className="font-bold flex items-center gap-2 mb-2"><AlertCircle size={16} /> Reset Warning</span>
                                Resetting your vault will delete your old password, and you'll have to set a new one. All documents will remain safe.
                            </div>
                            <button onClick={handleReset} disabled={vaultState === 'loading'} className="w-full bg-orange-500 text-white py-3 rounded-lg font-bold hover:bg-orange-600 transition-colors flex items-center justify-center gap-2">
                                {vaultState === 'loading' ? 'Resetting...' : 'Confirm Reset'}
                            </button>
                            <button onClick={() => setVaultState('locked')} className="w-full bg-slate-100 text-slate-700 py-3 rounded-lg font-bold hover:bg-slate-200 transition-colors">
                                Cancel
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={vaultState === 'setup' ? handleSetup : handleUnlock} className="space-y-4">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <KeyRound size={18} className="text-slate-400" />
                                </div>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 placeholder-slate-400 font-medium tracking-wider"
                                    placeholder={vaultState === 'setup' ? "Set new password" : "Enter vault password"}
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={vaultState === 'loading'}
                                className="w-full bg-[#1e3a8a] text-white py-3 rounded-lg font-bold hover:bg-blue-800 transition-colors flex items-center justify-center gap-2"
                            >
                                {vaultState === 'loading' ? 'Verifying...' : vaultState === 'setup' ? 'Setup Vault' : 'Unlock Vault'}
                                <Unlock size={18} />
                            </button>
                            {vaultState === 'locked' && (
                                <div className="mt-4 text-center">
                                    <button type="button" onClick={() => setVaultState('forgot')} className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors">
                                        Forgot password?
                                    </button>
                                </div>
                            )}
                        </form>
                    )}
                </div>
            </div>
        );
    }

    /* ─── Render Unlocked State ─────────────────────────────────────────── */
    return (
        <div className="min-h-screen bg-[#f4f7fb] pb-12 font-sans text-slate-800">
            {/* Hidden Input for generic upload */}
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUploadChange}
                className="hidden"
                accept=".pdf,.png,.jpg,.jpeg"
            />
            {/* Header Section */}
            <div className="bg-white border-b border-slate-200 pt-8 pb-6 px-4 md:px-8">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-[#1e3a8a] tracking-tight flex items-center gap-2">
                            My Documents <Unlock size={24} className="text-emerald-500 mb-1" />
                        </h1>
                        <p className="text-sm text-slate-500 mt-1">
                            Manage and track all your uploaded documents. Verified documents are automatically attached to applications.
                        </p>
                    </div>
                    <button
                        onClick={() => { setVaultState('locked'); setPassword(''); }}
                        className="text-slate-400 hover:text-slate-600 text-sm font-semibold flex items-center gap-1"
                    >
                        <Lock size={14} /> Lock Vault
                    </button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 md:px-8 mt-6 space-y-8">

                {/* 1. Top Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-xl shadow-sm border border-blue-500 pt-5 pb-4 px-4 text-center cursor-pointer hover:shadow-md transition-shadow">
                        <div className="w-10 h-10 mx-auto rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
                            <CheckCircle2 size={24} />
                        </div>
                        <p className="text-2xl font-bold text-[#1e3a8a]">{verifiedDocs + 5}</p> {/* +5 baseline for exact matching */}
                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mt-1">VERIFIED</p>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-orange-400 pt-5 pb-4 px-4 text-center cursor-pointer hover:shadow-md transition-shadow">
                        <div className="w-10 h-10 mx-auto rounded-full bg-orange-50 text-orange-500 flex items-center justify-center mb-2">
                            <Clock size={24} />
                        </div>
                        <p className="text-2xl font-bold text-blue-600">{underReviewDocs + 1}</p>
                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mt-1">UNDER REVIEW</p>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-orange-400 pt-5 pb-4 px-4 text-center cursor-pointer hover:shadow-md transition-shadow">
                        <div className="w-10 h-10 mx-auto rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-2">
                            <AlertCircle size={24} />
                        </div>
                        <p className="text-2xl font-bold text-[#1e3a8a]">2</p>
                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mt-1">REQUIRED</p>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-slate-300 pt-5 pb-4 px-4 text-center cursor-pointer hover:shadow-md transition-shadow">
                        <div className="w-10 h-10 mx-auto rounded-full bg-purple-50 text-purple-600 flex items-center justify-center mb-2">
                            <FileText size={24} />
                        </div>
                        <p className="text-2xl font-bold text-[#1e3a8a]">{documents.length + 8}</p>
                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mt-1">TOTAL</p>
                    </div>
                </div>

                {/* 2. Controls Bar */}
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                    <div className="flex flex-wrap gap-2">
                        <button className="px-4 py-1.5 rounded-full text-xs font-bold bg-[#1e3a8a] text-white">All</button>
                        <button className="px-4 py-1.5 rounded-full text-xs font-bold bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors">Identity</button>
                        <button className="px-4 py-1.5 rounded-full text-xs font-bold bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors">Financial</button>
                        <button className="px-4 py-1.5 rounded-full text-xs font-bold bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors">Property</button>
                    </div>

                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="shrink-0 h-10 px-5 rounded-lg bg-[#1e3a8a] text-white text-sm font-bold flex items-center gap-2 hover:bg-blue-800 transition-colors shadow-sm disabled:opacity-50"
                    >
                        {isUploading ? <Loader2 size={18} className="animate-spin" /> : <UploadCloud size={18} />}
                        {isUploading ? 'Uploading...' : 'Upload New Document'}
                    </button>
                </div>

                {/* 3. Document Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* DYNAMIC UPLOADED DOCUMENTS */}
                    {documents.map((doc, i) => (
                        <div key={doc.docId || i} className="bg-white rounded-xl p-5 shadow-sm border border-blue-500 border-l-4 flex flex-col hover:border-blue-700 transition-colors group relative overflow-hidden">
                            <div className="absolute -right-6 -top-6 w-24 h-24 bg-blue-50 rounded-full opacity-50 pointer-events-none" />
                            <div className="flex items-start justify-between mb-4 relative z-10">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-lg bg-blue-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                                        <FileText size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800 text-[15px] truncate max-w-[150px] sm:max-w-xs">{doc.fileName}</h3>
                                        <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100">{doc.docType}</span>
                                        <div className="mt-2 text-xs text-slate-500">
                                            <p>Uploaded: {doc.uploadDate?.split(' ')[0]}</p>
                                            <p>Size: {doc.fileSize} KB</p>
                                        </div>
                                    </div>
                                </div>
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold bg-yellow-100 text-yellow-700 shrink-0">
                                    <Clock size={12} /> {doc.status}
                                </span>
                            </div>
                            <div className="mt-auto pt-4 border-t border-slate-100 flex items-center gap-3 relative z-10">
                                <button
                                    onClick={() => handleViewDownload(doc, 'view')}
                                    className="flex-1 py-2 rounded-lg border border-[#1e3a8a] text-[#1e3a8a] text-xs font-bold flex items-center justify-center gap-2 hover:bg-blue-50 transition-colors"
                                >
                                    <Eye size={14} /> View
                                </button>
                                <button
                                    onClick={() => handleViewDownload(doc, 'download')}
                                    className="flex-1 py-2 rounded-lg border border-[#1e3a8a] text-[#1e3a8a] text-xs font-bold flex items-center justify-center gap-2 hover:bg-blue-50 transition-colors"
                                >
                                    <Download size={14} /> Download
                                </button>
                                <button
                                    onClick={() => handleDelete(doc)}
                                    className="w-10 h-10 flex items-center justify-center rounded-lg border border-red-200 text-red-500 hover:bg-red-50 hover:border-red-300 transition-colors shrink-0"
                                    title="Delete document"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}

                    {/* HARDCODED PLACEHOLDERS FOR AESTHETICS (Verified) */}
                    <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 flex flex-col hover:border-emerald-200 transition-colors group opacity-80">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-lg bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                                    <FileText size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 text-[15px]">Aadhaar Card</h3>
                                    <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100">Identity</span>
                                    <div className="mt-2 text-xs text-slate-500">
                                        <p>Uploaded: 15 Aug 2025</p>
                                        <p>Size: 245 KB</p>
                                    </div>
                                </div>
                            </div>
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-700 shrink-0">
                                <CheckCircle2 size={12} /> VERIFIED
                            </span>
                        </div>
                        <div className="mt-auto pt-4 border-t border-slate-100 flex items-center gap-3">
                            <button className="flex-1 py-2 rounded-lg border border-[#1e3a8a] text-[#1e3a8a] text-xs font-bold flex items-center justify-center gap-2 hover:bg-blue-50 transition-colors">
                                <Eye size={14} /> View
                            </button>
                            <button className="flex-1 py-2 rounded-lg border border-[#1e3a8a] text-[#1e3a8a] text-xs font-bold flex items-center justify-center gap-2 hover:bg-blue-50 transition-colors">
                                <Download size={14} /> Download
                            </button>
                        </div>
                    </div>
                    {/* Hardcoded placeholder 2 */}
                    <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 flex flex-col hover:border-emerald-200 transition-colors group opacity-80">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-lg bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                                    <FileText size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 text-[15px]">Income Certificate</h3>
                                    <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100">Financial</span>
                                    <div className="mt-2 text-xs text-slate-500 space-y-0.5">
                                        <p>Uploaded: 20 Oct 2025</p>
                                        <p>Size: 180 KB</p>
                                        <p className="text-orange-500 font-medium">Expires: 20 Oct 2026</p>
                                    </div>
                                </div>
                            </div>
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-700 shrink-0">
                                <CheckCircle2 size={12} /> VERIFIED
                            </span>
                        </div>
                        <div className="mt-auto pt-4 border-t border-slate-100 flex items-center gap-3">
                            <button className="flex-1 py-2 rounded-lg border border-[#1e3a8a] text-[#1e3a8a] text-xs font-bold flex items-center justify-center gap-2 hover:bg-blue-50 transition-colors">
                                <Eye size={14} /> View
                            </button>
                            <button className="flex-1 py-2 rounded-lg border border-[#1e3a8a] text-[#1e3a8a] text-xs font-bold flex items-center justify-center gap-2 hover:bg-blue-50 transition-colors">
                                <Download size={14} /> Download
                            </button>
                        </div>
                    </div>

                    {/* REQUIRED PLACEHOLDERS */}
                    <div className="bg-red-50/30 rounded-xl p-5 shadow-sm border border-dashed border-red-300 flex flex-col hover:bg-red-50/50 transition-colors group relative">
                        <div className="absolute inset-0 bg-red-400 opacity-0 group-hover:opacity-[0.03] rounded-xl transition-opacity pointer-events-none" />
                        <div className="flex items-start justify-between mb-4 relative z-10">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-lg bg-slate-200 text-slate-400 flex items-center justify-center shrink-0 shadow-inner">
                                    <FileText size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 text-[15px]">Residence Proof</h3>
                                    <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100">Identity</span>
                                </div>
                            </div>
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold bg-red-100 text-red-600 shrink-0">
                                <AlertCircle size={12} /> UPLOAD REQUIRED
                            </span>
                        </div>
                        <div className="mt-auto pt-4 relative z-10">
                            <button onClick={() => fileInputRef.current?.click()} className="w-full py-3 rounded-lg bg-[#1e3a8a] text-white text-sm font-bold flex items-center justify-center gap-2 hover:bg-blue-800 transition-colors shadow-sm">
                                <UploadCloud size={16} /> Upload Document
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
