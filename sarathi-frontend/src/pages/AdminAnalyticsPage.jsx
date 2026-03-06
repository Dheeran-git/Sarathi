import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { Search, Filter, Download } from 'lucide-react';

const data = [
    { month: 'Jan', clicks: 4000, applications: 2400 },
    { month: 'Feb', clicks: 3000, applications: 1398 },
    { month: 'Mar', clicks: 2000, applications: 9800 },
    { month: 'Apr', clicks: 2780, applications: 3908 },
    { month: 'May', clicks: 1890, applications: 4800 },
    { month: 'June', clicks: 2390, applications: 3800 },
];

function AdminAnalyticsPage() {
    return (
        <div className="space-y-8">
            <header className="flex items-end justify-between">
                <div>
                    <h1 className="font-display text-3xl font-bold text-navy">Deep <span className="text-saffron">Analytics</span></h1>
                    <p className="font-body text-sm text-gray-500 mt-1">Detailed engagement and conversion metrics</p>
                </div>
                <button className="flex items-center gap-2 bg-navy text-white px-4 py-2 rounded-xl font-body text-sm font-bold hover:shadow-lg transition-all">
                    <Download size={18} /> Export Data
                </button>
            </header>

            <div className="grid grid-cols-1 gap-6">
                <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="font-display text-lg text-navy">Engagement Overview</h3>
                        <div className="flex gap-2">
                            <div className="flex items-center gap-2 px-3 py-1 bg-gray-50 rounded-lg border border-gray-100 text-xs font-bold text-gray-500">
                                <span className="w-2 h-2 rounded-full bg-saffron" /> Clicks
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1 bg-gray-50 rounded-lg border border-gray-100 text-xs font-bold text-gray-500">
                                <span className="w-2 h-2 rounded-full bg-navy" /> Applications
                            </div>
                        </div>
                    </div>
                    <div className="h-96">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#999', fontSize: 12 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#999', fontSize: 12 }} />
                                <Tooltip cursor={{ fill: '#f8f8f8' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} />
                                <Bar dataKey="clicks" fill="#E8740C" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="applications" fill="#0F2240" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AdminAnalyticsPage;
