/**
 * PanchayatSidebar — collapsible left navigation for all panchayat portal pages.
 * Shows icons + labels, highlights active route, collapses on mobile.
 */
import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard,
    Users,
    BarChart3,
    FileText,
    Megaphone,
    MapPin,
    CalendarDays,
    AlertTriangle,
    ClipboardList,
    Settings,
    ChevronLeft,
    ChevronRight,
    Menu,
    X,
} from 'lucide-react';

const NAV_ITEMS = [
    { to: '/panchayat', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/panchayat/citizens', label: 'Citizens', icon: Users },
    { to: '/panchayat/analytics', label: 'Analytics', icon: BarChart3 },
    { to: '/panchayat/applications', label: 'Applications', icon: FileText },
    { to: '/panchayat/outreach', label: 'Outreach', icon: Megaphone },
    { to: '/panchayat/village', label: 'Village Profile', icon: MapPin },
    { to: '/panchayat/calendar', label: 'Calendar', icon: CalendarDays },
    { to: '/panchayat/grievances', label: 'Grievances', icon: AlertTriangle },
    { to: '/panchayat/report', label: 'Reports', icon: ClipboardList },
    { to: '/panchayat/settings', label: 'Settings', icon: Settings },
];

function PanchayatSidebar({ children }) {
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const location = useLocation();

    const sidebarWidth = collapsed ? 'w-16' : 'w-56';

    const linkClasses = (isActive) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-body transition-all duration-200 group ${isActive
            ? 'bg-teal-500/15 text-teal-400 font-medium'
            : 'text-slate-400 hover:text-white hover:bg-white/5'
        }`;

    const renderNav = (isMobile = false) => (
        <nav className="flex flex-col gap-1 px-2 py-3">
            {NAV_ITEMS.map((item) => (
                <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    onClick={() => isMobile && setMobileOpen(false)}
                    className={({ isActive }) => linkClasses(isActive)}
                >
                    <item.icon className="w-5 h-5 shrink-0" />
                    {(!collapsed || isMobile) && (
                        <span className="truncate">{item.label}</span>
                    )}
                </NavLink>
            ))}
        </nav>
    );

    return (
        <div className="flex min-h-[calc(100vh-4rem)]">
            {/* Desktop Sidebar */}
            <aside
                className={`hidden lg:flex flex-col ${sidebarWidth} bg-navy border-r border-navy-light/20 transition-all duration-300 shrink-0 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto`}
            >
                {/* Collapse toggle */}
                <div className="flex items-center justify-end px-2 py-2 border-b border-navy-light/20">
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className="p-1.5 rounded-md text-slate-500 hover:text-white hover:bg-white/5 transition-colors"
                        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    >
                        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                    </button>
                </div>

                {renderNav()}

                {/* Version badge at bottom */}
                {!collapsed && (
                    <div className="mt-auto px-4 py-3 border-t border-navy-light/20">
                        <p className="text-[10px] text-slate-600 font-body">Sarathi Panchayat v1.0</p>
                    </div>
                )}
            </aside>

            {/* Mobile hamburger button */}
            <button
                onClick={() => setMobileOpen(true)}
                className="lg:hidden fixed bottom-4 left-4 z-50 bg-teal-600 text-white p-3 rounded-full shadow-lg hover:bg-teal-500 transition-colors"
                aria-label="Open navigation"
            >
                <Menu className="w-5 h-5" />
            </button>

            {/* Mobile overlay */}
            <AnimatePresence>
                {mobileOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="lg:hidden fixed inset-0 z-50 bg-black/50"
                            onClick={() => setMobileOpen(false)}
                        />
                        <motion.aside
                            initial={{ x: -280 }}
                            animate={{ x: 0 }}
                            exit={{ x: -280 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="lg:hidden fixed top-0 left-0 bottom-0 z-50 w-64 bg-navy shadow-2xl pt-4"
                        >
                            <div className="flex items-center justify-between px-4 pb-3 border-b border-navy-light/20">
                                <span className="font-display text-lg text-teal-400">Navigation</span>
                                <button
                                    onClick={() => setMobileOpen(false)}
                                    className="p-1 rounded-md text-slate-400 hover:text-white"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            {renderNav(true)}
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* Main content area */}
            <main className="flex-1 min-w-0 bg-gradient-to-br from-slate-50 to-slate-100">
                {children}
            </main>
        </div>
    );
}

export default PanchayatSidebar;
