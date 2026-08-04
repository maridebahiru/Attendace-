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
import AdminUserManagementTab from '../components/admin/AdminUserManagementTab';
import AdminAnalyticsModal from '../components/admin/AdminAnalyticsModal';
import AdminScannedIDModal from '../components/admin/AdminScannedIDModal';
import { TabButton } from '../components/admin/AdminShared';
import { getStudentByQrToken, getStudentByIdentifier } from '../utils/studentUtils';
import { exportToCSV } from '../utils/exportUtils';
import { checkPermission, logSuperAdminAudit, getUserRole } from '../utils/rbac';

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
    const [lastScannedResult, setLastScannedResult] = useState(null);
    const [scannedModalData, setScannedModalData] = useState(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const getAdminIdentity = () => {
        const stored = sessionStorage.getItem('adminUser');
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                return parsed.name || parsed.username || 'Admin Console';
            } catch (e) {}
        }
        return 'Admin Console';
    };

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
            const textStr = String(decodedText).trim();
            if (!textStr) return;

            let targetStudent = null;

            // 1. Check direct identifier lookup (Employee ID e.g. EJAT-0001, Phone number, or Doc ID)
            targetStudent = await getStudentByIdentifier(textStr);

            // 2. Check QR Token (e.g. QR_xxxx)
            if (!targetStudent) {
                targetStudent = await getStudentByQrToken(textStr);
            }

            // 3. Check JSON payload string
            if (!targetStudent) {
                try {
                    const data = JSON.parse(textStr);
                    const identifier = data.phone || data.idNo || data.employeeId;
                    if (identifier) {
                        targetStudent = await getStudentByIdentifier(identifier);
                    }
                    if (!targetStudent && (data.name || data.phone)) {
                        targetStudent = {
                            name: data.name || 'Attendee',
                            phone: data.phone || data.idNo || 'N/A',
                            employeeId: data.idNo || data.employeeId || 'N/A',
                            department: 'General'
                        };
                    }
                } catch (e) {
                    // Ignore JSON parse error
                }
            }

            if (!targetStudent || !targetStudent.phone) {
                showToast("Unrecognized QR Code token", "error");
                return;
            }

            const today = new Date().toISOString().split('T')[0];
            const docId = `${targetStudent.phone}_${today}`;
            const docRef = doc(db, "attendance", docId);
            const docSnap = await getDoc(docRef);

            const adminIdentity = getAdminIdentity();
            const deviceInfoStr = typeof navigator !== 'undefined' ? navigator.userAgent : 'Desktop Browser';

            if (docSnap.exists()) {
                showToast(`Already checked in: ${targetStudent.name}`, "warning");
                const res = { student: targetStudent, status: 'already_checked_in', scannedAt: new Date() };
                setLastScannedResult(res);
                setScannedModalData(res);
                return;
            }

            await setDoc(docRef, {
                studentName: targetStudent.name,
                phone: targetStudent.phone,
                employeeId: targetStudent.employeeId || targetStudent.idNo || targetStudent.phone,
                idNo: targetStudent.employeeId || targetStudent.idNo || targetStudent.phone,
                department: targetStudent.department || 'General',
                date: today,
                scannedAt: serverTimestamp(),
                scannedBy: adminIdentity,
                deviceInfo: deviceInfoStr
            });

            showToast(`✅ Checked in: ${targetStudent.name}`);
            const res = { student: targetStudent, status: 'success', scannedAt: new Date() };
            setLastScannedResult(res);
            setScannedModalData(res);
        } catch (e) {
            console.error("Scan error:", e);
            showToast("Scan processing error", "error");
        }
    };

    const manualCheckIn = async (student, customDate = null) => {
        const perm = checkPermission('manual_checkin');
        if (!perm.allowed) {
            showToast(perm.reason, "error");
            return;
        }

        const dateToMark = customDate || new Date().toISOString().split('T')[0];
        if (!window.confirm(`Manually check in ${student.name} for ${dateToMark}?`)) return;
        const docId = `${student.phone}_${dateToMark}`;
        const docRef = doc(db, "attendance", docId);

        const adminIdentity = getAdminIdentity();
        const deviceInfoStr = typeof navigator !== 'undefined' ? navigator.userAgent : 'Desktop Browser';

        try {
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                showToast(`Already checked in: ${student.name} on ${dateToMark}`, "warning");
                return;
            }
            await setDoc(docRef, {
                employeeId: student.employeeId || student.idNo || student.phone,
                idNo: student.employeeId || student.idNo || student.phone,
                department: student.department || 'General',
                date: dateToMark,
                scannedAt: serverTimestamp(),
                scannedBy: adminIdentity,
                deviceInfo: deviceInfoStr
            });
            showToast(`✅ Manually Checked in: ${student.name}`);
        } catch (e) {
            showToast("Error during check in", "error");
        }
    };

    const exportCSV = () => {
        exportToCSV({ students, attendance });
    };

    const handleAddStudent = async (studentData) => {
        const perm = checkPermission('create_user');
        if (!perm.allowed) {
            showToast(perm.reason, "error");
            return false;
        }
        try {
            const docRef = doc(db, "students", studentData.phone);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                showToast("Student with this phone already exists", "error");
                return false;
            }
            await setDoc(docRef, {
                ...studentData,
                createdAt: serverTimestamp()
            });
            showToast("Student added successfully");
            return true;
        } catch (e) {
            showToast("Error adding student", "error");
            return false;
        }
    };

    const handleUpdateStudent = async (phone, updatedData) => {
        const perm = checkPermission('edit_user');
        if (!perm.allowed) {
            showToast(perm.reason, "error");
            return false;
        }
        try {
            await setDoc(doc(db, "students", phone), updatedData, { merge: true });
            showToast("Student updated successfully");
            return true;
        } catch (e) {
            showToast("Error updating student", "error");
            return false;
        }
    };

    const handleDeleteStudent = async (phone) => {
        const perm = checkPermission('delete_user');
        if (!perm.allowed) {
            showToast(perm.reason, "error");
            return false;
        }
        if (!window.confirm("Are you sure you want to delete this student? Attendance records will remain.")) return;
        try {
            await deleteDoc(doc(db, "students", phone));
            showToast("Student deleted successfully");
            return true;
        } catch (e) {
            showToast("Error deleting student", "error");
            return false;
        }
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
                        <TabButton 
                            vertical icon={<Users size={20} />} label={(isSidebarOpen || isMobileMenuOpen) ? "Users" : ""} 
                            active={activeTab === 'users'} onClick={() => { setActiveTab('users'); setIsMobileMenuOpen(false); }} 
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
                    {activeTab === 'scanner' && (
                        <AdminScannerTab 
                            isScannerActive={isScannerActive} 
                            startScanner={startScanner} 
                            stopScanner={stopScanner} 
                            lastScannedResult={lastScannedResult} 
                            onOpenModal={(res) => setScannedModalData(res)} 
                        />
                    )}
                    {activeTab === 'data' && (
                        <AdminDataTab 
                            students={students} attendance={attendance} 
                            setSelectedStudentForAnalytics={setSelectedStudentForAnalytics}
                            manualCheckIn={manualCheckIn}
                        />
                    )}
                    {activeTab === 'users' && (
                        <AdminUserManagementTab 
                            students={students} 
                            onAdd={handleAddStudent}
                            onUpdate={handleUpdateStudent}
                            onDelete={handleDeleteStudent}
                        />
                    )}
                    {activeTab === 'date' && <AdminDateAnalysisTab students={students} attendance={attendance} />}
                </div>

                <AdminAnalyticsModal 
                    students={students} attendance={attendance} 
                    selectedStudentForAnalytics={selectedStudentForAnalytics} 
                    setSelectedStudentForAnalytics={setSelectedStudentForAnalytics} 
                />

                <AdminScannedIDModal 
                    scanResult={scannedModalData} 
                    onClose={() => setScannedModalData(null)} 
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
