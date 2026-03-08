import React from 'react';
import AdminSidebar from './components/ui/AdminSidebar';
import { useAuth } from './context/AuthContext';
import { Outlet } from 'react-router-dom';

function AdminLayout() {
    // const { isAdmin } = useAuth();
    // if (!isAdmin) return null; // Safety check disabled for testing

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
