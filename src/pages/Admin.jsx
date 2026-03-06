import React, { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import {
    collection, query, where, onSnapshot, doc, getDoc, setDoc,
    serverTimestamp, deleteDoc, getDocs, writeBatch
} from 'firebase/firestore';
import { Html5Qrcode } from 'html5-qrcode';
import { Lock, Users, UserCheck, QrCode, LogOut, Trash2, Download, Search, AlertCircle } from 'lucide-react';

const Admin = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(
        sessionStorage.getItem('isAdminAuth') === 'true'
    );
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [attempts, setAttempts] = useState(0);
    const [isLocked, setIsLocked] = useState(false);
    const [countdown, setCountdown] = useState(0);

    // Dashboard States
    const [students, setStudents] = useState([]);
    const [attendance, setAttendance] = useState([]);
    const [scannedData, setScannedData] = useState(null);
    const [isScannerActive, setIsScannerActive] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [toast, setToast] = useState(null);

    const HARDCODED_PASS = "maramawitdereje93@gmail.com";

    // Auth Effect
    useEffect(() => {
        let timer;
        if (countdown > 0) {
            timer = setInterval(() => setCountdown(c => c - 1), 1000);
        } else {
            setIsLocked(false);
        }
        return () => clearInterval(timer);
    }, [countdown]);

    const handleLogin = (e) => {
        e.preventDefault();
        if (isLocked) return;

        if (password === HARDCODED_PASS) {
            setIsAuthenticated(true);
            sessionStorage.setItem('isAdminAuth', 'true');
        } else {
            const newAttempts = attempts + 1;
            setAttempts(newAttempts);
            setError('Incorrect password. Try again.');

            const card = document.getElementById('lock-card');
            card?.classList.add('shake');
            setTimeout(() => card?.classList.remove('shake'), 500);

            if (newAttempts >= 3) {
                setIsLocked(true);
                setCountdown(30);
                setError('Too many attempts. Locked for 30s.');
            }
        }
    };

    const handleLogout = () => {
        sessionStorage.removeItem('isAdminAuth');
        setIsAuthenticated(false);
    };

    // Toast Helper
    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    if (!isAuthenticated) {
        return (
            <div style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: '#65081b', display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 1000
            }}>
                <style>
                    {`
            .shake { animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both; }
            @keyframes shake {
              10%, 90% { transform: translate3d(-1px, 0, 0); }
              20%, 80% { transform: translate3d(2px, 0, 0); }
              30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
              40%, 60% { transform: translate3d(4px, 0, 0); }
            }
          `}
                </style>
                <div id="lock-card" style={{
                    backgroundColor: '#2a0f18', padding: '40px', borderRadius: '16px',
                    width: '100%', maxWidth: '400px', textAlign: 'center',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.5)', border: '1px solid #d3a200'
                }}>
                    <Lock size={60} color="#d3a200" style={{ marginBottom: '20px' }} />
                    <h2 style={{ color: '#d3a200', marginBottom: '10px' }}>Admin Login</h2>
                    <p style={{ color: '#f5e6c8', opacity: 0.7, marginBottom: '20px' }}>Access restricted to administrators.</p>

                    <form onSubmit={handleLogin}>
                        <input
                            type="password"
                            placeholder="Enter Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={isLocked}
                            style={{
                                width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #65081b',
                                backgroundColor: '#1a0a0f', color: '#f5e6c8', marginBottom: '15px', outline: 'none'
                            }}
                        />
                        <button
                            type="submit"
                            disabled={isLocked}
                            style={{
                                width: '100%', padding: '12px', borderRadius: '8px', border: 'none',
                                backgroundColor: '#d3a200', color: '#1a0a0f', fontWeight: '700', cursor: isLocked ? 'not-allowed' : 'pointer'
                            }}
                        >
                            {isLocked ? `Locked (${countdown}s)` : 'Unlock Dashboard'}
                        </button>
                    </form>
                    {error && <p style={{ color: '#ff4d4d', marginTop: '15px', fontSize: '14px' }}>{error}</p>}
                </div>
            </div>
        );
    }

    return (
        <DashboardContent
            onLogout={handleLogout}
            showToast={showToast}
            toast={toast}
        />
    );
};

