import React, { useState, useEffect } from 'react';
import { Calendar, Users, QrCode, UserCheck, AlertCircle, Search, ChevronDown, Clock, ShieldCheck, Zap } from 'lucide-react';
import { StatCard } from './AdminShared';

const formatTime = (scannedAt) => {
    if (!scannedAt) return 'N/A';
    try {
        if (typeof scannedAt.toDate === 'function') {
            return scannedAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        if (scannedAt instanceof Date) {
            return scannedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        if (typeof scannedAt === 'object' && typeof scannedAt.seconds === 'number') {
            return new Date(scannedAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        if (typeof scannedAt === 'string' || typeof scannedAt === 'number') {
            const d = new Date(scannedAt);
            if (!isNaN(d.getTime())) {
                return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            }
            return String(scannedAt);
        }
    } catch (e) {
        console.error('Error formatting scannedAt time:', e);
    }
    return 'N/A';
};

const AdminDateAnalysisTab = ({ students = [], attendance = [] }) => {
    // Extract unique valid dates from attendance and sort them descending
    const availableDates = [...new Set(attendance.map(a => a?.date).filter(Boolean))].sort((a, b) => b.localeCompare(a));
    
    // Default to the most recent attendance date if available, else today
    const [selectedDate, setSelectedDate] = useState(availableDates[0] || new Date().toISOString().split('T')[0]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (availableDates.length > 0 && !availableDates.includes(selectedDate)) {
            setSelectedDate(availableDates[0]);
        }
    }, [attendance]);

    // Filter attendance for the selected date
    const dateAttendance = attendance.filter(a => a && a.date === selectedDate);
    
    // Calculate Stats for this specific date
    const totalScans = dateAttendance.length;
    
    const partnerMap = {}; // phone -> partnerPhone
    students.forEach(s => {
        if (s && s.phone && s.partnerPhone) {
            partnerMap[s.phone] = s.partnerPhone;
        }
    });

    const calculateDailyMetrics = () => {
        const presentPhones = new Set(dateAttendance.map(a => a.phone).filter(Boolean));
        const presentEmpIds = new Set(dateAttendance.map(a => a.employeeId).filter(Boolean));

        let synergeticCount = 0;
        let splitCount = 0;
        let independentCount = 0;

        dateAttendance.forEach(a => {
            const student = students.find(s => 
                (a.phone && s.phone === a.phone) || 
                (a.employeeId && (s.employeeId === a.employeeId || s.idNo === a.employeeId))
            );
            const partnerPhone = student?.partnerPhone;
            if (partnerPhone) {
                const partnerStudent = students.find(s => s.phone === partnerPhone);
                const partnerEmpId = partnerStudent?.employeeId || partnerStudent?.idNo;
                const isPartnerPresent = presentPhones.has(partnerPhone) || (partnerEmpId && presentEmpIds.has(partnerEmpId));

                if (isPartnerPresent) {
                    synergeticCount++;
                } else {
                    splitCount++;
                }
            } else {
                independentCount++;
            }
        });

        const linkedScans = synergeticCount + splitCount;
        const synergyScore = linkedScans ? Math.round((synergeticCount / linkedScans) * 100) : 0;

        return { synergeticCount, splitCount, independentCount, synergyScore };
    };

    const metrics = calculateDailyMetrics();

    // Prepare table data for the selected date
    const attendedStudents = dateAttendance.map(a => {
        const student = students.find(s => 
            (a.phone && s.phone === a.phone) || 
            (a.employeeId && (s.employeeId === a.employeeId || s.idNo === a.employeeId))
        ) || { name: a.studentName || 'Attendee', phone: a.phone || a.employeeId || 'N/A' };
        
        const partnerPhone = student.partnerPhone;
        const partnerStudent = partnerPhone ? students.find(s => s.phone === partnerPhone) : null;
        const partnerName = partnerStudent?.name || (partnerPhone ? 'Unknown Partner' : null);
        const partnerEmpId = partnerStudent?.employeeId || partnerStudent?.idNo;
        
        const presentPhones = new Set(dateAttendance.map(d => d.phone).filter(Boolean));
        const presentEmpIds = new Set(dateAttendance.map(d => d.employeeId).filter(Boolean));
        
        const partnerAttended = partnerPhone 
            ? presentPhones.has(partnerPhone) || (partnerEmpId && presentEmpIds.has(partnerEmpId))
            : false;

        return {
            ...student,
            name: student.name || a.studentName || 'Attendee',
            phone: student.phone || a.phone || 'N/A',
            scannedAt: a.scannedAt,
            partnerName,
            isPartnerPresent: partnerAttended,
            isSolo: partnerPhone ? !partnerAttended : true
        };
    }).filter(s => 
        (s.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
        (s.phone || '').includes(searchTerm) ||
        (s.employeeId || '').toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => {
        const getGroupSortName = (st) => {
            if (!st.partnerPhone) return st.name || '';
            const pName = st.partnerName || 'Unknown';
            return (st.name || '').localeCompare(pName) < 0 ? st.name || '' : pName;
        };

        const groupA = getGroupSortName(a);
        const groupB = getGroupSortName(b);
        
        if (groupA !== groupB) {
            return (groupA || '').localeCompare(groupB || '');
        }
        return (a.name || '').localeCompare(b.name || '');
    });

    const thStyle = { 
        padding: '18px 15px', fontWeight: '700', fontSize: '12px', textTransform: 'uppercase', 
        letterSpacing: '1px', color: 'var(--accent-gold)', borderBottom: '2px solid var(--accent-red)',
        position: 'sticky', top: 0, backgroundColor: 'var(--bg-tertiary)', zIndex: 10
    };
    const tdStyle = { padding: '15px', borderBottom: '1px solid rgba(118, 118, 118, 0.1)', fontSize: '14px' };

    return (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: window.innerWidth <= 768 ? '16px' : '30px' }}>
            {/* Selection Area */}
            <div className="glass-effect" style={{ padding: window.innerWidth <= 768 ? '16px' : '24px', borderRadius: 'var(--radius-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ width: window.innerWidth <= 768 ? '40px' : '48px', height: window.innerWidth <= 768 ? '40px' : '48px', borderRadius: '12px', backgroundColor: 'rgba(211, 162, 0, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Calendar color="var(--accent-gold)" size={window.innerWidth <= 768 ? 20 : 24} />
                    </div>
                    <div>
                        <h3 style={{ color: 'var(--accent-gold)', fontSize: window.innerWidth <= 768 ? '18px' : '20px', margin: 0 }}>Date Insights</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '12px', marginTop: '2px' }}>Analytics for {selectedDate}.</p>
                    </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', width: window.innerWidth <= 768 ? '100%' : 'auto' }}>
                    <select 
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        style={{
                            padding: '12px 40px 12px 15px', borderRadius: '12px', border: '1px solid var(--accent-gold)',
                            backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none',
                            fontSize: '14px', cursor: 'pointer', appearance: 'none', fontWeight: '700',
                            width: '100%'
                        }}
                    >
                        {availableDates.length === 0 ? (
                            <option value={selectedDate}>{selectedDate} (No Data)</option>
                        ) : (
                            availableDates.map(date => {
                                const parsedDate = new Date(date.replace(/-/g, '/'));
                                const formatted = isNaN(parsedDate.getTime()) ? date : parsedDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
                                return <option key={date} value={date}>{formatted}</option>;
                            })
                        )}
                    </select>
                </div>
            </div>

            {/* Performance KPIs */}
            <div 
                className="mobile-stack"
                style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
                    gap: '20px' 
                }}
            >
                <StatCard icon={<QrCode color="var(--accent-gold)" />} label="Daily Scans" value={totalScans} />
                <StatCard icon={<Zap color="var(--accent-gold)" />} label="Daily Synergy" value={`${metrics.synergyScore}%`} />
                <StatCard icon={<Users color="var(--accent-gold)" />} label="Mutual" value={metrics.synergeticCount} />
                <StatCard icon={<AlertCircle color="#ff4d4d" />} label="Solo/Split" value={metrics.splitCount + metrics.independentCount} />
            </div>

            {/* Daily Log Table */}
            <div className="glass-effect animate-slide-up" style={{ padding: '0', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                <div style={{ padding: window.innerWidth <= 768 ? '16px' : '24px', backgroundColor: 'rgba(255, 255, 255, 0.02)', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
                    <h4 style={{ color: 'var(--text-primary)', margin: 0, fontSize: '15px' }}>Attendance Log ({attendedStudents.length})</h4>
                    <div style={{ position: 'relative', width: window.innerWidth <= 768 ? '100%' : '320px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--accent-gold)', opacity: 0.5 }} />
                        <input
                            type="text" placeholder="Search attendee..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%', padding: '10px 10px 10px 40px', borderRadius: '10px', border: '1px solid var(--glass-border)',
                                backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none', fontSize: '14px'
                            }}
                        />
                    </div>
                </div>

                <div className="mobile-scroll-x" style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
                        <thead>
                            <tr>
                                <th style={thStyle}>Attendee</th>
                                <th style={thStyle}>Partner Status</th>
                                <th style={thStyle}>Timestamp</th>
                                <th style={thStyle}>Arrival Mode</th>
                            </tr>
                        </thead>
                        <tbody>
                            {attendedStudents.length === 0 ? (
                                <tr>
                                    <td colSpan="4" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                        No attendance records found for this date.
                                    </td>
                                </tr>
                            ) : (
                                attendedStudents.map((s, i) => {
                                    const next = attendedStudents[i + 1];
                                    const prev = attendedStudents[i - 1];
                                    const isPartnerWithNext = next && (s.partnerPhone === next.phone);
                                    const isPartnerWithPrev = prev && (prev.partnerPhone === s.phone);
                                    const isStartOfGroup = isPartnerWithNext && !isPartnerWithPrev;
                                    const isEndOfGroup = isPartnerWithPrev && !isPartnerWithNext;
                                    const inGroup = isPartnerWithNext || isPartnerWithPrev;

                                    const initialChar = (s.name || '?').charAt(0).toUpperCase();

                                    return (
                                    <React.Fragment key={s.docId || s.phone || i}>
                                        {isStartOfGroup && i !== 0 && <tr style={{ height: '20px' }}><td colSpan="4"></td></tr>}
                                        <tr style={{ backgroundColor: inGroup ? 'rgba(211, 162, 0, 0.04)' : 'transparent', borderLeft: inGroup ? '4px solid var(--accent-gold)' : '4px solid transparent' }}>
                                            <td style={tdStyle}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: 'var(--accent-red)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-gold)', fontSize: '13px', fontWeight: '800' }}>
                                                        {initialChar}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{s.name}</div>
                                                        <div style={{ fontSize: '11px', opacity: 0.5, color: 'var(--text-primary)' }}>{s.phone}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={tdStyle}>
                                                {s.partnerName ? (
                                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                        <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: '600' }}>{s.partnerName}</span>
                                                        <span style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', color: s.isPartnerPresent ? 'var(--accent-gold)' : '#ff4d4d', fontWeight: '800' }}>
                                                            {s.isPartnerPresent ? <ShieldCheck size={10} /> : <AlertCircle size={10} />}
                                                            {s.isPartnerPresent ? 'Joined Group' : 'Missing in Action'}
                                                        </span>
                                                    </div>
                                                ) : <span style={{ fontSize: '12px', opacity: 0.3, color: 'var(--text-primary)' }}>Independent Entry</span>}
                                            </td>
                                            <td style={tdStyle}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)', opacity: 0.8 }}>
                                                    <Clock size={14} style={{ color: 'var(--accent-gold)', opacity: 0.5 }} />
                                                    {formatTime(s.scannedAt)}
                                                </div>
                                            </td>
                                            <td style={tdStyle}>
                                                <span style={{ backgroundColor: s.isSolo ? 'rgba(255, 77, 77, 0.1)' : 'rgba(211, 162, 0, 0.1)', color: s.isSolo ? '#ff4d4d' : 'var(--accent-gold)', padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '800', border: s.isSolo ? '1px solid rgba(255, 77, 77, 0.2)' : '1px solid rgba(211, 162, 0, 0.2)' }}>
                                                    {s.isSolo ? 'SOLO ENTRY' : 'WITH PARTNER'}
                                                </span>
                                            </td>
                                        </tr>
                                        {isEndOfGroup && i !== attendedStudents.length - 1 && <tr style={{ height: '20px' }}><td colSpan="4"></td></tr>}
                                    </React.Fragment>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminDateAnalysisTab;

