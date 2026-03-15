import React, { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import {
    collection, onSnapshot, doc, getDoc, setDoc,
    serverTimestamp, deleteDoc, getDocs, writeBatch, query, where
} from 'firebase/firestore';
import { Html5Qrcode } from 'html5-qrcode';
import { LogOut, LayoutDashboard, Database, Camera, Users, Calendar, Menu, X, ChevronRight, AlertCircle, UserCheck } from 'lucide-react';

import AdminLogin from '../components/admin/AdminLogin';
import AdminOverviewTab from '../components/admin/AdminOverviewTab';
import AdminScannerTab from '../components/admin/AdminScannerTab';
import AdminDataTab from '../components/admin/AdminDataTab';
import AdminDateAnalysisTab from '../components/admin/AdminDateAnalysisTab';
import AdminAnalyticsModal from '../components/admin/AdminAnalyticsModal';
import { TabButton } from '../components/admin/AdminShared';

const Admin = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(
        sessionStorage.getItem('isAdminAuth') === 'true'
    );
    const [toast, setToast] = useState(null);

    const handleLoginSuccess = () => setIsAuthenticated(true);

    const handleLogout = () => {
        sessionStorage.removeItem('isAdminAuth');
        setIsAuthenticated(false);
    };

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    if (!isAuthenticated) {
        return <AdminLogin onLoginSuccess={handleLoginSuccess} />;
    }

    return (
        <DashboardContent
            onLogout={handleLogout}
            showToast={showToast}
            toast={toast}
        />
    );
};