// Sub-component for Dashboard Core
const DashboardContent = ({ onLogout, showToast, toast }) => {
    const [students, setStudents] = useState([]);
    const [attendance, setAttendance] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isScannerActive, setIsScannerActive] = useState(false);
    const [scanner, setScanner] = useState(null);

    useEffect(() => {
        // Real-time Students
        const qStudents = collection(db, "students");
        const unsubStudents = onSnapshot(qStudents, (snap) => {
            setStudents(snap.docs.map(doc => doc.data()));
        });

        // Real-time Attendance
        const qAttendance = collection(db, "attendance");
        const unsubAttendance = onSnapshot(qAttendance, (snap) => {
            setAttendance(snap.docs.map(doc => doc.data()));
        });

        return () => {
            unsubStudents();
            unsubAttendance();
        };
    }, []);

    const startScanner = async () => {
        const html5QrCode = new Html5Qrcode("reader");
        setScanner(html5QrCode);
        setIsScannerActive(true);

        try {
            await html5QrCode.start(
                { facingMode: "environment" },
                { fps: 10, qrbox: { width: 250, height: 250 } },
                onScanSuccess
            );
        } catch (err) {
            console.error(err);
            showToast("Camera access failed", "error");
            setIsScannerActive(false);
        }
    };

    const stopScanner = async () => {
        if (scanner) {
            await scanner.stop();
            setIsScannerActive(false);
        }
    };

    const onScanSuccess = async (decodedText) => {
        try {
            const data = JSON.parse(decodedText);
            const today = new Date().toISOString().split('T')[0];
            const docId = `${data.phone}_${today}`;

            const docRef = doc(db, "attendance", docId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                showToast(`Already checked in today: ${data.name}`, "warning");
                return;
            }

            await setDoc(docRef, {
                studentName: data.name,
                phone: data.phone,
                idNo: data.idNo,
                date: today,
                scannedAt: serverTimestamp()
            });

            showToast(`✅ Checked in: ${data.name}`);
        } catch (e) {
            showToast("Invalid QR format", "error");
        }
    };

    const exportCSV = () => {
        const headers = ["Name", "Phone", "ID No", "Date", "Scanned At"];
        const rows = attendance.map(a => [
            a.studentName,
            a.phone,
            a.idNo,
            a.date,
            a.scannedAt?.toDate().toLocaleString() || ''
        ]);

        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `attendance_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    const clearToday = async () => {
        if (!window.confirm("Clear all attendance records for TODAY?")) return;
        const today = new Date().toISOString().split('T')[0];
        const q = query(collection(db, "attendance"), where("date", "==", today));
        const snap = await getDocs(q);
        const batch = writeBatch(db);
        snap.forEach(d => batch.delete(d.ref));
        await batch.commit();
        showToast("Cleared today's records");
    };

    const todayStr = new Date().toISOString().split('T')[0];
    const presentToday = attendance.filter(a => a.date === todayStr).length;

    // Filtered Table Data (Aggregated by student)
    const aggregated = students.map(s => {
        const records = attendance.filter(a => a.phone === s.phone);
        return {
            ...s,
            totalDays: records.length,
            lastSeen: records.sort((a, b) => b.scannedAt - a.scannedAt)[0]?.scannedAt
        };
    }).filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.phone.includes(searchTerm)
    );

    return (
        <div style={{ padding: '0 0 40px 0' }}>
            {/* Toast */}
            {toast && (
                <div style={{
                    position: 'fixed', top: '20px', right: '20px', padding: '15px 25px',
                    borderRadius: '8px', zIndex: 2000, color: '#1a0a0f', fontWeight: '700',
                    backgroundColor: toast.type === 'error' ? '#ff4d4d' : toast.type === 'warning' ? '#d3a200' : '#d3a200',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                    animation: 'slideIn 0.3s ease-out'
                }}>
                    {toast.msg}
                </div>
            )}

            {/* Header */}
            <div style={{
                backgroundColor: '#65081b', padding: '15px 30px', display: 'flex',
                justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
            }}>
                <h2 style={{ color: '#d3a200', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Users size={24} /> Attendance Dashboard
                </h2>
                <button
                    onClick={onLogout}
                    style={{
                        backgroundColor: 'transparent', color: '#f5e6c8', border: '1px solid #d3a200',
                        padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px'
                    }}
                >
                    <LogOut size={16} /> Logout
                </button>
            </div>

            <div style={{ maxWidth: '1200px', margin: '30px auto', padding: '0 20px' }}>
                {/* Stats Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                    <StatCard icon={<Users color="#d3a200" />} label="Total Students" value={students.length} />
                    <StatCard icon={<UserCheck color="#d3a200" />} label="Present Today" value={presentToday} />
                    <StatCard icon={<QrCode color="#d3a200" />} label="Total Scans" value={attendance.length} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '30px' }}>
                    {/* Left: Scanner */}
                    <div style={{ backgroundColor: '#2a0f18', padding: '25px', borderRadius: '16px', border: '1px solid #65081b' }}>
                        <h3 style={{ color: '#d3a200', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <QrCode size={20} /> Live Scanner
                        </h3>
                        <div id="reader" style={{ width: '100%', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#000' }}></div>
                        <button
                            onClick={isScannerActive ? stopScanner : startScanner}
                            style={{
                                width: '100%', marginTop: '20px', padding: '12px', borderRadius: '8px', border: 'none',
                                backgroundColor: isScannerActive ? '#65081b' : '#d3a200',
                                color: isScannerActive ? '#fff' : '#1a0a0f',
                                fontWeight: '700', cursor: 'pointer'
                            }}
                        >
                            {isScannerActive ? 'Stop Scanner' : 'Start QR Scanner'}
                        </button>
                    </div>

                    {/* Right: Table */}
                    <div style={{ backgroundColor: '#2a0f18', padding: '25px', borderRadius: '16px', border: '1px solid #65081b' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ color: '#d3a200' }}>Attendance Records</h3>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button onClick={exportCSV} style={actionBtnStyle}><Download size={16} /> Export</button>
                                <button onClick={clearToday} style={{ ...actionBtnStyle, color: '#ff4d4d' }}><Trash2 size={16} /> Clear Today</button>
                            </div>
                        </div>

                        {/* Search */}
                        <div style={{ position: 'relative', marginBottom: '20px' }}>
                            <Search size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: '#65081b' }} />
                            <input
                                type="text"
                                placeholder="Search by name or phone..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{
                                    width: '100%', padding: '12px 12px 12px 40px', borderRadius: '8px', border: '1px solid #65081b',
                                    backgroundColor: '#1a0a0f', color: '#f5e6c8', outline: 'none'
                                }}
                            />
                        </div>

                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ color: '#d3a200', borderBottom: '2px solid #65081b' }}>
                                        <th style={thStyle}>Student</th>
                                        <th style={thStyle}>Last Scene</th>
                                        <th style={thStyle}>Days</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {aggregated.map((s, i) => (
                                        <tr key={i} style={{ borderBottom: '1px solid rgba(101, 8, 27, 0.5)' }}>
                                            <td style={tdStyle}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <div style={{
                                                        width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#65081b',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d3a200', fontSize: '12px', fontWeight: 'bold'
                                                    }}>
                                                        {s.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: '600' }}>{s.name}</div>
                                                        <div style={{ fontSize: '11px', opacity: 0.6 }}>{s.phone}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={tdStyle}>{s.lastSeen ? s.lastSeen.toDate().toLocaleDateString() : 'Never'}</td>
                                            <td style={tdStyle}>
                                                <span style={{ backgroundColor: '#65081b', padding: '2px 8px', borderRadius: '10px', fontSize: '12px', color: '#d3a200' }}>
                                                    {s.totalDays}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ icon, label, value }) => (
    <div style={{
        backgroundColor: '#2a0f18', padding: '20px', borderRadius: '16px', border: '1px solid #65081b',
        display: 'flex', alignItems: 'center', gap: '15px'
    }}>
        <div style={{ backgroundColor: 'rgba(211, 162, 0, 0.1)', padding: '12px', borderRadius: '12px' }}>
            {icon}
        </div>
        <div>
            <div style={{ fontSize: '13px', opacity: 0.7, marginBottom: '5px' }}>{label}</div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#f5e6c8' }}>{value}</div>
        </div>
    </div>
);

const actionBtnStyle = {
    backgroundColor: '#1a0a0f', color: '#d3a200', border: '1px solid #65081b',
    padding: '6px 12px', borderRadius: '6px', fontSize: '13px', cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: '5px'
};

const thStyle = { padding: '12px', fontSize: '13px', fontWeight: '700' };
const tdStyle = { padding: '12px', fontSize: '14px' };

export default Admin;
