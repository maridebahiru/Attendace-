import React, { useState } from 'react';
import { Search, Download, UserCheck, BarChart2, Hash, Phone, Clock, Calendar as CalendarIcon, UserPlus, UserMinus, ChevronDown, X } from 'lucide-react';

const AdminDataTab = ({ 
    students, 
    attendance, 
    exportCSV, 
    handleLinkPartner, 
    handleUnlinkPartner, 
    setSelectedStudentForAnalytics, 
    manualCheckIn 
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
    const [linkingStudentId, setLinkingStudentId] = useState(null);
    const [partnerSearchTerm, setPartnerSearchTerm] = useState('');

    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const actionBtnStyle = {
        padding: '10px 18px', borderRadius: '10px', border: '1px solid var(--glass-border)',
        backgroundColor: 'rgba(211, 162, 0, 0.05)', color: 'var(--text-primary)', cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '600',
        transition: 'var(--transition-smooth)'
    };

    const thStyle = { 
        padding: '18px 15px', fontWeight: '700', fontSize: '12px', textTransform: 'uppercase', 
        letterSpacing: '1px', color: 'var(--accent-gold)', borderBottom: '2px solid var(--accent-red)',
        position: 'sticky', top: 0, backgroundColor: 'var(--bg-tertiary)', zIndex: 10
    };
    const tdStyle = { padding: '15px', borderBottom: '1px solid rgba(101, 8, 27, 0.2)', fontSize: '14px' };

    const aggregated = students.map(s => {
        const records = attendance.filter(a => a.phone === s.phone);
        const partnerId = s.partnerPhone;
        let soloDays = 0;
        
        records.forEach(r => {
            if (partnerId) {
                const partnerAttended = attendance.some(record => record.phone === partnerId && record.date === r.date);
                if (!partnerAttended) soloDays++;
            } else {
                soloDays++;
            }
        });

        const partnerName = partnerId ? students.find(st => st.phone === partnerId)?.name || 'Unknown' : null;

        return {
            ...s,
            totalDays: records.length,
            soloDays,
            partnerName,
            lastSeen: records.sort((a, b) => b.scannedAt - a.scannedAt)[0]?.scannedAt
        };
    }).filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.phone.includes(searchTerm)
    ).sort((a, b) => {
        if (sortConfig.key === 'totalDays') {
            return sortConfig.direction === 'asc' ? a.totalDays - b.totalDays : b.totalDays - a.totalDays;
        }
        if (sortConfig.key === 'soloDays') {
            return sortConfig.direction === 'asc' ? a.soloDays - b.soloDays : b.soloDays - a.soloDays;
        }
        if (sortConfig.key === 'lastSeen') {
            const aTime = a.lastSeen?.toMillis() || 0;
            const bTime = b.lastSeen?.toMillis() || 0;
            return sortConfig.direction === 'asc' ? aTime - bTime : bTime - aTime;
        }

        const getGroupId = (st) => st.partnerPhone ? (st.phone < st.partnerPhone ? st.phone : st.partnerPhone) : st.phone;
        const groupA = getGroupId(a);
        const groupB = getGroupId(b);
        
        if (groupA !== groupB) {
            const getSortName = (st) => st.partnerPhone && st.partnerPhone < st.phone ? (st.partnerName || '') : st.name;
            const res = getSortName(a).localeCompare(getSortName(b));
            return sortConfig.direction === 'asc' ? res : -res;
        }
        const innerRes = a.name.localeCompare(b.name);
        return sortConfig.direction === 'asc' ? innerRes : -innerRes;
    });

    return (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: window.innerWidth <= 768 ? '16px' : '24px' }}>
            {/* Header / Actions Section */}
            <div className="glass-effect" style={{ padding: window.innerWidth <= 768 ? '16px' : '24px', borderRadius: 'var(--radius-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
                <div>
                    <h3 style={{ color: 'var(--accent-gold)', fontSize: window.innerWidth <= 768 ? '18px' : '20px', margin: 0 }}>Student Directory</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px' }}>Browse and manage student profiles and partner relationships.</p>
                </div>
            </div>

            {/* Main Table Content */}
            <div className="glass-effect animate-slide-up" style={{ padding: '0', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                <div style={{ padding: window.innerWidth <= 768 ? '16px' : '24px', backgroundColor: 'rgba(255, 255, 255, 0.02)', borderBottom: '1px solid var(--glass-border)' }}>
                    <div style={{ position: 'relative', maxWidth: '100%' }}>
                        <Search size={20} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--accent-gold)', opacity: 0.5 }} />
                        <input
                            type="text"
                            placeholder="Find student..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%', padding: '12px 12px 12px 44px', borderRadius: '12px', border: '1px solid var(--glass-border)',
                                backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none',
                                fontSize: '14px', transition: 'var(--transition-smooth)'
                            }}
                        />
                    </div>
                </div>

                <div className="mobile-scroll-x" style={{ overflowX: 'auto', maxHeight: '700px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
                        <thead>
                            <tr style={{ cursor: 'pointer' }}>
                                <th style={thStyle} onClick={() => handleSort('name')}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        Student Name {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                    </div>
                                </th>
                                <th style={thStyle}>Linked Partner</th>
                                <th style={{ ...thStyle }} onClick={() => handleSort('lastSeen')}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        Last Presence {sortConfig.key === 'lastSeen' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                    </div>
                                </th>
                                <th style={{ ...thStyle, textAlign: 'center' }} onClick={() => handleSort('totalDays')}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                        Total {sortConfig.key === 'totalDays' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                    </div>
                                </th>
                                <th style={{ ...thStyle, textAlign: 'center' }} onClick={() => handleSort('soloDays')}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                        Solo {sortConfig.key === 'soloDays' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                    </div>
                                </th>
                                <th style={{ ...thStyle, textAlign: 'center' }}>Management</th>
                            </tr>
                        </thead>
                        <tbody>
                            {aggregated.map((s, i) => {
                                const next = aggregated[i + 1];
                                const prev = aggregated[i - 1];
                                const isPartnerWithNext = next && (s.partnerPhone === next.phone);
                                const isPartnerWithPrev = prev && (prev.partnerPhone === s.phone);
                                const isStartOfGroup = isPartnerWithNext && !isPartnerWithPrev;
                                const isEndOfGroup = isPartnerWithPrev && !isPartnerWithNext;
                                const inGroup = isPartnerWithNext || isPartnerWithPrev;

                                return (
                                <React.Fragment key={i}>
                                    {isStartOfGroup && i !== 0 && <tr style={{ height: '24px' }}><td colSpan="6"></td></tr>}
                                    <tr 
                                        style={{ 
                                            backgroundColor: inGroup ? 'rgba(211, 162, 0, 0.04)' : 'transparent',
                                            transition: 'var(--transition-smooth)',
                                            borderLeft: inGroup ? '4px solid var(--accent-gold)' : '4px solid transparent'
                                        }}
                                        className="table-row-hover"
                                    >
                                        <td style={tdStyle}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                                <div style={{
                                                    width: '40px', height: '40px', borderRadius: '12px', backgroundColor: 'var(--accent-red)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-gold)', 
                                                    fontSize: '14px', fontWeight: '800', boxShadow: 'inset 0 0 10px rgba(0,0,0,0.2)'
                                                }}>
                                                    {s.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{s.name}</div>
                                                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <Phone size={10} /> {s.phone}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={tdStyle}>
                                            {linkingStudentId === s.phone ? (
                                                <div style={{ position: 'relative' }}>
                                                    <div style={{ 
                                                        position: 'absolute', zIndex: 100, width: '280px', top: -10, left: 0,
                                                        backgroundColor: 'var(--bg-tertiary)', padding: '16px', borderRadius: '14px', 
                                                        border: '1px solid var(--accent-gold)', boxShadow: 'var(--shadow-lg)',
                                                        animation: 'slideUp 0.3s ease-out'
                                                    }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                                            <span style={{ fontSize: '13px', color: 'var(--accent-gold)', fontWeight: '700' }}>Select Partner</span>
                                                            <button onClick={() => { setLinkingStudentId(null); setPartnerSearchTerm(''); }} style={{ background: 'none', border: 'none', color: '#ff4d4d', cursor: 'pointer', fontSize: '18px' }}><X size={16} /></button>
                                                        </div>
                                                        <input
                                                            type="text" autoFocus placeholder="Find student..."
                                                            value={partnerSearchTerm}
                                                            onChange={(e) => setPartnerSearchTerm(e.target.value)}
                                                            style={{ 
                                                                width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--glass-border)',
                                                                backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', marginBottom: '10px', outline: 'none'
                                                            }}
                                                        />
                                                        <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }} className="custom-scroll">
                                                            {students
                                                                .filter(st => st.phone !== s.phone && !st.partnerPhone)
                                                                .filter(st => st.name.toLowerCase().includes(partnerSearchTerm.toLowerCase()) || st.phone.includes(partnerSearchTerm))
                                                                .map(st => (
                                                                    <button
                                                                        key={st.phone}
                                                                        onClick={() => { handleLinkPartner(s.phone, st.phone); setLinkingStudentId(null); }}
                                                                        style={{ 
                                                                            textAlign: 'left', padding: '10px', backgroundColor: 'rgba(255,255,255,0.03)', 
                                                                            color: 'var(--text-primary)', border: 'none', cursor: 'pointer', borderRadius: '8px', 
                                                                            transition: 'var(--transition-smooth)' 
                                                                        }}
                                                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(211, 162, 0, 0.15)'}
                                                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)'}
                                                                    >
                                                                        <div style={{ fontSize: '13px', fontWeight: 'bold' }}>{st.name}</div>
                                                                        <div style={{ fontSize: '10px', opacity: 0.5 }}>{st.phone}</div>
                                                                    </button>
                                                                ))}
                                                            {students.filter(st => st.phone !== s.phone && !st.partnerPhone && (st.name.toLowerCase().includes(partnerSearchTerm.toLowerCase()) || st.phone.includes(partnerSearchTerm))).length === 0 && (
                                                                <div style={{ padding: '20px', fontSize: '12px', opacity: 0.5, textAlign: 'center' }}>No available partners.</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : s.partnerName ? (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <span style={{ fontSize: '13px', color: 'var(--text-primary)', opacity: 0.9 }}>{s.partnerName}</span>
                                                    <button onClick={() => handleUnlinkPartner(s.phone, s.partnerPhone)} style={{ background: 'none', border: 'none', color: '#ff4d4d', cursor: 'pointer', opacity: 0.5, transition: '0.2s' }} onMouseEnter={(e)=>e.currentTarget.style.opacity=1} onMouseLeave={(e)=>e.currentTarget.style.opacity=0.5}>
                                                        <UserMinus size={14} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <button 
                                                    onClick={() => setLinkingStudentId(s.phone)} 
                                                    style={{ 
                                                        backgroundColor: 'transparent', color: 'var(--accent-gold)', border: '1px solid rgba(211, 162, 0, 0.3)', 
                                                        padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '700',
                                                        transition: 'var(--transition-smooth)'
                                                    }}
                                                    onMouseEnter={(e) => {e.currentTarget.style.backgroundColor = 'rgba(211, 162, 0, 0.1)'; e.currentTarget.style.borderColor = 'var(--accent-gold)';}}
                                                    onMouseLeave={(e) => {e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.borderColor = 'rgba(211, 162, 0, 0.3)';}}
                                                >
                                                    <UserPlus size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Link Partner
                                                </button>
                                            )}
                                        </td>
                                        <td style={tdStyle}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <Clock size={13} style={{ color: 'var(--accent-gold)', opacity: 0.6 }} />
                                                <span style={{ opacity: s.lastSeen ? 1 : 0.4 }}>{s.lastSeen ? s.lastSeen.toDate().toLocaleDateString('en-GB') : 'Never'}</span>
                                            </div>
                                        </td>
                                        <td style={tdStyle}>
                                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--accent-gold)', fontWeight: '800' }}>
                                                <CalendarIcon size={14} opacity={0.5} />
                                                {s.totalDays}
                                            </div>
                                        </td>
                                        <td style={tdStyle}>
                                            <div style={{ 
                                                display: 'inline-flex', padding: '4px 10px', borderRadius: '20px', 
                                                backgroundColor: s.soloDays > 0 ? 'rgba(255, 77, 77, 0.1)' : 'transparent',
                                                color: s.soloDays > 0 ? '#ff4d4d' : 'var(--text-secondary)',
                                                fontSize: '12px', fontWeight: '800', border: s.soloDays > 0 ? '1px solid rgba(255, 77, 77, 0.2)' : '1px solid transparent'
                                            }}>
                                                {s.soloDays}
                                            </div>
                                        </td>
                                        <td style={{ ...tdStyle, textAlign: 'center' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                                <button onClick={() => setSelectedStudentForAnalytics(s)} className="action-circle-btn" style={{ padding: '8px', borderRadius: '10px', border: '1px solid var(--glass-border)', backgroundColor: 'rgba(255,255,255,0.03)', color: 'var(--accent-gold)', cursor: 'pointer', transition: '0.2s' }} title="Deep Analytics">
                                                    <BarChart2 size={16} />
                                                </button>
                                                <button onClick={() => manualCheckIn(s)} style={{ padding: '8px 14px', borderRadius: '10px', border: '1px solid var(--accent-gold)', backgroundColor: 'transparent', color: 'var(--accent-gold)', cursor: 'pointer', fontSize: '11px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px', transition: '0.2s' }} onMouseEnter={(e)=>e.currentTarget.style.backgroundColor='var(--accent-gold)'} onMouseMouseEnter={(e)=>{e.currentTarget.style.backgroundColor='var(--accent-gold)'; e.currentTarget.style.color='var(--bg-primary)';}} onMouseLeave={(e)=>{e.currentTarget.style.backgroundColor='transparent'; e.currentTarget.style.color='var(--accent-gold)';}}>
                                                    <UserCheck size={14} /> Mark Present
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                    {isEndOfGroup && i !== aggregated.length - 1 && <tr style={{ height: '24px' }}><td colSpan="6"></td></tr>}
                                </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                    {aggregated.length === 0 && (
                        <div style={{ padding: '80px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                            <Search size={48} style={{ opacity: 0.1, marginBottom: '15px' }} />
                            <p style={{ fontSize: '16px', fontWeight: '500' }}>No matching students found.</p>
                            <button onClick={() => setSearchTerm('')} style={{ background: 'none', border: 'none', color: 'var(--accent-gold)', textDecoration: 'underline', marginTop: '8px', cursor: 'pointer' }}>Clear search filters</button>
                        </div>
                    )}
                </div>
            </div>
            
            <style>
                {`
                    .table-row-hover:hover {
                        background-color: rgba(255, 255, 255, 0.03) !important;
                    }
                    .custom-scroll::-webkit-scrollbar {
                        width: 4px;
                    }
                    .action-circle-btn:hover {
                        background-color: var(--accent-gold) !important;
                        color: var(--bg-primary) !important;
                        transform: translateY(-2px);
                    }
                `}
            </style>
        </div>
    );
};

export default AdminDataTab;
