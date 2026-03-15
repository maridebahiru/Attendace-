import React from 'react';
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip as RechartsTooltip, Legend, Cell } from 'recharts';
import { LineChart, X, Activity, User, ShieldAlert, Zap } from 'lucide-react';

const AdminAnalyticsModal = ({ students, attendance, selectedStudentForAnalytics, setSelectedStudentForAnalytics }) => {
    if (!selectedStudentForAnalytics) return null;

    // ================= SPECIFIC STUDENT ANALYTICS LOGIC =================
    const getStudentAnalyticsData = (student) => {
        if (!student) return [];
        const partner = student.partnerPhone ? students.find(s => s.phone === student.partnerPhone) : null;
        
        // Generate a 14-day lookback for the specific student
        const last14Days = [...Array(14)].map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            return d.toISOString().split('T')[0];
        }).reverse();

        return last14Days.map(date => {
            const studentAttended = attendance.some(a => a.phone === student.phone && a.date === date) ? 1 : 0;
            const partnerAttended = partner ? (attendance.some(a => a.phone === partner.phone && a.date === date) ? 1 : 0) : 0;
            return {
                date: date.substring(5),
                [student.name.split(' ')[0]]: studentAttended,
                ...(partner ? { [partner.name.split(' ')[0]]: partnerAttended } : {})
            };
        });
    };

    const studentChartData = getStudentAnalyticsData(selectedStudentForAnalytics);
    const partnerNameForChart = selectedStudentForAnalytics.partnerName ? selectedStudentForAnalytics.partnerName.split(' ')[0] : null;
    const studentNameForChart = selectedStudentForAnalytics.name.split(' ')[0];

    const calculateSynergy = (student) => {
        if (!student || !student.partnerPhone) return 0;
        const studentRecords = attendance.filter(a => a.phone === student.phone);
        if (studentRecords.length === 0) return 0;
        let togetherCount = 0;
        studentRecords.forEach(r => {
            const partnerAttended = attendance.some(a => a.phone === student.partnerPhone && a.date === r.date);
            if (partnerAttended) togetherCount++;
        });
        return Math.round((togetherCount / studentRecords.length) * 100);
    };

    const synergy = calculateSynergy(selectedStudentForAnalytics);

    return (
        <div 
            style={{ 
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
                backgroundColor: 'rgba(15, 5, 8, 0.95)', backdropFilter: 'blur(10px)',
                zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' 
            }} 
            onClick={() => setSelectedStudentForAnalytics(null)}
        >
            <div 
                className="glass-effect animate-slide-up"
                style={{ 
                    width: '100%', maxWidth: '800px', borderRadius: '24px', 
                    overflow: 'hidden', display: 'flex', flexDirection: 'column',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
                }} 
                onClick={e => e.stopPropagation()}
            >
                
                {/* Header */}
                <div style={{ padding: '30px 40px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <div style={{ 
                            width: '56px', height: '56px', borderRadius: '16px', backgroundColor: 'var(--accent-red)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-gold)',
                            fontWeight: '800', fontSize: '20px'
                        }}>
                            {selectedStudentForAnalytics.name.charAt(0)}
                        </div>
                        <div>
                            <h2 style={{ color: 'var(--accent-gold)', margin: 0, fontSize: '24px', letterSpacing: '-0.5px' }}>Attendance Profile</h2>
                            <div style={{ fontSize: '14px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                                <User size={14} /> {selectedStudentForAnalytics.name} • {selectedStudentForAnalytics.phone}
                            </div>
                        </div>
                    </div>
                    <button 
                        onClick={() => setSelectedStudentForAnalytics(null)} 
                        style={{ 
                            background: 'rgba(101, 8, 27, 0.2)', border: '1px solid var(--glass-border)', 
                            color: 'var(--text-primary)', cursor: 'pointer', opacity: 0.6, width: '40px', height: '40px',
                            borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: '0.2s'
                        }}
                        onMouseEnter={(e)=>e.currentTarget.style.opacity=1}
                        onMouseLeave={(e)=>e.currentTarget.style.opacity=0.6}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div style={{ padding: '40px' }} className="custom-scroll">
                    
                    {/* Performance Summary Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '40px' }}>
                        <div className="glass-effect" style={{ padding: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.03)', textAlign: 'center' }}>
                            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}><Activity size={18} color="var(--accent-gold)" opacity={0.5} /></div>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Commitment</div>
                            <div style={{ fontSize: '32px', color: 'var(--accent-gold)', fontWeight: '800' }}>{selectedStudentForAnalytics.totalDays}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>Total Presence</div>
                        </div>
                        <div className="glass-effect" style={{ padding: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.03)', textAlign: 'center' }}>
                            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}><ShieldAlert size={18} color="#ff4d4d" opacity={0.5} /></div>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Solo Ratio</div>
                            <div style={{ fontSize: '32px', color: '#ff4d4d', fontWeight: '800' }}>{selectedStudentForAnalytics.soloDays}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>Independent Check-ins</div>
                        </div>
                        <div className="glass-effect" style={{ padding: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.03)', textAlign: 'center' }}>
                            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}><Zap size={18} color="var(--accent-gold)" opacity={0.5} /></div>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Synergy</div>
                            <div style={{ fontSize: '32px', color: 'var(--accent-gold)', fontWeight: '800' }}>{selectedStudentForAnalytics.partnerPhone ? `${synergy}%` : 'N/A'}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>Partner Link Stronghold</div>
                        </div>
                    </div>

                    {/* Visual Comparison Chart */}
                    <div className="glass-effect" style={{ padding: '30px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.03)' }}>
                        <h3 style={{ color: 'var(--text-primary)', fontSize: '16px', fontWeight: '700', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <LineChart size={20} color="var(--accent-gold)" /> 14-Day Presence Comparison
                        </h3>
                        <div style={{ width: '100%', height: '300px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={studentChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--accent-red)" opacity={0.1} vertical={false} />
                                    <XAxis dataKey="date" stroke="var(--text-primary)" opacity={0.3} axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                                    <YAxis stroke="var(--text-primary)" opacity={0.3} axisLine={false} tickLine={false} tick={{ fontSize: 11 }} allowDecimals={false} />
                                    <RechartsTooltip 
                                        contentStyle={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', borderRadius: '12px', boxShadow: 'var(--shadow-lg)' }}
                                        itemStyle={{ fontWeight: '700' }}
                                        cursor={{ fill: 'rgba(211, 162, 0, 0.05)' }}
                                    />
                                    <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '12px', fontWeight: '600' }} iconType="circle" />
                                    <Bar dataKey={studentNameForChart} fill="var(--accent-gold)" radius={[6, 6, 0, 0]} name={`${studentNameForChart} Presence`}>
                                        {studentChartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} style={{ filter: 'drop-shadow(0 4px 6px rgba(211, 162, 0, 0.2))' }} />
                                        ))}
                                    </Bar>
                                    {partnerNameForChart && (
                                        <Bar dataKey={partnerNameForChart} fill="rgba(211, 162, 0, 0.1)" stroke="var(--accent-gold)" strokeWidth={1} radius={[6, 6, 0, 0]} name={`${partnerNameForChart} (Linked Partner)`} />
                                    )}
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    
                    {/* Insights Footer */}
                    {!selectedStudentForAnalytics.partnerPhone && (
                        <div style={{ marginTop: '30px', padding: '20px', backgroundColor: 'rgba(255, 77, 77, 0.05)', borderRadius: '16px', border: '1px dashed rgba(255, 77, 77, 0.3)', color: 'var(--text-primary)', fontSize: '13px', textAlign: 'center', opacity: 0.8 }}>
                            <ShieldAlert size={18} style={{ marginBottom: '8px', opacity: 0.5 }} />
                            <div>This profile is strictly independent. Link a partner to unlock comparative synergy metrics.</div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminAnalyticsModal;
