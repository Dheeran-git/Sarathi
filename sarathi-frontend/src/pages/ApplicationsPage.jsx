import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ClipboardList, Loader2, ExternalLink } from 'lucide-react';
import { useCitizen } from '../context/CitizenContext';
import EmptyState from '../components/ui/EmptyState';

const STATUS_CONFIG = {
    pending:   { label: 'Pending',   bg: 'bg-amber-100',     text: 'text-amber-700'  },
    submitted: { label: 'Submitted', bg: 'bg-blue-100',      text: 'text-blue-700'   },
    approved:  { label: 'Approved',  bg: 'bg-success-light', text: 'text-success'    },
    rejected:  { label: 'Rejected',  bg: 'bg-danger/10',     text: 'text-danger'     },
};

function formatDate(iso) {
    if (!iso) return '';
    try {
        return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
        return typeof iso === 'string' ? iso.slice(0, 10) : '';
    }
}

export default function ApplicationsPage() {
    const navigate = useNavigate();
    const { applications, isLoadingApplications, refreshApplications } = useCitizen();

    useEffect(() => {
        refreshApplications();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="min-h-screen bg-off-white pb-12">
            {/* Header */}
            <div className="bg-navy py-8 px-4 sm:px-6 lg:px-8">
                <div className="max-w-3xl mx-auto">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="inline-flex items-center gap-1 font-body text-sm text-gray-300 hover:text-white mb-4 transition-colors"
                    >
                        <ArrowLeft size={14} /> Back to Dashboard
                    </button>
                    <h1 className="font-display text-3xl text-white flex items-center gap-3">
                        <ClipboardList size={28} className="text-saffron" />
                        My Applications
                    </h1>
                    <p className="font-body text-gray-300 mt-1 text-sm">
                        {isLoadingApplications ? 'Loading...' : `${applications.length} application${applications.length !== 1 ? 's' : ''}`}
                    </p>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {isLoadingApplications ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 size={32} className="animate-spin text-saffron" />
                    </div>
                ) : applications.length === 0 ? (
                    <EmptyState
                        title="No Applications Yet"
                        subtitle="Apply to eligible schemes to track your applications here."
                        ctaLabel="Browse Schemes"
                        onCtaClick={() => navigate('/schemes')}
                    />
                ) : (
                    <div className="space-y-4">
                        {applications.map((app, i) => {
                            const sc = STATUS_CONFIG[app.status] || STATUS_CONFIG.submitted;
                            const shortId = app.applicationId?.slice(0, 8).toUpperCase() || '—';
                            return (
                                <motion.div
                                    key={app.applicationId}
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05, duration: 0.3 }}
                                    className="bg-white rounded-xl border border-gray-200 shadow-card p-5"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-body text-base font-bold text-gray-900 truncate">
                                                {app.schemeName || app.schemeId}
                                            </h3>
                                            <div className="flex flex-wrap items-center gap-3 mt-1">
                                                <span className="font-mono text-xs text-gray-400">ID: {shortId}</span>
                                                {app.createdAt && (
                                                    <span className="font-body text-xs text-gray-400">{formatDate(app.createdAt)}</span>
                                                )}
                                            </div>
                                        </div>
                                        <span className={`shrink-0 text-xs font-body font-semibold px-2.5 py-1 rounded-full ${sc.bg} ${sc.text}`}>
                                            {sc.label}
                                        </span>
                                    </div>

                                    <div className="mt-4 flex items-center gap-3">
                                        <button
                                            onClick={() => navigate(`/schemes/${app.schemeId}`)}
                                            className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-gray-200 text-gray-600 font-body text-xs hover:border-saffron/50 hover:text-saffron transition-colors"
                                        >
                                            <ExternalLink size={12} /> View Scheme
                                        </button>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
