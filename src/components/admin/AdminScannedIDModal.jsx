import React from 'react';
import { X, CheckCircle2, AlertCircle, IdCard, User, Building, Briefcase, Phone, ShieldCheck } from 'lucide-react';
import QRCard from '../QRCard';

const AdminScannedIDModal = ({ scanResult, onClose }) => {
    if (!scanResult || !scanResult.student) return null;

    const { student, status, scannedAt } = scanResult;
    const isSuccess = status === 'success';
    const registeredId = student.employeeId || student.idNo || student.phone;

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(10, 3, 6, 0.85)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                zIndex: 9999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px',
                overflowY: 'auto'
            }}
            onClick={onClose}
        >
            <div
                className="glass-effect animate-slide-up custom-scroll"
                onClick={(e) => e.stopPropagation()}
                style={{
                    width: '100%',
                    maxWidth: '540px',
                    maxHeight: '90vh',
                    backgroundColor: 'rgba(25, 10, 15, 0.95)',
                    borderRadius: '24px',
                    border: `1.5px solid ${isSuccess ? 'rgba(0, 255, 128, 0.4)' : 'rgba(211, 162, 0, 0.4)'}`,
                    boxShadow: isSuccess
                        ? '0 20px 50px rgba(0, 255, 128, 0.15)'
                        : '0 20px 50px rgba(211, 162, 0, 0.15)',
                    padding: window.innerWidth <= 768 ? '20px' : '28px',
                    overflowY: 'auto',
                    position: 'relative'
                }}
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: '20px',
                        right: '20px',
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid var(--glass-border)',
                        color: 'var(--text-primary)',
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        zIndex: 10
                    }}
                >
                    <X size={18} />
                </button>

                {/* Status Banner Header */}
                <div
                    style={{
                        padding: '12px 18px',
                        borderRadius: '14px',
                        backgroundColor: isSuccess ? 'rgba(0, 255, 128, 0.12)' : 'rgba(211, 162, 0, 0.12)',
                        border: `1px solid ${isSuccess ? '#00ff80' : '#d3a200'}`,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        marginBottom: '20px'
                    }}
                >
                    {isSuccess ? (
                        <CheckCircle2 size={22} style={{ color: '#00ff80', flexShrink: 0 }} />
                    ) : (
                        <AlertCircle size={22} style={{ color: '#d3a200', flexShrink: 0 }} />
                    )}
                    <div>
                        <div
                            style={{
                                color: isSuccess ? '#00ff80' : '#d3a200',
                                fontWeight: '800',
                                fontSize: '14px',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px'
                            }}
                        >
                            {isSuccess ? 'Check-In Verified' : 'Already Checked In Today'}
                        </div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '11px', marginTop: '2px' }}>
                            {scannedAt ? new Date(scannedAt).toLocaleTimeString() : 'Just Now'}
                        </div>
                    </div>
                </div>

                {/* Student Profile Overview Card */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '18px',
                        padding: '16px',
                        borderRadius: '16px',
                        backgroundColor: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid var(--glass-border)',
                        marginBottom: '20px'
                    }}
                >
                    {student.profilePhotoUrl ? (
                        <img
                            src={student.profilePhotoUrl}
                            alt={student.name}
                            style={{
                                width: '70px',
                                height: '70px',
                                borderRadius: '50%',
                                objectFit: 'cover',
                                border: '2px solid var(--accent-gold)'
                            }}
                            onError={(e) => { e.target.style.display = 'none'; }}
                        />
                    ) : (
                        <div
                            style={{
                                width: '70px',
                                height: '70px',
                                borderRadius: '50%',
                                backgroundColor: 'rgba(211, 162, 0, 0.15)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'var(--accent-gold)',
                                border: '2px solid var(--accent-gold)'
                            }}
                        >
                            <User size={36} />
                        </div>
                    )}

                    <div style={{ flex: 1, minWidth: 0 }}>
                        <h2
                            style={{
                                color: 'var(--text-primary)',
                                fontSize: '20px',
                                fontWeight: '800',
                                margin: '0 0 6px 0',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                            }}
                        >
                            {student.name}
                        </h2>

                        {/* Highlighted Registered ID from Google Form */}
                        <div
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                backgroundColor: 'var(--accent-gold)',
                                color: 'var(--bg-primary)',
                                padding: '4px 10px',
                                borderRadius: '6px',
                                fontSize: '13px',
                                fontWeight: '900',
                                letterSpacing: '0.5px'
                            }}
                        >
                            <IdCard size={15} /> Registered ID: {registeredId}
                        </div>

                        <div
                            style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: '12px',
                                marginTop: '8px',
                                fontSize: '12px',
                                color: 'var(--text-secondary)'
                            }}
                        >
                            {student.phone && (
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <Phone size={13} /> {student.phone}
                                </span>
                            )}
                            {student.department && (
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <Building size={13} /> {student.department}
                                </span>
                            )}
                            {student.position && (
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <Briefcase size={13} /> {student.position}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Digital ID Card Preview */}
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                    <div
                        style={{
                            fontSize: '11px',
                            fontWeight: '800',
                            color: 'var(--text-secondary)',
                            letterSpacing: '1px',
                            textTransform: 'uppercase',
                            marginBottom: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px'
                        }}
                    >
                        <ShieldCheck size={14} style={{ color: 'var(--accent-gold)' }} />
                        Official Digital ID Card
                    </div>

                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'center',
                            overflow: 'hidden',
                            padding: '10px 0'
                        }}
                    >
                        <div
                            style={{
                                transform: window.innerWidth <= 768 ? 'scale(0.72)' : 'scale(0.8)',
                                transformOrigin: 'top center',
                                marginBottom: window.innerWidth <= 768 ? '-170px' : '-120px'
                            }}
                        >
                            <QRCard studentData={student} />
                        </div>
                    </div>
                </div>

                {/* Footer Action */}
                <button
                    onClick={onClose}
                    style={{
                        width: '100%',
                        padding: '14px',
                        borderRadius: '14px',
                        backgroundColor: 'var(--accent-gold)',
                        color: 'var(--bg-primary)',
                        fontWeight: '800',
                        fontSize: '15px',
                        border: 'none',
                        cursor: 'pointer',
                        boxShadow: '0 8px 20px rgba(211, 162, 0, 0.35)',
                        transition: 'transform 0.2s ease, background-color 0.2s ease',
                        marginTop: '10px'
                    }}
                >
                    Done / Scan Next Student
                </button>
            </div>
        </div>
    );
};

export default AdminScannedIDModal;
