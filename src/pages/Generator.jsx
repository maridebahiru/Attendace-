import React, { useState, useRef } from 'react';
import { db } from '../firebase/config';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import QRCard from '../components/QRCard';
import html2canvas from 'html2canvas';
import logo from '../assets/logo.png';
import churchLogo from '../assets/kana.png';

const Generator = () => {
    const [formData, setFormData] = useState({ name: '', phone: '', idNo: '' });
    const [studentData, setStudentData] = useState(null);
    const [loading, setLoading] = useState(false);
    const cardRef = useRef(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.phone.length < 10) {
            alert("Phone number must be at least 10 digits");
            return;
        }
        setLoading(true);

        try {
            // Upsert to Firestore using phone as doc ID
            await setDoc(doc(db, "students", formData.phone), {
                ...formData,
                createdAt: serverTimestamp()
            });
            setStudentData(formData);
        } catch (error) {
            console.error("Error saving student:", error);
            alert("Error saving data to Firebase");
        } finally {
            setLoading(false);
        }
    };

    const downloadCard = async () => {
        if (!cardRef.current) return;
        const canvas = await html2canvas(cardRef.current, {
            scale: 2, // Higher quality
            useCORS: true,
            backgroundColor: null
        });
        const link = document.createElement('a');
        link.download = `ID_${studentData.phone}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    };

    const resetForm = () => {
        setStudentData(null);
        setFormData({ name: '', phone: '', idNo: '' });
    };

    if (studentData) {
        return (
            <div style={{ padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <QRCard ref={cardRef} studentData={studentData} logo={logo} churchLogo={churchLogo} />

                <div style={{ marginTop: '30px', display: 'flex', gap: '15px' }}>
                    <button
                        onClick={downloadCard}
                        style={{
                            padding: '12px 24px',
                            backgroundColor: '#d3a200',
                            color: '#1a0a0f',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            boxShadow: '0 4px 10px rgba(211, 162, 0, 0.3)'
                        }}
                    >
                        ⬇ Download Card as PNG
                    </button>
                    <button
                        onClick={resetForm}
                        style={{
                            padding: '12px 24px',
                            backgroundColor: 'transparent',
                            color: '#d3a200',
                            border: '2px solid #d3a200',
                            borderRadius: '8px',
                            fontWeight: '700',
                            cursor: 'pointer'
                        }}
                    >
                        Generate Another
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '500px', margin: '0 auto', padding: '60px 20px' }}>
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px', marginBottom: '20px' }}>
                    <img src={logo} alt="Logo" style={{ height: '80px', objectFit: 'contain' }} />
                    <img src={churchLogo} alt="Church Logo" style={{ height: '80px', objectFit: 'contain' }} />
                </div>
                <h1 style={{ color: '#d3a200', fontSize: '2.5rem', marginBottom: '10px' }}>የቅድመ ጋብቻ ትምህርት</h1>
                <p style={{ color: '#f5e6c8', opacity: 0.8 }}>Registration & ID Card Generator</p>
            </div>

            <form
                onSubmit={handleSubmit}
                style={{
                    backgroundColor: '#2a0f18',
                    padding: '40px',
                    borderRadius: '16px',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                    border: '1px solid rgba(211, 162, 0, 0.1)'
                }}
            >
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', color: '#d3a200', fontWeight: '600' }}>Full Name</label>
                    <input
                        type="text"
                        required
                        placeholder="John Doe"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        style={{
                            width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #65081b',
                            backgroundColor: '#1a0a0f', color: '#f5e6c8', outline: 'none'
                        }}
                    />
                </div>

                <div style={{ marginBottom: '30px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', color: '#d3a200', fontWeight: '600' }}>Phone Number</label>
                    <input
                        type="tel"
                        required
                        placeholder="0911223344"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        style={{
                            width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #65081b',
                            backgroundColor: '#1a0a0f', color: '#f5e6c8', outline: 'none'
                        }}
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    style={{
                        width: '100%', padding: '14px', borderRadius: '8px', border: 'none',
                        backgroundColor: '#d3a200', color: '#1a0a0f', fontWeight: '700',
                        fontSize: '1rem', cursor: 'pointer', transition: '0.2s',
                        opacity: loading ? 0.7 : 1
                    }}
                >
                    {loading ? 'Processing...' : 'Generate ID Card'}
                </button>
            </form>
        </div>
    );
};

export default Generator;
