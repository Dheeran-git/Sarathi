import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    LayoutDashboard,
    FilePlus,
    Users,
    BarChart3,
    Settings,
    LogOut,
    ShieldCheck,
    Globe
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const NAV_ITEMS = [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/schemes/new', label: 'Launch Scheme', icon: FilePlus },
    { to: '/admin/applicants', label: 'Applicants', icon: Users },
    { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
    { to: '/admin/settings', label: 'Settings', icon: Settings },
];

function AdminSidebar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <aside className="w-64 bg-navy border-r border-navy-light/30 flex flex-col min-h-screen shrink-0 z-30">
            {/* Brand */}
            <div className="p-6 border-b border-navy-light/20">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-saffron rounded-xl flex items-center justify-center shadow-lg shadow-saffron/20">
                        <ShieldCheck className="text-white" size={24} />
                    </div>
                    <div>
                        <h1 className="font-display text-white text-lg font-bold leading-tight">Admin <span className="text-saffron">Panel</span></h1>
                        <p className="font-body text-[10px] text-gray-400 font-bold uppercase tracking-widest">Sarathi Engine</p>
                    </div>
                </div>
            </div>

            {/* Nav Links */}
            <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                {NAV_ITEMS.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.to === '/admin'}
                        className={({ isActive }) => `
              flex items-center gap-3 px-4 py-3 rounded-xl font-body text-sm font-medium transition-all duration-200
              ${isActive
                                ? 'bg-saffron text-white shadow-lg shadow-saffron/20'
                                : 'text-gray-400 hover:text-white hover:bg-navy-light/30'}
            `}
                    >
                        <item.icon size={20} />
                        {item.label}
                    </NavLink>
                ))}
            </nav>

            {/* Footer / User info */}
            <div className="p-4 border-t border-navy-light/20">
                <div className="bg-navy-mid/50 rounded-2xl p-4 mb-4">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 rounded-full bg-saffron/10 text-saffron flex items-center justify-center font-bold text-xs">
                            AD
                        </div>
                        <div className="overflow-hidden">
                            <p className="font-body text-xs font-bold text-white truncate">{user?.email || 'test-admin@sarathi.gov.in'}</p>
                            <p className="font-body text-[9px] text-saffron font-bold uppercase">Super Admin (Test Mode)</p>
                        </div>
                    </div>
                    <button
                        onClick={() => navigate('/')}
                        className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-navy-light/30 text-gray-400 text-xs hover:text-white hover:border-saffron transition-all"
                    >
                        <Globe size={14} /> View Public Site
                    </button>
                </div>

                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-body text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all"
                >
                    <LogOut size={20} />
                    Sign Out
                </button>
            </div>
        </aside>
    );
}

export default AdminSidebar;
