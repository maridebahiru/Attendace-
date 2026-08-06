import React, { useState } from 'react';
import { X, CheckCircle2, AlertCircle, IdCard, User, Building, Briefcase, Phone, ShieldCheck, Eye, ExternalLink, Image, Maximize2 } from 'lucide-react';
import QRCard from '../QRCard';

const AdminScannedIDModal = ({ scanResult, onClose }) => {
    const [showUploadedId, setShowUploadedId] = useState(false);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);

    if (!scanResult || !scanResult.student) return null;

    const { student, status, scannedAt } = scanResult;
    const isSuccess = status === 'success';
    const registeredId = student.employeeId || student.idNo || student.phone;

    // Check all possible field names for uploaded ID photo/document URL
    const uploadedIdPhoto = student.id_photo_url || student.idPhotoUrl || student.idUrl || student.id_url || student.uploadedIdUrl || student.idCardUrl || student.profilePhotoUrl;

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
                    maxWidth: '560px',
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
                        marginBottom: '16px'
                    }}
                >
                    {uploadedIdPhoto ? (
                        <img
                            src={uploadedIdPhoto}
                            alt={student.name}
                            style={{
                                width: '70px',
                                height: '70px',
                                borderRadius: '50%',
                                objectFit: 'cover',
                                border: '2px solid var(--accent-gold)',
                                cursor: 'pointer'
                            }}
                            onClick={() => setIsLightboxOpen(true)}
                            onError={(e) => { e.target.style.display = 'none'; }}
                            title="Click to expand photo"
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

                        {/* Highlighted Registered ID from Registration / Form */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
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
                            {(student.christianName || student.christian_name) && (
                                <div
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        backgroundColor: 'rgba(211, 162, 0, 0.15)',
                                        color: 'var(--accent-gold)',
                                        border: '1px solid var(--accent-gold)',
                                        padding: '4px 10px',
                                        borderRadius: '6px',
                                        fontSize: '12px',
                                        fontWeight: '700'
                                    }}
                                >
                                    የክርስትና ስም: {student.christianName || student.christian_name}
                                </div>
                            )}
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
                                    <Phone size={13} /> Phone: {student.phone}
                                </span>
                            )}
                            {(student.department || student.church) && (
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <Building size={13} /> {student.department || student.church}
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

                {/* View Uploaded ID Button */}
                <button
                    onClick={() => setShowUploadedId(!showUploadedId)}
                    style={{
                        width: '100%',
                        padding: '12px 18px',
                        borderRadius: '14px',
                        border: '1.5px solid var(--accent-gold)',
                        backgroundColor: showUploadedId ? 'var(--accent-gold)' : 'rgba(211, 162, 0, 0.12)',
                        color: showUploadedId ? 'var(--bg-primary)' : 'var(--accent-gold)',
                        fontWeight: '800',
                        fontSize: '14px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        marginBottom: '20px',
                        transition: 'all 0.2s ease',
                        boxShadow: showUploadedId ? '0 4px 15px rgba(211, 162, 0, 0.3)' : 'none'
                    }}
                >
                    <Eye size={18} />
                    {showUploadedId ? "Hide Uploaded ID Document" : "View Uploaded ID Photo / Document"}
                </button>

                {/* Uploaded ID Document Section */}
                {showUploadedId && (
                    <div
                        className="animate-fade-in"
                        style={{
                            padding: '18px',
                            borderRadius: '16px',
                            backgroundColor: 'rgba(0, 0, 0, 0.4)',
                            border: '1px solid var(--accent-gold)',
                            marginBottom: '20px',
                            textAlign: 'center'
                        }}
                    >
                        <div
                            style={{
                                fontSize: '12px',
                                fontWeight: '800',
                                color: 'var(--accent-gold)',
                                textTransform: 'uppercase',
                                letterSpacing: '1px',
                                marginBottom: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px'
                            }}
                        >
                            <Image size={16} />
                            Uploaded Student ID Attachment
                        </div>

                        {uploadedIdPhoto ? (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                                <div
                                    style={{
                                        position: 'relative',
                                        borderRadius: '12px',
                                        overflow: 'hidden',
                                        border: '2px solid var(--accent-gold)',
                                        maxHeight: '280px',
                                        width: '100%',
                                        backgroundColor: '#000',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    <img
                                        src={uploadedIdPhoto}
                                        alt={`Uploaded ID of ${student.name}`}
                                        style={{
                                            maxWidth: '100%',
                                            maxHeight: '280px',
                                            objectFit: 'contain'
                                        }}
                                    />
                                    <button
                                        onClick={() => setIsLightboxOpen(true)}
                                        style={{
                                            position: 'absolute',
                                            bottom: '10px',
                                            right: '10px',
                                            backgroundColor: 'rgba(0, 0, 0, 0.75)',
                                            color: 'var(--accent-gold)',
                                            border: '1px solid var(--accent-gold)',
                                            borderRadius: '8px',
                                            padding: '6px 12px',
                                            fontSize: '12px',
                                            fontWeight: '700',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px'
                                        }}
                                    >
                                        <Maximize2 size={13} /> Fullscreen
                                    </button>
                                </div>

                                <a
                                    href={uploadedIdPhoto}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        fontSize: '13px',
                                        fontWeight: '700',
                                        color: 'var(--accent-gold)',
                                        textDecoration: 'none',
                                        backgroundColor: 'rgba(211, 162, 0, 0.1)',
                                        padding: '6px 14px',
                                        borderRadius: '8px',
                                        border: '1px solid rgba(211, 162, 0, 0.3)'
                                    }}
                                >
                                    <ExternalLink size={14} /> Open Original High-Res File
                                </a>
                            </div>
                        ) : (
                            <div
                                style={{
                                    padding: '24px',
                                    color: 'var(--text-secondary)',
                                    fontSize: '13px',
                                    fontStyle: 'italic'
                                }}
                            >
                                No uploaded ID image document found for this student record.
                            </div>
                        )}
                    </div>
                )}

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

            {/* Lightbox Fullscreen Modal for Uploaded ID Image */}
            {isLightboxOpen && uploadedIdPhoto && (
                <div
                    onClick={() => setIsLightboxOpen(false)}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.92)',
                        backdropFilter: 'blur(10px)',
                        zIndex: 10000,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '20px'
                    }}
                >
                    <button
                        onClick={() => setIsLightboxOpen(false)}
                        style={{
                            position: 'absolute',
                            top: '20px',
                            right: '20px',
                            background: 'rgba(255, 255, 255, 0.2)',
                            border: 'none',
                            color: '#fff',
                            width: '44px',
                            height: '44px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer'
                        }}
                    >
                        <X size={24} />
                    </button>

                    <div style={{ color: 'var(--accent-gold)', fontWeight: '800', fontSize: '16px', marginBottom: '14px' }}>
                        ID Document Attachment — {student.name} ({registeredId})
                    </div>

                    <img
                        src={uploadedIdPhoto}
                        alt={`Full ID of ${student.name}`}
                        style={{
                            maxWidth: '90vw',
                            maxHeight: '80vh',
                            objectFit: 'contain',
                            borderRadius: '12px',
                            boxShadow: '0 10px 40px rgba(0,0,0,0.8)',
                            border: '2px solid var(--accent-gold)'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </div>
    );
};

export default AdminScannedIDModal;
