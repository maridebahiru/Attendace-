import React from 'react';

export const TabButton = ({ icon, label, active, onClick, vertical = false }) => (
    <button
        onClick={onClick}
        className="animate-fade-in"
        style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            padding: vertical ? '12px 16px' : '8px 16px', 
            borderRadius: '12px', border: 'none',
            backgroundColor: active ? 'var(--accent-gold)' : 'transparent',
            color: active ? 'var(--bg-primary)' : 'var(--text-primary)',
            fontWeight: '600', cursor: 'pointer', transition: 'var(--transition-smooth)',
            opacity: active ? 1 : 0.7,
            width: vertical ? '100%' : 'auto',
            justifyContent: vertical ? 'flex-start' : 'center',
            boxShadow: active ? '0 4px 15px rgba(211, 162, 0, 0.3)' : 'none',
            transform: active ? 'scale(1.02)' : 'scale(1)',
            minHeight: '44px' // Mobile touch target best practice
        }}
    >
        <span style={{ display: 'flex', alignItems: 'center' }}>{icon}</span>
        {label && <span style={{ fontSize: '14px' }}>{label}</span>}
    </button>
);

export const StatCard = ({ icon, label, value, subValue }) => (
    <div 
        className="glass-effect animate-slide-up"
        style={{
            padding: window.innerWidth <= 768 ? '16px' : '24px', 
            borderRadius: 'var(--radius-lg)',
            display: 'flex', alignItems: 'center', gap: '16px',
            transition: 'var(--transition-smooth)',
            cursor: 'default',
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
            flex: '1 1 200px'
        }}
        onMouseEnter={(e) => { if (window.innerWidth > 768) e.currentTarget.style.transform = 'translateY(-5px)'; }}
        onMouseLeave={(e) => { if (window.innerWidth > 768) e.currentTarget.style.transform = 'translateY(0)'; }}
    >
        <div style={{
            width: window.innerWidth <= 768 ? '44px' : '56px', 
            height: window.innerWidth <= 768 ? '44px' : '56px', 
            borderRadius: '12px',
            backgroundColor: 'rgba(101, 8, 27, 0.2)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', border: '1px solid var(--glass-border)',
            boxShadow: 'inset 0 0 10px rgba(211, 162, 0, 0.1)',
            flexShrink: 0
        }}>
            {React.cloneElement(icon, { size: window.innerWidth <= 768 ? 20 : 24 })}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ color: 'var(--text-primary)', opacity: 0.6, fontSize: '12px', fontWeight: '500', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</div>
            <div style={{ color: 'var(--accent-gold)', fontSize: window.innerWidth <= 768 ? '22px' : '28px', fontWeight: '700', letterSpacing: '-0.5px' }}>{value}</div>
            {subValue && (
                <div style={{ fontSize: '10px', color: 'var(--accent-gold)', opacity: 0.7, marginTop: '1px' }}>{subValue}</div>
            )}
        </div>
    </div>
);
