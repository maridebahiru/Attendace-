import React, { useState, useEffect } from 'react';
import { db } from '../../firebase/config';
import { collection, onSnapshot, doc, setDoc, deleteDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { Shield, Plus, Trash2, Key, User, Mail, UserCheck, Lock, AlertCircle, RefreshCw } from 'lucide-react';
import { isSuperAdmin, checkPermission, logSuperAdminAudit } from '../../utils/rbac';

const AdminAccountsSection = () => {
    const [admins, setAdmins] = useState([]);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        name: '',
        role: 'admin'
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);

    const hasWritePermission = isSuperAdmin();

    useEffect(() => {
        const adminsCol = collection(db, 'admins');
        const unsub = onSnapshot(adminsCol, (snap) => {
            const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setAdmins(list);
        }, (err) => {
            console.error("Admins snapshot error:", err);
        });
        return () => unsub();
    }, []);

    const showMsg = (text, type = 'success') => {
        setMessage({ text, type });
        setTimeout(() => setMessage(null), 4000);
    };

    const handleCreateAdmin = async (e) => {
        e.preventDefault();
        const perm = checkPermission('create_admin');
        if (!perm.allowed) {
            showMsg(perm.reason, 'error');
            return;
        }

        if (!formData.username || !formData.password || !formData.name) {
            showMsg("Please fill in all required fields.", 'error');
            return;
        }

        setLoading(true);
        const docId = formData.username.trim().toLowerCase();
        const docRef = doc(db, 'admins', docId);

        try {
            const existing = await getDoc(docRef);
            if (existing.exists()) {
                showMsg(`Admin with username "${docId}" already exists.`, 'error');
                setLoading(false);
                return;
            }

            const adminData = {
                username: docId,
                password: formData.password.trim(),
                name: formData.name.trim(),
                role: formData.role,
                createdAt: serverTimestamp()
            };

            await setDoc(docRef, adminData);

            // Audit log creation action
            await logSuperAdminAudit('CREATE_ADMIN_ACCOUNT', {
                targetUsername: docId,
                targetName: formData.name,
                assignedRole: formData.role
            });

            showMsg(`Successfully created ${formData.role === 'superadmin' ? 'Super Admin' : 'Admin'} account for ${formData.name}`);
            setFormData({ username: '', password: '', name: '', role: 'admin' });
            setIsAddModalOpen(false);
        } catch (err) {
            console.error("Error creating admin:", err);
            showMsg("Failed to create admin account.", 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleRole = async (adminAccount) => {
        const perm = checkPermission('update_admin');
        if (!perm.allowed) {
            showMsg(perm.reason, 'error');
            return;
        }

        const newRole = adminAccount.role === 'superadmin' ? 'admin' : 'superadmin';
        if (!window.confirm(`Change ${adminAccount.name}'s role to ${newRole.toUpperCase()}?`)) return;

        try {
            const docRef = doc(db, 'admins', adminAccount.id);
            await setDoc(docRef, { role: newRole }, { merge: true });

            await logSuperAdminAudit('CHANGE_ADMIN_ROLE', {
                targetUsername: adminAccount.username || adminAccount.id,
                oldRole: adminAccount.role,
                newRole: newRole
            });

            showMsg(`Updated ${adminAccount.name}'s role to ${newRole}`);
        } catch (err) {
            showMsg("Error changing admin role.", 'error');
        }
    };

    const handleDeleteAdmin = async (adminAccount) => {
        const perm = checkPermission('delete_admin');
        if (!perm.allowed) {
            showMsg(perm.reason, 'error');
            return;
        }

        if (!window.confirm(`Are you sure you want to remove admin account: ${adminAccount.name}?`)) return;

        try {
            await deleteDoc(doc(db, 'admins', adminAccount.id));

            await logSuperAdminAudit('REMOVE_ADMIN_ACCOUNT', {
                targetUsername: adminAccount.username || adminAccount.id,
                targetName: adminAccount.name
            });

            showMsg(`Admin account "${adminAccount.name}" removed.`);
        } catch (err) {
            showMsg("Error deleting admin account.", 'error');
        }
    };

    const thStyle = {
        padding: '16px 14px', fontWeight: '700', fontSize: '11px', textTransform: 'uppercase',
        letterSpacing: '1px', color: 'var(--accent-gold)', borderBottom: '2px solid var(--accent-red)',
        backgroundColor: 'var(--bg-tertiary)'
    };
    const tdStyle = { padding: '14px', borderBottom: '1px solid rgba(101, 8, 27, 0.2)', fontSize: '13px' };

    return (
        <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Header & Add Button */}
            <div className="glass-effect" style={{ padding: '24px', borderRadius: 'var(--radius-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <h4 style={{ color: 'var(--accent-gold)', fontSize: '18px', margin: 0 }}>Admin Accounts & Permissions</h4>
                        <span style={{
                            fontSize: '11px', fontWeight: '800', padding: '4px 10px', borderRadius: '20px',
                            backgroundColor: hasWritePermission ? 'rgba(211, 162, 0, 0.15)' : 'rgba(255, 77, 77, 0.15)',
                            color: hasWritePermission ? 'var(--accent-gold)' : '#ff4d4d',
                            border: `1px solid ${hasWritePermission ? 'var(--accent-gold)' : '#ff4d4d'}`
                        }}>
                            {hasWritePermission ? 'SUPER ADMIN PRIVILEGES' : 'READ ONLY (ADMIN)'}
                        </span>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px' }}>
                        Manage admin access, assign roles, or register system operators.
                    </p>
                </div>

                {hasWritePermission ? (
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        style={{
                            backgroundColor: 'var(--accent-gold)', color: 'var(--bg-primary)',
                            padding: '12px 24px', borderRadius: '12px', border: 'none',
                            fontWeight: '700', display: 'flex', alignItems: 'center', gap: '10px',
                            cursor: 'pointer', transition: 'var(--transition-smooth)',
                            boxShadow: '0 4px 15px rgba(211, 162, 0, 0.3)'
                        }}
                    >
                        <Plus size={20} /> Add New Admin
                    </button>
                ) : (
                    <div style={{ fontSize: '12px', color: '#ff4d4d', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Lock size={14} /> Creating admin accounts requires Super Admin privileges.
                    </div>
                )}
            </div>

            {message && (
                <div style={{
                    padding: '12px 20px', borderRadius: '10px',
                    backgroundColor: message.type === 'error' ? 'rgba(255, 77, 77, 0.15)' : 'rgba(211, 162, 0, 0.15)',
                    border: `1px solid ${message.type === 'error' ? '#ff4d4d' : 'var(--accent-gold)'}`,
                    color: message.type === 'error' ? '#ff4d4d' : 'var(--accent-gold)',
                    fontWeight: '600', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '10px'
                }}>
                    <AlertCircle size={18} /> {message.text}
                </div>
            )}

            {/* Table of Admins */}
            <div className="glass-effect" style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr>
                                <th style={thStyle}>Admin Name & Username</th>
                                <th style={thStyle}>Role</th>
                                <th style={thStyle}>Permissions Summary</th>
                                <th style={{ ...thStyle, textAlign: 'center' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {admins.map((adm) => {
                                const isSuper = (adm.role || '').toLowerCase() === 'superadmin';
                                return (
                                    <tr key={adm.id} style={{ borderBottom: '1px solid rgba(101, 8, 27, 0.2)' }}>
                                        <td style={tdStyle}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{
                                                    width: '36px', height: '36px', borderRadius: '10px',
                                                    backgroundColor: isSuper ? 'rgba(211, 162, 0, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                                                    border: `1px solid ${isSuper ? 'var(--accent-gold)' : 'var(--glass-border)'}`,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    color: isSuper ? 'var(--accent-gold)' : 'var(--text-primary)'
                                                }}>
                                                    <Shield size={18} />
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{adm.name || adm.username}</div>
                                                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{adm.username}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={tdStyle}>
                                            <span style={{
                                                padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '800',
                                                backgroundColor: isSuper ? 'rgba(211, 162, 0, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                                                color: isSuper ? 'var(--accent-gold)' : 'var(--text-secondary)',
                                                border: `1px solid ${isSuper ? 'var(--accent-gold)' : 'var(--glass-border)'}`
                                            }}>
                                                {isSuper ? 'SUPER ADMIN' : 'ADMIN'}
                                            </span>
                                        </td>
                                        <td style={tdStyle}>
                                            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                                {isSuper ? 'Full System Privileges (User & Admin Management)' : 'Scan & View Only (No Mutations Allowed)'}
                                            </span>
                                        </td>
                                        <td style={{ ...tdStyle, textAlign: 'center' }}>
                                            {hasWritePermission ? (
                                                <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                                                    <button
                                                        onClick={() => handleToggleRole(adm)}
                                                        style={{
                                                            padding: '6px 12px', borderRadius: '8px',
                                                            border: '1px solid var(--glass-border)',
                                                            backgroundColor: 'rgba(211, 162, 0, 0.1)', color: 'var(--accent-gold)',
                                                            cursor: 'pointer', fontSize: '12px', fontWeight: '700',
                                                            display: 'flex', alignItems: 'center', gap: '4px'
                                                        }}
                                                        title="Toggle Role"
                                                    >
                                                        <RefreshCw size={12} /> {isSuper ? 'Make Admin' : 'Make Super Admin'}
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteAdmin(adm)}
                                                        style={{
                                                            padding: '6px 10px', borderRadius: '8px',
                                                            border: '1px solid rgba(255, 77, 77, 0.3)',
                                                            backgroundColor: 'rgba(255, 77, 77, 0.1)', color: '#ff4d4d',
                                                            cursor: 'pointer', fontSize: '12px', fontWeight: '700'
                                                        }}
                                                        title="Remove Admin Account"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', opacity: 0.5 }}>Restricted</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    {admins.length === 0 && (
                        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                            No custom admin accounts registered yet. Default fallback login active.
                        </div>
                    )}
                </div>
            </div>

            {/* Create Admin Modal */}
            {isAddModalOpen && (
                <div
                    style={{
                        position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)',
                        backdropFilter: 'blur(8px)', zIndex: 2000,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
                    }}
                    onClick={() => setIsAddModalOpen(false)}
                >
                    <div
                        className="glass-effect animate-slide-up"
                        style={{ width: '100%', maxWidth: '480px', padding: '30px', borderRadius: '24px', border: '1px solid var(--glass-border)' }}
                        onClick={e => e.stopPropagation()}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ color: 'var(--accent-gold)', margin: 0, fontSize: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Shield size={22} /> Add New Admin Account
                            </h3>
                            <button onClick={() => setIsAddModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>✕</button>
                        </div>

                        <form onSubmit={handleCreateAdmin} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--accent-gold)', marginBottom: '6px' }}>Full Name</label>
                                <div style={{ position: 'relative' }}>
                                    <User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
                                    <input
                                        required
                                        type="text"
                                        placeholder="e.g. Samuel Yohannes"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        style={{ width: '100%', padding: '12px 12px 12px 38px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', outline: 'none' }}
                                    />
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--accent-gold)', marginBottom: '6px' }}>Username / Email</label>
                                <div style={{ position: 'relative' }}>
                                    <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
                                    <input
                                        required
                                        type="email"
                                        placeholder="admin@example.com"
                                        value={formData.username}
                                        onChange={e => setFormData({ ...formData, username: e.target.value })}
                                        style={{ width: '100%', padding: '12px 12px 12px 38px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', outline: 'none' }}
                                    />
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--accent-gold)', marginBottom: '6px' }}>Password</label>
                                <div style={{ position: 'relative' }}>
                                    <Key size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
                                    <input
                                        required
                                        type="password"
                                        placeholder="••••••••"
                                        value={formData.password}
                                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                                        style={{ width: '100%', padding: '12px 12px 12px 38px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', outline: 'none' }}
                                    />
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--accent-gold)', marginBottom: '6px' }}>Assign Permission Role</label>
                                <select
                                    value={formData.role}
                                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                                    style={{
                                        width: '100%', padding: '12px', borderRadius: '10px',
                                        backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)',
                                        color: 'var(--text-primary)', outline: 'none', fontWeight: '600'
                                    }}
                                >
                                    <option value="admin">ADMIN (Scan & View Only - No Edits)</option>
                                    <option value="superadmin">SUPER ADMIN (Full Access - Manage System)</option>
                                </select>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                style={{
                                    marginTop: '10px', backgroundColor: 'var(--accent-gold)', color: 'var(--bg-primary)',
                                    padding: '14px', borderRadius: '12px', border: 'none',
                                    fontWeight: '800', cursor: loading ? 'wait' : 'pointer', transition: '0.2s'
                                }}
                            >
                                {loading ? 'Saving Admin Account...' : 'Create Admin Account'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminAccountsSection;
