import React from 'react';
import { QrCode, Camera, Shield, AlertCircle, CameraOff } from 'lucide-react';

const AdminScannerTab = ({ isScannerActive, startScanner, stopScanner }) => (
    <div className="animate-fade-in" style={{ maxWidth: '700px', margin: '0 auto' }}>
        <div className="glass-effect" style={{ padding: window.innerWidth <= 768 ? '20px' : '40px', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
            <div style={{ 
                width: window.innerWidth <= 768 ? '48px' : '64px', height: window.innerWidth <= 768 ? '48px' : '64px', borderRadius: '12px', backgroundColor: 'rgba(211, 162, 0, 0.1)', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
                color: 'var(--accent-gold)'
            }}>
                <QrCode size={window.innerWidth <= 768 ? 24 : 32} />
            </div>
            
            <h2 style={{ color: 'var(--accent-gold)', fontSize: window.innerWidth <= 768 ? '20px' : '24px', marginBottom: '8px' }}>Check-in Console</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px', maxWidth: '400px', margin: '0 auto 24px' }}>
                Securely check in attendees using their personal entry codes.
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
                        <span style={{ fontSize: '10px', fontWeight: '800', color: '#fff' }}>LIVE</span>
                    </div>
                )}
            </div>

            <button
                onClick={isScannerActive ? stopScanner : startScanner}
                style={{
                    width: '100%', marginTop: '24px', padding: '16px', borderRadius: '16px', border: 'none',
                    backgroundColor: isScannerActive ? 'rgba(255, 77, 77, 0.1)' : 'var(--accent-gold)',
                    color: isScannerActive ? '#ff4d4d' : 'var(--bg-primary)',
                    fontWeight: '800', cursor: 'pointer', fontSize: '16px',
                    transition: 'var(--transition-smooth)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                    border: isScannerActive ? '1px solid #ff4d4d' : 'none',
                    boxShadow: !isScannerActive ? '0 8px 25px rgba(211, 162, 0, 0.4)' : 'none'
                }}
                onMouseEnter={(e) => {
                    if(!isScannerActive && window.innerWidth > 768) {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 12px 30px rgba(211, 162, 0, 0.5)';
                    }
                }}
                onMouseLeave={(e) => {
                    if(!isScannerActive) {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 8px 25px rgba(211, 162, 0, 0.4)';
                    }
                }}
            >
                {isScannerActive ? (
                    <><Shield size={20} /> Deactivate Control</>
                ) : (
                    <><Camera size={20} /> Initialize Scanner</>
                )}
            </button>
            
            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'center', gap: '24px', opacity: 0.5 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px' }}>
                    <Shield size={12} /> Encrypted
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px' }}>
                    <AlertCircle size={12} /> Non-Touch
                </div>
            </div>
        </div>
    </div>
);

export default AdminScannerTab;
