import React, { useState, useEffect } from 'react';
import { 
    MapPin, MapPinOff, Navigation, Compass, ShieldAlert, ShieldCheck, 
    RefreshCw, LogOut, HelpCircle, AlertTriangle, Building, Lock
} from 'lucide-react';
import { verifyAdminLocation, VENUE_CONFIG } from '../../utils/locationService';

const AdminLocationGate = ({ onVerified, onLogout }) => {
    const [status, setStatus] = useState('checking'); // 'checking' | 'allowed' | 'out_of_range' | 'permission_denied' | 'error'
    const [resultData, setResultData] = useState(null);

    const runCheck = async () => {
        setStatus('checking');
        setResultData(null);
        
        try {
            const res = await verifyAdminLocation();
            if (res.allowed) {
                setStatus('allowed');
                onVerified(res);
            } else {
                setResultData(res);
                if (res.errorType === 'OUT_OF_RANGE') {
                    setStatus('out_of_range');
                } else if (res.errorType === 'PERMISSION_DENIED') {
                    setStatus('permission_denied');
                } else {
                    setStatus('error');
                }
            }
        } catch (e) {
            console.error('Location verification error:', e);
            setStatus('error');
            setResultData({ message: e.message || 'Location verification system error.' });
        }
    };

    useEffect(() => {
        runCheck();
    }, []);

    const formatDistance = (meters) => {
        if (!meters && meters !== 0) return 'Unknown';
        if (meters >= 1000) {
            return `${(meters / 1000).toFixed(2)} km`;
        }
        return `${meters} meters`;
    };

    return (
        <div style={{
            position: 'fixed', inset: 0,
            backgroundColor: '#150508',
            color: 'var(--text-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px', zIndex: 99999,
            backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(101, 8, 27, 0.4) 0%, rgba(21, 5, 8, 0.95) 100%)'
        }}>
            <div 
                className="glass-effect animate-slide-up"
                style={{
                    width: '100%', maxWidth: '540px',
                    borderRadius: '24px', padding: window.innerWidth <= 768 ? '24px' : '36px',
                    border: '1px solid var(--glass-border)',
                    boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center'
                }}
            >
                {/* Header Badge */}
                <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    padding: '6px 14px', borderRadius: '20px', fontSize: '11px', fontWeight: '800',
                    letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '20px',
                    backgroundColor: 'rgba(211, 162, 0, 0.1)', color: 'var(--accent-gold)',
                    border: '1px solid rgba(211, 162, 0, 0.3)'
                }}>
                    <Building size={14} /> {VENUE_CONFIG.NAME}
                </div>

                {/* State: CHECKING / LOADING */}
                {status === 'checking' && (
                    <>
                        <div style={{
                            width: '80px', height: '80px', borderRadius: '50%',
                            backgroundColor: 'rgba(211, 162, 0, 0.1)', border: '2px dashed var(--accent-gold)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            marginBottom: '24px', animation: 'spin 4s linear infinite'
                        }}>
                            <Compass size={40} color="var(--accent-gold)" />
                        </div>
                        <h2 style={{ color: 'var(--accent-gold)', fontSize: '22px', margin: '0 0 8px 0', fontWeight: '800' }}>
                            Verifying Location...
                        </h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0, lineHeight: 1.5 }}>
                            Acquiring GPS coordinates to verify proximity to <strong>{VENUE_CONFIG.NAME}</strong>.
                        </p>
                        <div style={{ marginTop: '24px', fontSize: '12px', color: 'var(--text-secondary)', opacity: 0.6, display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <RefreshCw size={12} style={{ animation: 'spin 1s linear infinite' }} /> High precision GPS resolution active (12s timeout)
                        </div>
                    </>
                )}

                {/* State: OUT OF RANGE */}
                {status === 'out_of_range' && (
                    <>
                        <div style={{
                            width: '80px', height: '80px', borderRadius: '50%',
                            backgroundColor: 'rgba(255, 77, 77, 0.15)', border: '2px solid #ff4d4d',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            marginBottom: '24px'
                        }}>
                            <MapPinOff size={40} color="#ff4d4d" />
                        </div>
                        <h2 style={{ color: '#ff4d4d', fontSize: '22px', margin: '0 0 8px 0', fontWeight: '800' }}>
                            Access Restricted: Out of Range
                        </h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: '0 0 24px 0', lineHeight: 1.5 }}>
                            Regular admins must be physically present at <strong>{VENUE_CONFIG.NAME}</strong> to unlock the admin console.
                        </p>

                        <div style={{
                            width: '100%', padding: '16px', borderRadius: '16px',
                            backgroundColor: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 77, 77, 0.2)',
                            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '28px',
                            textAlign: 'center'
                        }}>
                            <div>
                                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '700' }}>Your Distance</div>
                                <div style={{ fontSize: '20px', fontWeight: '800', color: '#ff4d4d', marginTop: '4px' }}>
                                    {formatDistance(resultData?.distanceMeters)}
                                </div>
                            </div>
                            <div style={{ borderLeft: '1px solid var(--glass-border)' }}>
                                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '700' }}>Max Allowed</div>
                                <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--accent-gold)', marginTop: '4px' }}>
                                    {VENUE_CONFIG.MAX_RADIUS_METERS}m
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '12px', width: '100%', flexWrap: 'wrap' }}>
                            <button
                                onClick={runCheck}
                                style={{
                                    flex: 1, minWidth: '160px', padding: '14px', borderRadius: '12px',
                                    backgroundColor: 'var(--accent-gold)', color: '#1a0a0f',
                                    border: 'none', fontWeight: '800', fontSize: '14px', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                                }}
                            >
                                <RefreshCw size={16} /> Retry Location Check
                            </button>
                            <button
                                onClick={onLogout}
                                style={{
                                    padding: '14px 20px', borderRadius: '12px',
                                    backgroundColor: 'rgba(255, 77, 77, 0.15)', color: '#ff4d4d',
                                    border: '1px solid #ff4d4d', fontWeight: '700', fontSize: '14px', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                                }}
                            >
                                <LogOut size={16} /> Logout
                            </button>
                        </div>
                    </>
                )}

                {/* State: PERMISSION DENIED */}
                {status === 'permission_denied' && (
                    <>
                        <div style={{
                            width: '80px', height: '80px', borderRadius: '50%',
                            backgroundColor: 'rgba(255, 140, 0, 0.15)', border: '2px solid #ff8c00',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            marginBottom: '24px'
                        }}>
                            <Lock size={40} color="#ff8c00" />
                        </div>
                        <h2 style={{ color: '#ff8c00', fontSize: '22px', margin: '0 0 8px 0', fontWeight: '800' }}>
                            Location Permission Blocked
                        </h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: '0 0 20px 0', lineHeight: 1.5 }}>
                            Your browser denied access to location services. To unlock the admin console, please enable location permissions for this site.
                        </p>

                        <div style={{
                            width: '100%', padding: '16px 20px', borderRadius: '16px',
                            backgroundColor: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--glass-border)',
                            textAlign: 'left', marginBottom: '28px', fontSize: '13px', lineHeight: 1.6
                        }}>
                            <div style={{ fontWeight: '800', color: 'var(--accent-gold)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <HelpCircle size={15} /> How to enable location access:
                            </div>
                            <ol style={{ margin: 0, paddingLeft: '20px', color: 'var(--text-primary)', opacity: 0.9 }}>
                                <li>Click the <strong>Lock / Tune icon</strong> next to the web address (URL) in your browser.</li>
                                <li>Locate <strong>Location</strong> and change setting to <strong>Allow</strong>.</li>
                                <li>Click the <strong>Retry Location Check</strong> button below.</li>
                            </ol>
                        </div>

                        <div style={{ display: 'flex', gap: '12px', width: '100%', flexWrap: 'wrap' }}>
                            <button
                                onClick={runCheck}
                                style={{
                                    flex: 1, minWidth: '160px', padding: '14px', borderRadius: '12px',
                                    backgroundColor: 'var(--accent-gold)', color: '#1a0a0f',
                                    border: 'none', fontWeight: '800', fontSize: '14px', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                                }}
                            >
                                <RefreshCw size={16} /> Retry Location Check
                            </button>
                            <button
                                onClick={onLogout}
                                style={{
                                    padding: '14px 20px', borderRadius: '12px',
                                    backgroundColor: 'rgba(255, 77, 77, 0.15)', color: '#ff4d4d',
                                    border: '1px solid #ff4d4d', fontWeight: '700', fontSize: '14px', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                                }}
                            >
                                <LogOut size={16} /> Logout
                            </button>
                        </div>
                    </>
                )}

                {/* State: ERROR / TIMEOUT / UNSUPPORTED */}
                {status === 'error' && (
                    <>
                        <div style={{
                            width: '80px', height: '80px', borderRadius: '50%',
                            backgroundColor: 'rgba(255, 77, 77, 0.15)', border: '2px solid #ff4d4d',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            marginBottom: '24px'
                        }}>
                            <AlertTriangle size={40} color="#ff4d4d" />
                        </div>
                        <h2 style={{ color: '#ff4d4d', fontSize: '22px', margin: '0 0 8px 0', fontWeight: '800' }}>
                            Location Check Failed
                        </h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: '0 0 24px 0', lineHeight: 1.5 }}>
                            {resultData?.message || "Could not resolve your location coordinates in time. Please check your device GPS."}
                        </p>

                        <div style={{ display: 'flex', gap: '12px', width: '100%', flexWrap: 'wrap' }}>
                            <button
                                onClick={runCheck}
                                style={{
                                    flex: 1, minWidth: '160px', padding: '14px', borderRadius: '12px',
                                    backgroundColor: 'var(--accent-gold)', color: '#1a0a0f',
                                    border: 'none', fontWeight: '800', fontSize: '14px', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                                }}
                            >
                                <RefreshCw size={16} /> Retry Location Check
                            </button>
                            <button
                                onClick={onLogout}
                                style={{
                                    padding: '14px 20px', borderRadius: '12px',
                                    backgroundColor: 'rgba(255, 77, 77, 0.15)', color: '#ff4d4d',
                                    border: '1px solid #ff4d4d', fontWeight: '700', fontSize: '14px', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                                }}
                            >
                                <LogOut size={16} /> Logout
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default AdminLocationGate;
