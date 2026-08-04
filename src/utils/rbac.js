import { db } from '../firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export const ROLES = {
    ADMIN: 'admin',
    SUPERADMIN: 'superadmin'
};

export const getAuthenticatedAdmin = () => {
    try {
        const stored = sessionStorage.getItem('adminUser');
        if (!stored) return null;
        return JSON.parse(stored);
    } catch (e) {
        return null;
    }
};

export const getUserRole = () => {
    const admin = getAuthenticatedAdmin();
    if (!admin || !admin.role) return null;
    return String(admin.role).toLowerCase();
};

export const isSuperAdmin = () => {
    return getUserRole() === ROLES.SUPERADMIN;
};

export const isAdminOrSuperAdmin = () => {
    const role = getUserRole();
    return role === ROLES.ADMIN || role === ROLES.SUPERADMIN;
};

export const checkPermission = (actionType) => {
    const role = getUserRole();
    
    // Default to deny all if unknown or missing role
    if (!role) {
        return { 
            allowed: false, 
            reason: "Access denied. Role is missing or invalid.", 
            minRole: "ADMIN" 
        };
    }

    // Read/Scan actions allowed for both ADMIN and SUPER ADMIN
    const readScanActions = ['view_users', 'search_users', 'read_users', 'scan_qr', 'view_overview', 'view_analytics'];
    if (readScanActions.includes(actionType)) {
        return { allowed: true };
    }

    // Standard Admin is restricted strictly to read-only user scanning
    if (role === ROLES.ADMIN) {
        return { 
            allowed: false, 
            reason: "This action requires Super Admin privileges.", 
            minRole: "SUPER ADMIN" 
        };
    }

    // Super Admin has full access
    if (role === ROLES.SUPERADMIN) {
        return { allowed: true };
    }

    return { 
        allowed: false, 
        reason: "Access denied. Role permission unauthorized.", 
        minRole: "SUPER ADMIN" 
    };
};

export const logSuperAdminAudit = async (action, details) => {
    const admin = getAuthenticatedAdmin();
    const auditEntry = {
        action,
        details,
        performedBy: admin?.username || admin?.name || 'Super Admin',
        timestamp: new Date().toISOString()
    };
    console.log('[RBAC AUDIT LOG]', auditEntry);
    try {
        await addDoc(collection(db, 'audit_logs'), {
            ...auditEntry,
            createdAt: serverTimestamp()
        });
    } catch (e) {
        console.warn('Could not save audit log to Firestore:', e);
    }
};
