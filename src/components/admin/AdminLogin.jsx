import React, { useState, useEffect } from 'react';
import { Lock } from 'lucide-react';

const HARDCODED_PASS = "maramawitdereje93@gmail.com";

const AdminLogin = ({ onLoginSuccess }) => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [attempts, setAttempts] = useState(0);
    const [isLocked, setIsLocked] = useState(false);
    const [countdown, setCountdown] = useState(0);

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
            sessionStorage.setItem('isAdminAuth', 'true');
            onLoginSuccess();
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
};

export default AdminLogin;