const DashboardContent = ({ onLogout, showToast, toast }) => {
    const [students, setStudents] = useState([]);
    const [attendance, setAttendance] = useState([]);
    const [isScannerActive, setIsScannerActive] = useState(false);
    const [scanner, setScanner] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [selectedStudentForAnalytics, setSelectedStudentForAnalytics] = useState(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        const qStudents = collection(db, "students");
        const unsubStudents = onSnapshot(qStudents, (snap) => {
            setStudents(snap.docs.map(doc => doc.data()));
        });

        const qAttendance = collection(db, "attendance");
        const unsubAttendance = onSnapshot(qAttendance, (snap) => {
            setAttendance(snap.docs.map(doc => doc.data()));
        });

        const handleResize = () => {
            if (window.innerWidth <= 768) {
                setIsSidebarOpen(false);
            } else {
                setIsSidebarOpen(true);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => {
            unsubStudents();
            unsubAttendance();
            window.removeEventListener('resize', handleResize);
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
                showToast(`Already checked in: ${data.name}`, "warning");
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

    const manualCheckIn = async (student) => {
        if (!window.confirm(`Manually check in ${student.name}?`)) return;
        const today = new Date().toISOString().split('T')[0];
        const docId = `${student.phone}_${today}`;
        const docRef = doc(db, "attendance", docId);
        
        try {
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                showToast(`Already checked in: ${student.name}`, "warning");
                return;
            }
            await setDoc(docRef, {
                studentName: student.name,
                phone: student.phone,
                idNo: student.idNo || 'Manual',
                date: today,
                scannedAt: serverTimestamp()
            });
            showToast(`✅ Manually Checked in: ${student.name}`);
        } catch (e) {
            showToast("Error during check in", "error");
        }
    };

    const exportCSV = () => {
        const todayStr = new Date().toISOString().split('T')[0];
        const studentAnalysis = students.map(s => {
            const records = attendance.filter(a => a.phone === s.phone);
            const partnerId = s.partnerPhone;
            let togetherCount = 0;
            let soloCount = 0;
            records.forEach(r => {
                if (partnerId) {
                    const partnerAttended = attendance.some(a => a.phone === partnerId && a.date === r.date);
                    if (partnerAttended) togetherCount++; else soloCount++;
                } else { soloCount++; }
            });
            return {
                name: s.name, phone: s.phone, idNo: s.idNo || 'N/A',
                totalDays: records.length, partneredDays: togetherCount,
                soloDays: soloCount, synergy: records.length > 0 && partnerId ? Math.round((togetherCount / records.length) * 100) : 0
            };
        }).sort((a,b) => b.totalDays - a.totalDays);

        let lines = ["ATTENDANCE ANALYSIS REPORT", `Generated: ${new Date().toLocaleString()}`, "", "--- SUMMARY ---", `Total Students,${students.length}`, `Total Scans,${attendance.length}`, "", "--- PERFORMANCE ---", "Name,Phone,ID No,Total Days,Partnered,Solo,Synergy %"];
        studentAnalysis.forEach(s => lines.push(`${s.name},${s.phone},${s.idNo},${s.totalDays},${s.partneredDays},${s.soloDays},${s.synergy}%`));
        lines.push("", "--- RAW LOG ---", "Name,Phone,Date,Time");
        attendance.sort((a,b) => b.scannedAt - a.scannedAt).forEach(a => lines.push(`${a.studentName},${a.phone},${a.date},${a.scannedAt?.toDate().toLocaleTimeString() || ''}`));

        const blob = new Blob([lines.join("\n")], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = `attendance_analysis_${todayStr}.csv`;
        link.click();
    };


    const handleLinkPartner = async (sPhone, pPhone) => {
        try {
            const batch = writeBatch(db);
            batch.update(doc(db, "students", sPhone), { partnerPhone: pPhone });
            batch.update(doc(db, "students", pPhone), { partnerPhone: sPhone });
            await batch.commit();
            showToast("Partners linked");
        } catch (e) { showToast("Linking failed", "error"); }
    };

    const handleUnlinkPartner = async (sPhone, pPhone) => {
        if (!window.confirm("Unlink partners?")) return;
        try {
            const batch = writeBatch(db);
            batch.update(doc(db, "students", sPhone), { partnerPhone: null });
            batch.update(doc(db, "students", pPhone), { partnerPhone: null });
            await batch.commit();
            showToast("Partners unlinked");
        } catch (e) { showToast("Unlinking failed", "error"); }
    };

    const NavSection = ({ title, children }) => (
        <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {(isSidebarOpen || isMobileMenuOpen) && (
                <div style={{ padding: '0 20px', fontSize: '10px', fontWeight: '800', color: 'var(--text-secondary)', opacity: 0.5, letterSpacing: '1.5px', marginBottom: '8px' }}>
                    {title}
                </div>
            )}
            {children}
        </div>
    );

    const toggleSidebar = () => {
        if (window.innerWidth <= 768) {
            setIsMobileMenuOpen(!isMobileMenuOpen);
        } else {
            setIsSidebarOpen(!isSidebarOpen);
        }
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-primary)', position: 'relative' }}>
            {/* Sidebar Overlay for Mobile */}
            {isMobileMenuOpen && (
                <div 
                    onClick={() => setIsMobileMenuOpen(false)}
                    style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 99, backdropFilter: 'blur(4px)' }}
                ></div>
            )}

            {/* Sidebar */}
            <aside 
                className="glass-effect"
                style={{
                    width: isSidebarOpen ? '280px' : (isMobileMenuOpen ? '280px' : '80px'),
                    transition: 'var(--transition-smooth)',
                    borderRight: '1px solid var(--glass-border)',
                    position: window.innerWidth <= 768 ? 'fixed' : 'sticky',
                    left: window.innerWidth <= 768 && !isMobileMenuOpen ? '-280px' : '0',
                    top: 0, height: '100vh',
                    display: 'flex', flexDirection: 'column', 
                    zIndex: 100, overflow: 'hidden',
                    backgroundColor: window.innerWidth <= 768 ? 'var(--bg-secondary)' : 'transparent'
                }}
            >
                <div style={{ padding: '30px 20px', display: 'flex', alignItems: 'center', gap: '15px', color: 'var(--accent-gold)' }}>
                    <div style={{ minWidth: '40px', display: 'flex', justifyContent: 'center' }}>
                        <Users size={32} />
                    </div>
                    {(isSidebarOpen || isMobileMenuOpen) && <span style={{ fontWeight: '800', fontSize: '20px', letterSpacing: '1px' }}>EJAT ADMIN</span>}
                </div>

                <nav style={{ flex: 1, padding: '0 12px', display: 'flex', flexDirection: 'column' }} className="custom-scroll">
                    <NavSection title="INTELLIGENCE">
                        <TabButton 
                            vertical icon={<LayoutDashboard size={20} />} label={(isSidebarOpen || isMobileMenuOpen) ? "Overview" : ""} 
                            active={activeTab === 'overview'} onClick={() => { setActiveTab('overview'); setIsMobileMenuOpen(false); }} 
                        />
                        <TabButton 
                            vertical icon={<Calendar size={20} />} label={(isSidebarOpen || isMobileMenuOpen) ? "Date Analysis" : ""} 
                            active={activeTab === 'date'} onClick={() => { setActiveTab('date'); setIsMobileMenuOpen(false); }} 
                        />
                    </NavSection>

                    <NavSection title="CONTROL">
                        <TabButton 
                            vertical icon={<Camera size={20} />} label={(isSidebarOpen || isMobileMenuOpen) ? "Live Scanner" : ""} 
                            active={activeTab === 'scanner'} onClick={() => { setActiveTab('scanner'); setIsMobileMenuOpen(false); }} 
                        />
                    </NavSection>

                    <NavSection title="MANAGEMENT">
                        <TabButton 
                            vertical icon={<Database size={20} />} label={(isSidebarOpen || isMobileMenuOpen) ? "Students" : ""} 
                            active={activeTab === 'data'} onClick={() => { setActiveTab('data'); setIsMobileMenuOpen(false); }} 
                        />
                    </NavSection>
                </nav>

                <div style={{ padding: '20px 12px', borderTop: '1px solid var(--glass-border)' }}>
                    <button
                        onClick={onLogout}
                        style={{
                            width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
                            padding: '12px 20px', borderRadius: '12px', border: 'none',
                            backgroundColor: 'rgba(101, 8, 27, 0.2)', color: '#ff4d4d',
                            fontWeight: '600', cursor: 'pointer', transition: 'var(--transition-smooth)'
                        }}
                    >
                        <LogOut size={20} /> {(isSidebarOpen || isMobileMenuOpen) && "Logout"}
                    </button>
                    <button 
                        onClick={toggleSidebar}
                        style={{
                            marginTop: '10px', width: '100%', padding: '8px', borderRadius: '8px',
                            border: '1px solid var(--glass-border)', color: 'var(--text-primary)',
                            backgroundColor: 'transparent', cursor: 'pointer', opacity: 0.5
                        }}
                    >
                        {(isSidebarOpen || isMobileMenuOpen) ? <X size={16} /> : <Menu size={16} />}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
                {/* Header / Global Actions */}
                <header 
                    className="glass-effect"
                    style={{
                        padding: window.innerWidth <= 768 ? '10px 20px' : '15px 40px', 
                        borderBottom: '1px solid var(--glass-border)',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        position: 'sticky', top: 0, zIndex: 90
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <button 
                            className="show-mobile"
                            onClick={() => setIsMobileMenuOpen(true)}
                            style={{ background: 'transparent', border: 'none', color: 'var(--accent-gold)', cursor: 'pointer', padding: '5px' }}
                        >
                            <Menu size={24} />
                        </button>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                            <span className="hide-mobile" style={{ opacity: 0.6 }}>Dashboard</span>
                            <ChevronRight size={14} className="hide-mobile" />
                            <span style={{ color: 'var(--accent-gold)', fontWeight: '600', textTransform: 'capitalize' }}>{activeTab.replace('-', ' ')}</span>
                        </div>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={exportCSV} className="header-action-btn" title="Export Data">
                                <Database size={16} /> <span className="hide-mobile">Export</span>
                            </button>
                        </div>
                        <div style={{ width: '1px', height: '20px', backgroundColor: 'var(--glass-border)' }} className="hide-mobile"></div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '500' }} className="hide-mobile">
                            {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </div>
                    </div>
                </header>

                <div style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
                    {activeTab === 'overview' && <AdminOverviewTab students={students} attendance={attendance} />}
                    {activeTab === 'scanner' && <AdminScannerTab isScannerActive={isScannerActive} startScanner={startScanner} stopScanner={stopScanner} />}
                    {activeTab === 'data' && (
                        <AdminDataTab 
                            students={students} attendance={attendance} 
                            exportCSV={exportCSV} 
                            handleLinkPartner={handleLinkPartner}
                            handleUnlinkPartner={handleUnlinkPartner}
                            setSelectedStudentForAnalytics={setSelectedStudentForAnalytics}
                            manualCheckIn={manualCheckIn}
                        />
                    )}
                    {activeTab === 'date' && <AdminDateAnalysisTab students={students} attendance={attendance} />}
                </div>

                <AdminAnalyticsModal 
                    students={students} attendance={attendance} 
                    selectedStudentForAnalytics={selectedStudentForAnalytics} 
                    setSelectedStudentForAnalytics={setSelectedStudentForAnalytics} 
                />

                {toast && (
                    <div 
                        className="animate-slide-up"
                        style={{
                            position: 'fixed', bottom: '30px', right: '30px', padding: '16px 24px',
                            borderRadius: '12px', zIndex: 2000, 
                            backgroundColor: toast.type === 'error' ? '#ff4d4d' : 'var(--accent-gold)',
                            color: 'var(--bg-primary)', fontWeight: '700',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                            display: 'flex', alignItems: 'center', gap: '10px'
                        }}
                    >
                        {toast.type === 'error' ? <AlertCircle size={20} /> : <UserCheck size={20} />}
                        {toast.msg}
                    </div>
                )}
            </main>
        </div>
    );
};

export default Admin;
