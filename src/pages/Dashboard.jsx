import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase/config';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import QRCard from '../components/QRCard';
import html2canvas from 'html2canvas';
import logo from '../assets/logo.png';
import { User, Phone, Mail, Building, Briefcase, Download, LogOut, CheckCircle, Calendar, Shield, IdCard } from 'lucide-react';

const Dashboard = () => {
    const navigate = useNavigate();
    const cardRef = useRef(null);
    const [student, setStudent] = useState(null);
    const [myAttendance, setMyAttendance] = useState([]);
    const [downloading, setDownloading] = useState(false);

    useEffect(() => {
        const stored = sessionStorage.getItem('currentStudent');
        if (!stored) {
            navigate('/');
            return;
        }

        try {
            const parsed = JSON.parse(stored);
            setStudent(parsed);

            // Real-time listener for student's attendance records
            if (parsed.phone) {
                const q = query(collection(db, "attendance"), where("phone", "==", parsed.phone));
                const unsub = onSnapshot(q, (snapshot) => {
                    const records = snapshot.docs.map(doc => doc.data());
                    records.sort((a, b) => (b.scannedAt?.seconds || 0) - (a.scannedAt?.seconds || 0));
                    setMyAttendance(records);
                });
                return () => unsub();
            }
        } catch (e) {
            navigate('/');
        }
    }, [navigate]);

    const handleLogout = () => {
        sessionStorage.removeItem('currentStudent');
        navigate('/');
    };

    const downloadCard = async () => {
        if (!cardRef.current) return;
        setDownloading(true);
        try {
            const canvas = await html2canvas(cardRef.current, {
                scale: 2,
                useCORS: true,
                backgroundColor: null
            });
            const link = document.createElement('a');
            link.download = `ID_${student.employeeId || student.phone}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (err) {
            console.error('Failed to download card:', err);
        } finally {
            setDownloading(false);
        }
    };

    if (!student) return null;

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#1a0a0f', color: '#f5e6c8', paddingBottom: '60px' }}>
            {/* Header */}
            <header style={{
                backgroundColor: '#2a0f18',
                borderBottom: '1px solid rgba(211, 162, 0, 0.2)',
                padding: '16px 30px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                position: 'sticky',
                top: 0,
                zIndex: 100
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <img src={logo} alt="Logo" style={{ height: '45px', objectFit: 'contain' }} />
                    <div>
                        <h1 style={{ color: '#d3a200', fontSize: '1.1rem', margin: 0, fontWeight: '800' }}>
                            የኢትዮጵያዊው ጃንደረባ ትውልድ
                        </h1>
                        <span style={{ fontSize: '12px', opacity: 0.7 }}>Student Dashboard</span>
                    </div>
                </div>

                <button
                    onClick={handleLogout}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 16px',
                        borderRadius: '8px',
                        backgroundColor: 'rgba(255, 77, 77, 0.15)',
                        border: '1px solid #ff4d4d',
                        color: '#ff4d4d',
                        fontWeight: '700',
                        cursor: 'pointer'
                    }}
                >
                    <LogOut size={16} /> Logout
                </button>
            </header>

            <main style={{ maxWidth: '1100px', margin: '40px auto 0', padding: '0 20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '40px' }}>
                    {/* Left Column: Student Details & Attendance */}
                    <div>
                        {/* Profile Summary Card */}
                        <div style={{
                            backgroundColor: '#2a0f18',
                            borderRadius: '16px',
                            padding: '30px',
                            border: '1px solid rgba(211, 162, 0, 0.15)',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
                            marginBottom: '30px'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
                                {student.profilePhotoUrl ? (
                                    <img
                                        src={student.profilePhotoUrl}
                                        alt={student.name}
                                        style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #d3a200' }}
                                        onError={(e) => { e.target.style.display = 'none'; }}
                                    />
                                ) : (
                                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'rgba(211,162,0,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d3a200', border: '3px solid #d3a200' }}>
                                        <User size={40} />
                                    </div>
                                )}

                                <div>
                                    <h2 style={{ color: '#d3a200', margin: 0, fontSize: '1.5rem', fontWeight: '800' }}>{student.name}</h2>
                                    {(student.employeeId || student.idNo) && (
                                        <div style={{ color: '#f5e6c8', opacity: 0.8, fontSize: '13px', marginTop: '4px' }}>
                                            ID: <strong>{student.employeeId || student.idNo}</strong>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Details Grid */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.1)', fontSize: '14px' }}>
                                <div>
                                    <div style={{ opacity: 0.5, fontSize: '11px', textTransform: 'uppercase', marginBottom: '3px' }}>Phone</div>
                                    <div style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Phone size={14} color="#d3a200" /> {student.phone}
                                    </div>
                                </div>

                                {student.department && (
                                    <div>
                                        <div style={{ opacity: 0.5, fontSize: '11px', textTransform: 'uppercase', marginBottom: '3px' }}>Department</div>
                                        <div style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <Building size={14} color="#d3a200" /> {student.department}
                                        </div>
                                    </div>
                                )}

                                {student.position && (
                                    <div>
                                        <div style={{ opacity: 0.5, fontSize: '11px', textTransform: 'uppercase', marginBottom: '3px' }}>Position</div>
                                        <div style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <Briefcase size={14} color="#d3a200" /> {student.position}
                                        </div>
                                    </div>
                                )}

                                {student.email && (
                                    <div>
                                        <div style={{ opacity: 0.5, fontSize: '11px', textTransform: 'uppercase', marginBottom: '3px' }}>Email</div>
                                        <div style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            <Mail size={14} color="#d3a200" /> {student.email}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Attendance Logs */}
                        <div style={{
                            backgroundColor: '#2a0f18',
                            borderRadius: '16px',
                            padding: '30px',
                            border: '1px solid rgba(211, 162, 0, 0.15)',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.4)'
                        }}>
                            <h3 style={{ color: '#d3a200', margin: '0 0 20px 0', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Calendar size={20} /> Attendance History ({myAttendance.length} Sessions)
                            </h3>

                            {myAttendance.length === 0 ? (
                                <div style={{ opacity: 0.6, fontSize: '14px', textAlign: 'center', padding: '20px' }}>
                                    No attendance scans recorded yet.
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '300px', overflowY: 'auto' }}>
                                    {myAttendance.map((rec, i) => (
                                        <div key={i} style={{
                                            padding: '12px 16px',
                                            borderRadius: '8px',
                                            backgroundColor: '#1a0a0f',
                                            border: '1px solid rgba(211, 162, 0, 0.1)',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            fontSize: '14px'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <CheckCircle size={18} color="#00ff00" />
                                                <span style={{ fontWeight: '700' }}>{rec.date}</span>
                                            </div>
                                            <span style={{ opacity: 0.7, fontSize: '12px' }}>
                                                {rec.scannedAt?.toDate ? rec.scannedAt.toDate().toLocaleTimeString() : ''}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: QR Card Display */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                            <h3 style={{ color: '#d3a200', margin: '0 0 6px 0', fontSize: '1.2rem' }}>Permanent Digital ID</h3>
                            <p style={{ opacity: 0.7, fontSize: '13px', margin: 0 }}>Show this QR Code at the entrance for instant check-in</p>
                        </div>

                        {/* Interactive Card Canvas */}
                        <QRCard ref={cardRef} studentData={student} logo={logo} />

                        <button
                            onClick={downloadCard}
                            disabled={downloading}
                            style={{
                                marginTop: '24px',
                                padding: '14px 28px',
                                backgroundColor: '#d3a200',
                                color: '#1a0a0f',
                                border: 'none',
                                borderRadius: '10px',
                                fontWeight: '800',
                                fontSize: '15px',
                                cursor: downloading ? 'wait' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                boxShadow: '0 6px 20px rgba(211, 162, 0, 0.3)',
                                opacity: downloading ? 0.7 : 1
                            }}
                        >
                            <Download size={18} /> {downloading ? 'Generating PNG...' : 'Download ID Card'}
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
