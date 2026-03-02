import {
    Phone, MapPin, CreditCard, IndianRupee, Users,
    Edit, Award, FileText, CheckCircle2, Clock,
    TrendingUp, ShieldCheck
} from 'lucide-react';

export default function ProfilePage() {
    return (
        <div className="min-h-screen bg-[#f4f7fb] pb-12 font-sans text-slate-800">
            {/* Header Section */}
            <div className="bg-white border-b border-slate-200 pt-8 pb-6 px-4 md:px-8">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-2xl md:text-3xl font-bold text-[#1e3a8a] tracking-tight">
                        My Welfare Portfolio
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Your complete welfare profile, enrolled schemes, and benefit history at a glance.
                    </p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 md:px-8 mt-6">
                <div className="flex flex-col lg:flex-row gap-6">

                    {/* LEFT SIDEBAR: PROFILE CARD */}
                    <div className="w-full lg:w-[320px] shrink-0">
                        <div className="bg-white rounded-xl shadow-sm border border-green-500 overflow-hidden relative">
                            {/* Top decorative gradient line */}
                            <div className="h-1 w-full bg-gradient-to-r from-green-400 to-emerald-600"></div>

                            <div className="p-6">
                                {/* User Header */}
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center text-white text-xl font-bold shadow-md relative">
                                        RK
                                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-orange-500 rounded-full border-2 border-white flex items-center justify-center text-white">
                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                                        </div>
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-900">Rajesh Kumar</h2>
                                        <p className="text-xs text-slate-500 mt-0.5">42 yrs • Male</p>
                                        <div className="flex gap-2 mt-2">
                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700">
                                                BPL VERIFIED
                                            </span>
                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700">
                                                OBC
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Info List */}
                                <div className="space-y-4">
                                    <div className="flex gap-3 items-start p-2 rounded-lg bg-slate-50 border border-slate-100">
                                        <Phone size={16} className="text-blue-500 mt-0.5" />
                                        <div>
                                            <p className="text-[11px] text-slate-400 font-medium">Phone</p>
                                            <p className="text-xs font-semibold text-slate-700">+91 98765 43210</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-3 items-start p-2 hover:bg-slate-50 rounded-lg transition-colors">
                                        <MapPin size={16} className="text-blue-500 mt-0.5" />
                                        <div>
                                            <p className="text-[11px] text-slate-400 font-medium">Location</p>
                                            <p className="text-xs font-semibold text-slate-700">Gram Panchayat Rampur, Meerut</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-3 items-start p-2 hover:bg-slate-50 rounded-lg transition-colors">
                                        <CreditCard size={16} className="text-blue-500 mt-0.5" />
                                        <div>
                                            <p className="text-[11px] text-slate-400 font-medium">Aadhaar</p>
                                            <p className="text-xs font-semibold text-slate-700">XXXX-XXXX-4521</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-3 items-start p-2 rounded-lg bg-slate-50 border border-slate-100">
                                        <IndianRupee size={16} className="text-blue-500 mt-0.5" />
                                        <div>
                                            <p className="text-[11px] text-slate-400 font-medium">Annual Income</p>
                                            <p className="text-xs font-semibold text-slate-700">₹85,000</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-3 items-start p-2 hover:bg-slate-50 rounded-lg transition-colors">
                                        <Users size={16} className="text-blue-500 mt-0.5" />
                                        <div>
                                            <p className="text-[11px] text-slate-400 font-medium">Household Members</p>
                                            <p className="text-xs font-semibold text-slate-700">5</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Edit Button */}
                                <button className="w-full mt-6 py-2.5 rounded-lg border border-[#1e3a8a] text-[#1e3a8a] text-sm font-semibold hover:bg-blue-50 transition-colors flex items-center justify-center gap-2">
                                    <Edit size={16} /> Edit Profile
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT MAIN CONTENT */}
                    <div className="flex-1 space-y-6">

                        {/* 1. Top Stats Cards */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {/* Active Schemes */}
                            <div className="bg-white rounded-xl shadow-sm border border-blue-500 pt-5 pb-4 px-4 text-center">
                                <div className="w-10 h-10 mx-auto rounded-full bg-blue-500 text-white flex items-center justify-center mb-2 shadow-sm">
                                    <Award size={20} />
                                </div>
                                <p className="text-2xl font-bold text-[#1e3a8a]">4</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Active Schemes</p>
                            </div>
                            {/* Total Benefits */}
                            <div className="bg-white rounded-xl shadow-sm border border-orange-400 pt-5 pb-4 px-4 text-center">
                                <div className="w-10 h-10 mx-auto rounded-full bg-emerald-500 text-white flex items-center justify-center mb-2 shadow-sm">
                                    <IndianRupee size={20} />
                                </div>
                                <p className="text-2xl font-bold text-blue-600">₹18,400</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Total Benefits</p>
                            </div>
                            {/* Documents */}
                            <div className="bg-white rounded-xl shadow-sm border border-orange-400 pt-5 pb-4 px-4 text-center">
                                <div className="w-10 h-10 mx-auto rounded-full bg-red-400 text-white flex items-center justify-center mb-2 shadow-sm">
                                    <FileText size={20} />
                                </div>
                                <p className="text-2xl font-bold text-[#1e3a8a]">6</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Documents</p>
                            </div>
                            {/* Welfare Score */}
                            <div className="bg-white rounded-xl shadow-sm border border-slate-300 pt-5 pb-4 px-4 text-center shadow-[0_4px_14px_rgba(0,0,0,0.05)] relative overflow-hidden">
                                {/* Orange highlight top line */}
                                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-400 to-amber-500" />
                                <div className="w-10 h-10 mx-auto rounded-full bg-purple-500 text-white flex items-center justify-center mb-2 shadow-sm">
                                    <TrendingUp size={20} />
                                </div>
                                <p className="text-2xl font-bold text-[#1e3a8a]">87/100</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Welfare Score</p>
                            </div>
                        </div>

                        {/* 2. Enrolled Schemes Table */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="px-6 py-4 flex items-center gap-2 border-b-2 border-slate-100">
                                <ShieldCheck size={20} className="text-[#1e3a8a]" />
                                <h3 className="text-lg font-bold text-[#1e3a8a]">Enrolled Schemes</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-[#1e3a8a] text-white text-[11px] uppercase tracking-wider">
                                            <th className="py-3 px-6 font-semibold">Scheme</th>
                                            <th className="py-3 px-6 font-semibold">Status</th>
                                            <th className="py-3 px-6 font-semibold">Next Payment</th>
                                            <th className="py-3 px-6 font-semibold">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm divide-y divide-slate-100">
                                        <tr className="hover:bg-slate-50 transition-colors">
                                            <td className="py-4 px-6 font-medium text-slate-700">PM Kisan</td>
                                            <td className="py-4 px-6">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700">ACTIVE</span>
                                            </td>
                                            <td className="py-4 px-6 text-slate-500">Apr 2026</td>
                                            <td className="py-4 px-6 font-bold text-green-600">₹2,000</td>
                                        </tr>
                                        <tr className="hover:bg-slate-50 transition-colors bg-slate-50/50">
                                            <td className="py-4 px-6 font-medium text-slate-700">MGNREGA</td>
                                            <td className="py-4 px-6">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700">ACTIVE</span>
                                            </td>
                                            <td className="py-4 px-6 text-slate-500">On demand</td>
                                            <td className="py-4 px-6 font-bold text-green-600">₹202/day</td>
                                        </tr>
                                        <tr className="hover:bg-slate-50 transition-colors">
                                            <td className="py-4 px-6 font-medium text-slate-700">Ayushman Bharat</td>
                                            <td className="py-4 px-6">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700">ACTIVE</span>
                                            </td>
                                            <td className="py-4 px-6 text-slate-500">N/A</td>
                                            <td className="py-4 px-6 font-bold text-green-600">₹5,00,000 cover</td>
                                        </tr>
                                        <tr className="hover:bg-slate-50 transition-colors bg-slate-50/50">
                                            <td className="py-4 px-6 font-medium text-slate-700">Food Security</td>
                                            <td className="py-4 px-6">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700">ACTIVE</span>
                                            </td>
                                            <td className="py-4 px-6 text-slate-500">Monthly</td>
                                            <td className="py-4 px-6 font-bold text-green-600">35kg grain</td>
                                        </tr>
                                        <tr className="hover:bg-slate-50 transition-colors">
                                            <td className="py-4 px-6 font-medium text-slate-700">Ujjwala Yojana</td>
                                            <td className="py-4 px-6">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-yellow-100 text-yellow-700">COMPLETED</span>
                                            </td>
                                            <td className="py-4 px-6 text-slate-500">–</td>
                                            <td className="py-4 px-6 font-bold text-green-600">₹1,600 (one-time)</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* 3. Benefit Receipt History */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="px-6 py-4 flex items-center gap-2 border-b-2 border-slate-100">
                                <TrendingUp size={20} className="text-[#1e3a8a]" />
                                <h3 className="text-lg font-bold text-[#1e3a8a]">Benefit Receipt History</h3>
                            </div>
                            <div className="p-6 space-y-4">
                                {/* Item 1 */}
                                <div className="flex items-center justify-between p-4 rounded-lg bg-white border border-slate-200 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                                            <CheckCircle2 size={24} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-800">PM Kisan Samman Nidhi</p>
                                            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5"><Clock size={12} /> 15 Feb 2026</p>
                                        </div>
                                    </div>
                                    <p className="font-bold text-green-700">₹6,000</p>
                                </div>
                                {/* Item 2 */}
                                <div className="flex items-center justify-between p-4 rounded-lg bg-white border border-slate-200 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                                            <CheckCircle2 size={24} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-800">MGNREGA Wages</p>
                                            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5"><Clock size={12} /> 28 Jan 2026</p>
                                        </div>
                                    </div>
                                    <p className="font-bold text-green-700">₹8,400</p>
                                </div>
                                {/* Item 3 */}
                                <div className="flex items-center justify-between p-4 rounded-lg bg-white border border-slate-200 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                            <Clock size={24} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-800">Ayushman Bharat – PMJAY</p>
                                            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5"><Clock size={12} /> 10 Jan 2026</p>
                                        </div>
                                    </div>
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold bg-green-100 text-green-700">ACTIVE COVERAGE</span>
                                </div>
                                {/* Item 4 */}
                                <div className="flex items-center justify-between p-4 rounded-lg bg-white border border-slate-200 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                                            <CheckCircle2 size={24} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-800">Food Security – PDS</p>
                                            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5"><Clock size={12} /> 20 Dec 2025</p>
                                        </div>
                                    </div>
                                    <p className="font-bold text-green-700">₹2,400</p>
                                </div>
                                {/* Item 5 */}
                                <div className="flex items-center justify-between p-4 rounded-lg bg-white border border-slate-200 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                                            <CheckCircle2 size={24} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-800">PM Ujjwala Yojana</p>
                                            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5"><Clock size={12} /> 05 Nov 2025</p>
                                        </div>
                                    </div>
                                    <p className="font-bold text-green-700">₹1,600</p>
                                </div>

                                {/* Download Button */}
                                <button className="w-full mt-2 py-3 rounded-lg border border-[#1e3a8a] text-[#1e3a8a] text-sm font-semibold hover:bg-blue-50 transition-colors flex items-center justify-center gap-2">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                    Download Full Statement
                                </button>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
