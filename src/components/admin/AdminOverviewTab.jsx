import React from 'react';
import { Users, UserCheck, QrCode, TrendingUp, UserMinus, Calendar } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { StatCard } from './AdminShared';

const AdminOverviewTab = ({ students, attendance }) => {
    const today = new Date().toISOString().split('T')[0];
    const presentToday = attendance.filter(a => a.date === today).length;
    const absentToday = Math.max(0, students.length - presentToday);
    const attendanceRate = students.length ? Math.round((presentToday / students.length) * 100) : 0;

    // Advanced Data Processing for Recharts (Last 7 Days)
    const processChartData = () => {
        const last7Days = [...Array(7)].map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            return d.toISOString().split('T')[0];
        }).reverse();

        return last7Days.map(date => {
            const count = attendance.filter(a => a.date === date).length;
            const displayDate = date.substring(5);
            return { date: displayDate, scans: count };
        });
    };

    const chartData = processChartData();

    // Compute top attendees
    const aggregated = students.map(s => {
        const records = attendance.filter(a => a.phone === s.phone || a.employeeId === s.employeeId);
        return { ...s, totalDays: records.length };
    });
    const topAttendees = [...aggregated].sort((a, b) => b.totalDays - a.totalDays).slice(0, 5);

    return (
        <div className="animate-fade-in">
            {/* Overview Stats Bar */}
            <div 
                className="mobile-stack"
                style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
                    gap: '20px', 
                    marginBottom: '32px' 
                }}
            >
                <StatCard icon={<Users color="var(--accent-gold)" />} label="Directory Total" value={students.length} subValue="Registered Attendees" />
                <StatCard icon={<UserCheck color="var(--accent-gold)" />} label="Total Present Today" value={presentToday} subValue="Checked In Today" />
                <StatCard icon={<UserMinus color="#ff4d4d" />} label="Total Absent Today" value={absentToday} subValue="Not Checked In" />
                <StatCard icon={<TrendingUp color="var(--accent-gold)" />} label="Attendance Rate" value={`${attendanceRate}%`} subValue="Daily Turnout" />
                <StatCard icon={<QrCode color="var(--accent-gold)" />} label="Total Lifetime Scans" value={attendance.length} subValue="Aggregate Scans" />
            </div>

            {/* Graphics & Leaderboard Row */}
            <div 
                style={{ 
                    display: 'grid', 
                    gridTemplateColumns: window.innerWidth <= 1024 ? '1fr' : '1.8fr 1.2fr', 
                    gap: '24px', 
                    marginBottom: '32px' 
                }}
            >
                {/* 7-Day Attendance Trend */}
                <div className="glass-effect" style={{ padding: '24px', borderRadius: 'var(--radius-lg)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <div>
                            <h3 style={{ color: 'var(--accent-gold)', fontSize: '18px', margin: 0 }}>Attendance Volume Trend</h3>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '12px', marginTop: '4px' }}>Daily scan activity over the past 7 days</p>
                        </div>
                    </div>

                    <div style={{ width: '100%', height: '260px', minWidth: 0 }}>
                        <ResponsiveContainer width="100%" height={260} minWidth={0}>
                            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="scanGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--accent-gold)" stopOpacity={0.4}/>
                                        <stop offset="95%" stopColor="var(--accent-gold)" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="date" stroke="var(--text-secondary)" fontSize={12} tickLine={false} />
                                <YAxis stroke="var(--text-secondary)" fontSize={12} tickLine={false} />
                                <RechartsTooltip 
                                    contentStyle={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--accent-gold)', borderRadius: '12px', color: 'var(--text-primary)' }}
                                />
                                <Area type="monotone" dataKey="scans" stroke="var(--accent-gold)" strokeWidth={3} fillOpacity={1} fill="url(#scanGradient)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Leaderboard / Top Attendees */}
                <div className="glass-effect" style={{ padding: '24px', borderRadius: 'var(--radius-lg)' }}>
                    <h3 style={{ color: 'var(--accent-gold)', fontSize: '18px', margin: '0 0 16px 0' }}>Top Attendees</h3>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {topAttendees.map((s, index) => (
                            <div 
                                key={s.phone || index}
                                style={{
                                    padding: '12px 16px',
                                    borderRadius: '12px',
                                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    borderLeft: index === 0 ? '4px solid var(--accent-gold)' : '4px solid transparent'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{
                                        width: '28px', height: '28px', borderRadius: '50%',
                                        backgroundColor: index === 0 ? 'var(--accent-gold)' : 'rgba(255,255,255,0.1)',
                                        color: index === 0 ? '#1a0a0f' : 'var(--text-primary)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '12px', fontWeight: '800'
                                    }}>
                                        #{index + 1}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: '700', fontSize: '14px' }}>{s.name}</div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{s.department || 'General'}</div>
                                    </div>
                                </div>
                                <div style={{ fontWeight: '800', color: 'var(--accent-gold)', fontSize: '14px' }}>
                                    {s.totalDays} Days
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminOverviewTab;
