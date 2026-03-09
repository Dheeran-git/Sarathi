import React from 'react';
import AdminSidebar from './components/ui/AdminSidebar';
import { useAuth } from './context/AuthContext';
import { Outlet, Navigate } from 'react-router-dom';

function AdminLayout() {
    const { isAdmin, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-navy">
                <div className="w-10 h-10 border-4 border-saffron border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!isAdmin) {
        return <Navigate to="/admin/login" replace />;
    }

    return (
        <div className="flex bg-off-white min-h-screen">
            <AdminSidebar />
            <div className="flex-1 min-h-screen">
                <div className="p-4 lg:p-10 max-w-[1600px] mx-auto">
                    <Outlet />
                </div>
            </div>
        </div>
    );
}

export default AdminLayout;
