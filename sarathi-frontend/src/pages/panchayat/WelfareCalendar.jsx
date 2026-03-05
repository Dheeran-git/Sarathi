import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { CalendarDays, ChevronLeft, ChevronRight, Clock, AlertTriangle, Megaphone, FileCheck } from 'lucide-react';
import { usePanchayat } from '../../context/PanchayatContext';

const TYPE_CONFIG = {
    scheme_deadline: { icon: Clock, bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' },
    life_event: { icon: AlertTriangle, bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500' },
    campaign: { icon: Megaphone, bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500' },
    audit: { icon: FileCheck, bg: 'bg-purple-100', text: 'text-purple-700', dot: 'bg-purple-500' },
};

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function WelfareCalendar() {
    const { calendarEvents } = usePanchayat();
    const [currentDate, setCurrentDate] = useState(new Date(2026, 2, 1)); // March 2026

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfWeek = new Date(year, month, 1).getDay();

    const days = useMemo(() => {
        const arr = [];
        for (let i = 0; i < firstDayOfWeek; i++) arr.push(null);
        for (let d = 1; d <= daysInMonth; d++) arr.push(d);
        return arr;
    }, [firstDayOfWeek, daysInMonth]);

    const getEventsForDay = (day) => {
        if (!day) return [];
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return calendarEvents.filter((e) => e.date === dateStr);
    };

    const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

    // Upcoming events sorted
    const upcoming = useMemo(() => {
        return [...calendarEvents]
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .filter((e) => {
                const eDate = new Date(e.date);
                return eDate.getFullYear() === year && eDate.getMonth() === month;
            });
    }, [calendarEvents, year, month]);

    return (
        <div className="p-4 lg:p-6 space-y-6 max-w-full">
            <div>
                <h1 className="font-display text-2xl text-navy flex items-center gap-2"><CalendarDays className="w-6 h-6 text-teal-500" /> Welfare Calendar</h1>
                <p className="text-sm text-slate-500 font-body">Scheme deadlines, life events, and campaign dates</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Calendar grid */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5">
                    {/* Month nav */}
                    <div className="flex items-center justify-between mb-5">
                        <button onClick={prevMonth} className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 transition-colors"><ChevronLeft className="w-5 h-5" /></button>
                        <h2 className="font-display text-lg text-navy">{MONTH_NAMES[month]} {year}</h2>
                        <button onClick={nextMonth} className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 transition-colors"><ChevronRight className="w-5 h-5" /></button>
                    </div>

                    {/* Day headers */}
                    <div className="grid grid-cols-7 gap-1 mb-2">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                            <div key={d} className="text-center text-xs font-body font-semibold text-slate-400 py-1">{d}</div>
                        ))}
                    </div>

                    {/* Days grid */}
                    <div className="grid grid-cols-7 gap-1">
                        {days.map((day, i) => {
                            const events = getEventsForDay(day);
                            const isToday = day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();
                            return (
                                <div key={i} className={`min-h-[72px] p-1.5 rounded-lg border text-xs font-body transition-colors ${day ? 'border-slate-100 hover:border-slate-200 bg-white' : 'border-transparent'
                                    } ${isToday ? 'ring-2 ring-teal-400/50 bg-teal-50/30' : ''}`}>
                                    {day && (
                                        <>
                                            <span className={`text-xs font-medium ${isToday ? 'text-teal-600' : 'text-slate-600'}`}>{day}</span>
                                            <div className="mt-0.5 space-y-0.5">
                                                {events.slice(0, 2).map((ev) => {
                                                    const cfg = TYPE_CONFIG[ev.type] || TYPE_CONFIG.campaign;
                                                    return (
                                                        <div key={ev.id} className={`flex items-center gap-1 px-1 py-0.5 rounded ${cfg.bg}`} title={ev.title}>
                                                            <div className={`w-1.5 h-1.5 rounded-full ${cfg.dot} shrink-0`} />
                                                            <span className={`truncate text-[10px] ${cfg.text}`}>{ev.title.slice(0, 18)}</span>
                                                        </div>
                                                    );
                                                })}
                                                {events.length > 2 && <span className="text-[10px] text-slate-400">+{events.length - 2} more</span>}
                                            </div>
                                        </>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </motion.div>

                {/* Upcoming events sidebar */}
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }} className="space-y-3">
                    <h2 className="font-display text-base text-navy">Upcoming Events</h2>
                    {upcoming.length === 0 ? (
                        <p className="text-sm text-slate-500 font-body">No events this month.</p>
                    ) : (
                        upcoming.map((ev) => {
                            const cfg = TYPE_CONFIG[ev.type] || TYPE_CONFIG.campaign;
                            return (
                                <div key={ev.id} className={`p-3 rounded-lg border border-slate-200 bg-white`}>
                                    <div className="flex items-start gap-2">
                                        <div className={`p-1.5 rounded-md ${cfg.bg} shrink-0`}>
                                            <cfg.icon className={`w-3.5 h-3.5 ${cfg.text}`} />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-body font-medium text-navy leading-tight">{ev.title}</p>
                                            <p className="text-xs text-slate-500 mt-1">{new Date(ev.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                            {ev.priority && (
                                                <span className={`inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${ev.priority === 'high' ? 'bg-red-100 text-red-600' : ev.priority === 'medium' ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-500'}`}>
                                                    {ev.priority}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </motion.div>
            </div>
        </div>
    );
}

export default WelfareCalendar;
