import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ClipboardList, Download, Printer, IndianRupee, Users, FileText, TrendingUp } from 'lucide-react';
import { usePanchayat } from '../../context/PanchayatContext';

function PerformanceReport() {
    const { stats, citizens, applications, campaigns, grievances, panchayatProfile } = usePanchayat();

    const metrics = useMemo(() => {
        const thisMonth = new Date().getMonth();
        const monthApps = applications.filter((a) => new Date(a.createdAt).getMonth() === thisMonth);
        const approved = applications.filter((a) => a.status === 'approved');
        const resolvedGrv = grievances.filter((g) => g.status === 'resolved');
        const openGrv = grievances.filter((g) => g.status === 'open' || g.status === 'escalated');
        const totalNotified = campaigns.reduce((s, c) => s + c.recipientCount, 0);
        const totalDelivered = campaigns.reduce((s, c) => s + c.deliveredCount, 0);

        return {
            citizensServed: stats.enrolled,
            newApps: monthApps.length,
            approvedBenefit: approved.length * 12000,
            welfareGapClosed: stats.totalHouseholds > 0 ? Math.round((stats.enrolled / stats.totalHouseholds) * 100) : 0,
            unresolvedGrievances: openGrv.length,
            resolvedGrievances: resolvedGrv.length,
            notificationsSent: totalNotified,
            deliveryRate: totalNotified > 0 ? Math.round((totalDelivered / totalNotified) * 100) : 0,
            performanceScore: stats.performanceScore,
        };
    }, [stats, applications, campaigns, grievances]);

    const handlePrint = () => window.print();

    const handleCSV = () => {
        const rows = [
            ['Metric', 'Value'],
            ['Citizens Served', metrics.citizensServed],
            ['New Applications', metrics.newApps],
            ['Benefits Approved (₹)', metrics.approvedBenefit],
            ['Welfare Gap Closed (%)', metrics.welfareGapClosed],
            ['Unresolved Grievances', metrics.unresolvedGrievances],
            ['Notifications Sent', metrics.notificationsSent],
            ['Delivery Rate (%)', metrics.deliveryRate],
            ['Performance Score', metrics.performanceScore],
        ];
        const csv = rows.map((r) => r.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `panchayat_report_${new Date().toISOString().slice(0, 7)}.csv`; a.click();
        URL.revokeObjectURL(url);
    };

    const Row = ({ label, value, icon: Icon, color = 'teal' }) => (
        <div className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
            <div className="flex items-center gap-2">
                <Icon className={`w-4 h-4 text-${color}-500`} />
                <span className="text-sm font-body text-slate-600">{label}</span>
            </div>
            <span className="font-display text-lg text-navy">{value}</span>
        </div>
    );

    return (
        <div className="p-4 lg:p-6 space-y-6 max-w-3xl print:max-w-full">
            <div className="flex items-start justify-between print:hidden">
                <div>
                    <h1 className="font-display text-2xl text-navy flex items-center gap-2"><ClipboardList className="w-6 h-6 text-teal-500" /> Performance Report</h1>
                    <p className="text-sm text-slate-500 font-body">Monthly summary — {new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={handleCSV} className="flex items-center gap-1.5 px-3 py-2 border border-slate-300 text-slate-700 text-sm rounded-lg font-body hover:bg-slate-50">
                        <Download className="w-4 h-4" /> CSV
                    </button>
                    <button onClick={handlePrint} className="flex items-center gap-1.5 px-3 py-2 bg-teal-600 text-white text-sm rounded-lg font-body hover:bg-teal-500">
                        <Printer className="w-4 h-4" /> Print
                    </button>
                </div>
            </div>

            {/* Print header */}
            <div className="hidden print:block mb-6">
                <h1 className="text-2xl font-bold">Sarathi — Panchayat Performance Report</h1>
                <p>{panchayatProfile.panchayatName || 'Rampur Panchayat'} · {new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</p>
            </div>

            {/* Score badge */}
            <M delay={0}>
                <div className="bg-white rounded-xl border border-slate-200 p-6 flex items-center gap-6">
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center font-display text-2xl text-white ${metrics.performanceScore >= 70 ? 'bg-emerald-500' : metrics.performanceScore >= 40 ? 'bg-amber-500' : 'bg-red-500'}`}>
                        {metrics.performanceScore}
                    </div>
                    <div>
                        <p className="font-display text-lg text-navy">Performance Score</p>
                        <p className="text-sm text-slate-500 font-body">Based on enrollment rate, applications, and outreach</p>
                    </div>
                </div>
            </M>

            {/* Metrics */}
            <M delay={0.1}>
                <div className="bg-white rounded-xl border border-slate-200 p-5">
                    <h2 className="font-display text-base text-navy mb-3">Key Metrics</h2>
                    <Row icon={Users} label="Citizens Served (enrolled)" value={metrics.citizensServed} />
                    <Row icon={FileText} label="New Applications This Month" value={metrics.newApps} color="blue" />
                    <Row icon={IndianRupee} label="Benefits Approved (₹)" value={`₹${metrics.approvedBenefit.toLocaleString('en-IN')}`} color="emerald" />
                    <Row icon={TrendingUp} label="Welfare Gap Closed" value={`${metrics.welfareGapClosed}%`} color="amber" />
                    <Row icon={ClipboardList} label="Unresolved Grievances" value={metrics.unresolvedGrievances} color="red" />
                    <Row icon={ClipboardList} label="Resolved Grievances" value={metrics.resolvedGrievances} color="emerald" />
                    <Row icon={Users} label="Notifications Sent" value={metrics.notificationsSent} color="blue" />
                    <Row icon={TrendingUp} label="Notification Delivery Rate" value={`${metrics.deliveryRate}%`} />
                </div>
            </M>
        </div>
    );
}

const M = ({ children, delay = 0 }) => (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.35 }}>
        {children}
    </motion.div>
);

export default PerformanceReport;
