import React from 'react';
import { QrCode, Camera, Shield, AlertCircle, CameraOff, CheckCircle2, User, Building, Briefcase, Mail, Phone, IdCard } from 'lucide-react';

const AdminScannerTab = ({ isScannerActive, startScanner, stopScanner, lastScannedResult, onOpenModal }) => (
    <div className="animate-fade-in" style={{ maxWidth: '750px', margin: '0 auto' }}>
        <div className="glass-effect" style={{ padding: window.innerWidth <= 768 ? '20px' : '36px', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
            <div style={{
                width: window.innerWidth <= 768 ? '48px' : '64px', height: window.innerWidth <= 768 ? '48px' : '64px', borderRadius: '12px', backgroundColor: 'rgba(211, 162, 0, 0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
                color: 'var(--accent-gold)'
            }}>
                <QrCode size={window.innerWidth <= 768 ? 24 : 32} />
            </div>

            <h2 style={{ color: 'var(--accent-gold)', fontSize: window.innerWidth <= 768 ? '20px' : '24px', marginBottom: '8px' }}>Live Check-in Console</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px', maxWidth: '450px', margin: '0 auto 24px' }}>
                Scan personal QR code tokens to record attendance instantly.
            </p>

            <div
                style={{
                    width: '100%', borderRadius: '20px', overflow: 'hidden', backgroundColor: '#000',
                    aspectRatio: '1/1', border: isScannerActive ? '2px solid var(--accent-gold)' : '2px solid var(--glass-border)',
                    boxShadow: isScannerActive ? '0 0 30px rgba(211, 162, 0, 0.2)' : 'var(--shadow-lg)',
                    position: 'relative', transition: 'var(--transition-smooth)'
                }}
            >
                <div id="reader" style={{ width: '100%', height: '100%' }}></div>

                {!isScannerActive && (
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(15, 5, 8, 0.8)', backdropFilter: 'blur(8px)' }}>
                        <CameraOff size={40} style={{ color: 'var(--accent-gold)', opacity: 0.2, marginBottom: '15px' }} />
                        <div style={{ color: 'var(--text-primary)', opacity: 0.4, fontSize: '13px', fontWeight: '500' }}>Camera is offline</div>
                    </div>
                )}

                {isScannerActive && (
                    <div style={{ position: 'absolute', top: '15px', right: '15px', backgroundColor: 'rgba(0,0,0,0.6)', padding: '5px 12px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '8px', zIndex: 10 }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#00ff00', boxShadow: '0 0 10px #00ff00' }}></div>
                        <span style={{ fontSize: '10px', fontWeight: '800', color: '#fff' }}>LIVE SCANNER ACTIVE</span>
                    </div>
                )}
            </div>

            <button
                onClick={isScannerActive ? stopScanner : startScanner}
                style={{
                    width: '100%', marginTop: '24px', padding: '16px', borderRadius: '16px',
                    backgroundColor: isScannerActive ? 'rgba(255, 77, 77, 0.1)' : 'var(--accent-gold)',
                    color: isScannerActive ? '#ff4d4d' : 'var(--bg-primary)',
                    fontWeight: '800', cursor: 'pointer', fontSize: '16px',
                    transition: 'var(--transition-smooth)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                    border: isScannerActive ? '1px solid #ff4d4d' : 'none',
                    boxShadow: !isScannerActive ? '0 8px 25px rgba(211, 162, 0, 0.4)' : 'none'
                }}
            >
                {isScannerActive ? (
                    <><Shield size={20} /> Deactivate Control</>
                ) : (
                    <><Camera size={20} /> Initialize Scanner</>
                )}
            </button>

            {/* Scan Result Overlay Panel */}
            {lastScannedResult && lastScannedResult.student && (
                <div 
                    onClick={() => onOpenModal && onOpenModal(lastScannedResult)}
                    style={{
                        marginTop: '24px',
                        padding: '24px',
                        borderRadius: '16px',
                        backgroundColor: lastScannedResult.status === 'already_checked_in' ? 'rgba(211, 162, 0, 0.1)' : 'rgba(0, 255, 128, 0.1)',
                        border: `1px solid ${lastScannedResult.status === 'already_checked_in' ? '#d3a200' : '#00ff80'}`,
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'transform 0.2s ease'
                    }}
                    title="Click to view full Student ID Card Popup"
                >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <span style={{
                            fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px',
                            color: lastScannedResult.status === 'already_checked_in' ? '#d3a200' : '#00ff80',
                            display: 'flex', alignItems: 'center', gap: '6px'
                        }}>
                            {lastScannedResult.status === 'already_checked_in' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
                            {lastScannedResult.status === 'already_checked_in' ? 'Already Checked In Today' : 'Check-In Successful'}
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--accent-gold)', fontWeight: '700' }}>View Full ID Card ↗</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        {lastScannedResult.student.profilePhotoUrl ? (
                            <img
                                src={lastScannedResult.student.profilePhotoUrl}
                                alt={lastScannedResult.student.name}
                                style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--accent-gold)' }}
                                onError={(e) => { e.target.style.display = 'none'; }}
                            />
                        ) : (
                            <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'rgba(211,162,0,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-gold)' }}>
                                <User size={32} />
                            </div>
                        )}

                        <div style={{ flex: 1 }}>
                            <h3 style={{ color: 'var(--text-primary)', margin: 0, fontSize: '18px', fontWeight: '800' }}>{lastScannedResult.student.name}</h3>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                                <span><IdCard size={14} style={{ display: 'inline', marginRight: '4px', color: 'var(--accent-gold)' }} /> ID: <strong style={{ color: 'var(--accent-gold)' }}>{lastScannedResult.student.employeeId || lastScannedResult.student.idNo || lastScannedResult.student.phone}</strong></span>
                                {lastScannedResult.student.phone && (
                                    <span><Phone size={14} style={{ display: 'inline', marginRight: '4px' }} /> {lastScannedResult.student.phone}</span>
                                )}
                                {(lastScannedResult.student.christianName || lastScannedResult.student.christian_name) && (
                                    <span>የክርስትና ስም: <strong>{lastScannedResult.student.christianName || lastScannedResult.student.christian_name}</strong></span>
                                )}
                                {(lastScannedResult.student.department || lastScannedResult.student.church) && (
                                    <span><Building size={14} style={{ display: 'inline', marginRight: '4px' }} /> {lastScannedResult.student.department || lastScannedResult.student.church}</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'center', gap: '24px', opacity: 0.5 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px' }}>
                    <Shield size={12} /> Encrypted Token Verification
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px' }}>
                    <AlertCircle size={12} /> Live Device & Admin Trace
                </div>
            </div>
        </div>
    </div>
);

export default AdminScannerTab;
