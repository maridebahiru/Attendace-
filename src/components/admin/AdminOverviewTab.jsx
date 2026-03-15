import React from 'react';
import { Users, UserCheck, QrCode, AlertCircle, TrendingUp, PieChart as PieChartIcon, Award, Zap, ShieldAlert, UserMinus } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { StatCard } from './AdminShared';

const AdminOverviewTab = ({ students, attendance }) => {
    // Calculate Overview Analytics
    const today = new Date().toISOString().split('T')[0];
    const presentToday = attendance.filter(a => a.date === today).length;

    // Advanced Data Processing for Recharts
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

    // Grouping Partner Scans - Optimized and Refined
    const partnerMap = {}; // phone -> partnerPhone
    students.forEach(s => {
        if (s.partnerPhone) partnerMap[s.phone] = s.partnerPhone;
    });

    const calculateMetrics = () => {
        // Group attendance by date for O(1) partner lookup
        const attendanceByDate = {};
        attendance.forEach(a => {
            if (!attendanceByDate[a.date]) attendanceByDate[a.date] = new Set();
            attendanceByDate[a.date].add(a.phone);
        });

        let synergeticScans = 0; // Both partners present
        let splitScans = 0;      // Has partner, but partner was absent
        let independentScans = 0; // No partner linked

        attendance.forEach(a => {
            const partnerId = partnerMap[a.phone];
            if (partnerId) {
                if (attendanceByDate[a.date]?.has(partnerId)) {
                    synergeticScans++;
                } else {
                    splitScans++;
                }
            } else {
                independentScans++;
            }
        });

        const totalScans = attendance.length;
        const linkedScans = synergeticScans + splitScans;
        
        // Synergy: Out of all scans by people with partners, how many were together?
        const synergyScore = linkedScans ? Math.round((synergeticScans / linkedScans) * 100) : 0;
        
        // General engagement
        const partneredPercentage = totalScans ? Math.round((synergeticScans / totalScans) * 100) : 0;
        const soloPercentage = totalScans ? Math.round(((splitScans + independentScans) / totalScans) * 100) : 0;

        return {
            synergeticScans,
            splitScans,
            independentScans,
            totalScans,
            synergyScore,
            partneredPercentage,
            soloPercentage
        };
    };

    const metrics = calculateMetrics();

    const pieData = [
        { name: 'Mutual (Synergy)', value: metrics.synergeticScans, color: 'var(--accent-gold)' },
        { name: 'Solo (Split)', value: metrics.splitScans, color: '#ff4d4d' },
        { name: 'Independent', value: metrics.independentScans, color: 'rgba(255, 255, 255, 0.1)' }
    ];

    // Compute top attendees
    const aggregated = students.map(s => {
        const records = attendance.filter(a => a.phone === s.phone);
        return { ...s, totalDays: records.length };
    });
    const topAttendees = [...aggregated].sort((a, b) => b.totalDays - a.totalDays).slice(0, 5);

    return (
        <div className="animate-fade-in">
            <div 
                className="mobile-stack"
                style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
                    gap: '20px', 
                    marginBottom: '32px' 
                }}
            >
                <StatCard icon={<Users color="var(--accent-gold)" />} label="Total Enrollment" value={students.length} subValue="Active Members" />
                <StatCard icon={<UserCheck color="var(--accent-gold)" />} label="Present Today" value={presentToday} subValue="Daily Attendance" />
                <StatCard icon={<QrCode color="var(--accent-gold)" />} label="Total Scans" value={attendance.length} subValue="Lifetime Aggregate" />
                <StatCard icon={<Zap color="var(--accent-gold)" />} label="Synergy Score" value={`${metrics.synergyScore}%`} subValue="Partner Reliability" />
                <StatCard icon={<ShieldAlert color="#ff4d4d" />} label="Solo Activity" value={`${metrics.soloPercentage}%`} subValue="Independent Scans" />
            </div>

            {/* GRAPHICS ROW */}
            <div 
                style={{ 
                    display: 'grid', 
                    gridTemplateColumns: window.innerWidth <= 1024 ? '1fr' : '1.8fr 1.2fr', 
                    gap: '24px', 
                    marginBottom: '32px' 
                }}
            >
                
                {/* 7-DAY TREND */}
                <div className="glass-effect animate-slide-up" style={{ padding: window.innerWidth <= 768 ? '20px' : '30px', borderRadius: 'var(--radius-lg)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                        <h3 style={{ color: 'var(--accent-gold)', margin: 0, display: 'flex', alignItems: 'center', gap: '10px', fontSize: '18px' }}>
                            <TrendingUp size={22} /> Weekly Velocity
                        </h3>
                    </div>
                    <div style={{ width: '100%', height: window.innerWidth <= 768 ? '240px' : '340px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorScans" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--accent-gold)" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="var(--accent-gold)" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="date" stroke="var(--text-primary)" opacity={0.3} axisLine={false} tickLine={false} tick={{ fontSize: 10 }} dy={10} />
                                <YAxis stroke="var(--text-primary)" opacity={0.3} axisLine={false} tickLine={false} tick={{ fontSize: 10 }} allowDecimals={false} dx={-10} />
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--accent-red)" opacity={0.1} vertical={false} />
                                <RechartsTooltip 
                                    contentStyle={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', borderRadius: '12px', boxShadow: 'var(--shadow-lg)' }}
                                    itemStyle={{ color: 'var(--accent-gold)', fontWeight: '700', fontSize: '12px' }}
                                />
                                <Area type="monotone" dataKey="scans" stroke="var(--accent-gold)" strokeWidth={3} fillOpacity={1} fill="url(#colorScans)" animationDuration={1500} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {/* ENGAGEMENT DONUT */}
                    <div className="glass-effect animate-slide-up" style={{ padding: '24px', borderRadius: 'var(--radius-lg)', flex: 1 }}>
                        <h3 style={{ color: 'var(--accent-gold)', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px' }}>
                            <PieChartIcon size={18} /> Engagement Distribution
                        </h3>
                        <div style={{ width: '100%', height: '220px', position: 'relative' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                        stroke="none"
                                        animationDuration={1500}
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} style={{ filter: `drop-shadow(0 0 12px ${entry.color}44)` }} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip 
                                        contentStyle={{ backgroundColor: 'var(--bg-tertiary)', border: 'none', borderRadius: '12px', boxShadow: 'var(--shadow-lg)' }}
                                        itemStyle={{ fontWeight: '700', fontSize: '12px' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                                <div style={{ fontSize: window.innerWidth <= 768 ? '24px' : '32px', fontWeight: '800', color: 'var(--accent-gold)', lineHeight: 1 }}>{metrics.synergyScore}%</div>
                                <div style={{ fontSize: '10px', opacity: 0.5, color: 'var(--text-primary)', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>Efficiency</div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-primary)', opacity: 0.7 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--accent-gold)' }}></div>
                                    Mutual Synergy
                                </div>
                                <span>{metrics.synergeticScans}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-primary)', opacity: 0.7 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ff4d4d' }}></div>
                                    Split Attendance
                                </div>
                                <span>{metrics.splitScans}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-primary)', opacity: 0.4 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: 'rgba(255,255,255,0.2)' }}></div>
                                    Independent
                                </div>
                                <span>{metrics.independentScans}</span>
                            </div>
                        </div>
                    </div>

                    {/* LEADERBOARD */}
                    <div className="glass-effect animate-slide-up" style={{ padding: '24px', borderRadius: 'var(--radius-lg)' }}>
                        <h3 style={{ color: 'var(--accent-gold)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '16px' }}>
                            <Award size={20} /> Hall of Fame
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {topAttendees.map((st, i) => (
                                <div key={st.phone} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', borderRadius: '12px', backgroundColor: 'rgba(211, 162, 0, 0.04)', border: '1px solid rgba(211, 162, 0, 0.05)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                                        <div style={{ fontSize: '12px', fontWeight: '800', opacity: 0.2, width: '15px' }}>{i + 1}</div>
                                        <div style={{ minWidth: 0, flex: 1 }}>
                                            <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{st.name}</div>
                                            <div style={{ fontSize: '10px', opacity: 0.4, color: 'var(--text-primary)' }}>{st.phone}</div>
                                        </div>
                                    </div>
                                    <div style={{ 
                                        backgroundColor: 'rgba(211, 162, 0, 0.1)', 
                                        color: 'var(--accent-gold)', 
                                        padding: '5px 12px', 
                                        borderRadius: '8px', 
                                        fontSize: '11px', 
                                        fontWeight: '800',
                                        border: '1px solid rgba(211, 162, 0, 0.1)',
                                        flexShrink: 0
                                    }}>
                                        {st.totalDays} SCANS
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminOverviewTab;
