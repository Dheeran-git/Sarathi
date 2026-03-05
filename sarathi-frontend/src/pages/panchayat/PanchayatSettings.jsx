import { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, User, Building, Bell, Globe, LogOut, Save, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { usePanchayat } from '../../context/PanchayatContext';
import { useNavigate } from 'react-router-dom';

function PanchayatSettings() {
    const { user, logout } = useAuth();
    const { panchayatProfile } = usePanchayat();
    const navigate = useNavigate();

    const [name, setName] = useState(panchayatProfile.officialName || user?.email?.split('@')[0] || '');
    const [role, setRole] = useState(panchayatProfile.role || 'sarpanch');
    const [mobile, setMobile] = useState('');
    const [email, setEmail] = useState(user?.email || '');
    const [notifAlerts, setNotifAlerts] = useState(true);
    const [notifCampaigns, setNotifCampaigns] = useState(true);
    const [notifGrievances, setNotifGrievances] = useState(false);
    const [saved, setSaved] = useState(false);

    const handleSave = () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
    };

    const handleLogout = () => { logout(); navigate('/'); };

    const Section = ({ icon: Icon, title, children }) => (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="font-display text-base text-navy mb-4 flex items-center gap-2">
                <Icon className="w-5 h-5 text-teal-500" /> {title}
            </h2>
            {children}
        </div>
    );

    const Fld = ({ label, value, onChange, disabled = false, type = 'text' }) => (
        <div className="flex flex-col gap-1.5">
            <label className="text-xs text-slate-500 font-body font-medium">{label}</label>
            <input type={type} value={value} onChange={onChange} disabled={disabled}
                className={`px-3 py-2 border border-slate-200 rounded-lg text-sm font-body focus:outline-none focus:ring-2 focus:ring-teal-500/30 ${disabled ? 'bg-slate-50 text-slate-400' : 'bg-white'}`} />
        </div>
    );

    return (
        <div className="p-4 lg:p-6 space-y-5 max-w-3xl">
            <div>
                <h1 className="font-display text-2xl text-navy flex items-center gap-2"><Settings className="w-6 h-6 text-teal-500" /> Settings</h1>
                <p className="text-sm text-slate-500 font-body">Manage your profile and preferences</p>
            </div>

            <Section icon={User} title="Official Details">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Fld label="Full Name" value={panchayatProfile.officialName || name} disabled={true} />
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs text-slate-500 font-body font-medium">Role</label>
                        <select value={panchayatProfile.role || role} disabled={true}
                            className="px-3 py-2 border border-slate-200 rounded-lg text-sm font-body focus:outline-none focus:ring-2 focus:ring-teal-500/30 bg-slate-50 text-slate-500">
                            <option value="sarpanch">Sarpanch</option>
                            <option value="secretary">Secretary</option>
                            <option value="field_worker">Field Worker</option>
                        </select>
                    </div>
                    <Fld label="Mobile" value={panchayatProfile.mobileNumber || mobile} disabled={true} type="tel" />
                    <Fld label="Email" value={email} disabled={true} type="email" />
                </div>
            </Section>

            <Section icon={Building} title="Panchayat Info">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Fld label="Panchayat Name" value={panchayatProfile.panchayatName || 'Rampur Panchayat'} disabled />
                    <Fld label="LGD Code" value={panchayatProfile.lgdCode || '123456'} disabled />
                    <Fld label="District" value={panchayatProfile.district || 'Barabanki'} disabled />
                    <Fld label="State" value={panchayatProfile.state || 'Uttar Pradesh'} disabled />
                </div>
            </Section>

            <Section icon={Bell} title="Notification Preferences">
                <div className="space-y-3">
                    {[
                        { label: 'Priority Alerts (urgent welfare gaps)', checked: notifAlerts, setter: setNotifAlerts },
                        { label: 'Campaign Reports (delivery & conversion)', checked: notifCampaigns, setter: setNotifCampaigns },
                        { label: 'Grievance Updates (status changes)', checked: notifGrievances, setter: setNotifGrievances },
                    ].map((n) => (
                        <label key={n.label} className="flex items-center gap-3 cursor-pointer">
                            <input type="checkbox" checked={n.checked} onChange={(e) => n.setter(e.target.checked)}
                                className="rounded border-slate-300 text-teal-600 focus:ring-teal-500/30 w-4 h-4" />
                            <span className="text-sm font-body text-slate-600">{n.label}</span>
                        </label>
                    ))}
                </div>
            </Section>

            {/* Actions */}
            <div className="flex items-center gap-3">
                <button onClick={handleSave}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-body font-semibold transition-all ${saved ? 'bg-emerald-500 text-white' : 'bg-teal-600 text-white hover:bg-teal-500'}`}>
                    {saved ? <><CheckCircle className="w-4 h-4" /> Saved!</> : <><Save className="w-4 h-4" /> Save Changes</>}
                </button>
                <button onClick={handleLogout}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-red-300 text-red-600 text-sm font-body font-medium hover:bg-red-50 transition-colors">
                    <LogOut className="w-4 h-4" /> Logout
                </button>
            </div>
        </div>
    );
}

export default PanchayatSettings;
