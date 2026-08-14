import { isSuperAdmin, getAuthenticatedAdmin } from './rbac';

export const VENUE_CONFIG = {
    NAME: "Ethio-Italy Poli Technic College",
    LATITUDE: 9.607964,
    LONGITUDE: 41.840291,
    MAX_RADIUS_METERS: 300 // Configurable radius (300 meters for campus)
};

/**
 * Haversine formula to calculate distance between two points in meters.
 */
export const calculateHaversineDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371000; // Earth radius in meters
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c); // Distance in meters
};

/**
 * Check if current admin session is verified or bypassed.
 */
export const isLocationVerifiedSession = () => {
    if (isSuperAdmin()) return true;
    return sessionStorage.getItem('adminLocationVerified') === 'true';
};

/**
 * Mark location as verified for the current session.
 */
export const setLocationVerifiedSession = (coordsData) => {
    sessionStorage.setItem('adminLocationVerified', 'true');
    if (coordsData) {
        sessionStorage.setItem('adminLocationData', JSON.stringify(coordsData));
    }
};

/**
 * Clear location verification on logout.
 */
export const clearLocationSession = () => {
    sessionStorage.removeItem('adminLocationVerified');
    sessionStorage.removeItem('adminLocationData');
};

/**
 * Get audit log object to embed in attendance scan documents.
 */
export const getLocationAuditLog = () => {
    const admin = getAuthenticatedAdmin();
    if (isSuperAdmin()) {
        return {
            venue: VENUE_CONFIG.NAME,
            latitude: null,
            longitude: null,
            distanceMeters: null,
            status: "SuperAdmin Bypassed",
            adminRole: "superadmin",
            adminUser: admin?.username || admin?.name || 'Super Admin',
            timestamp: new Date().toISOString()
        };
    }

    try {
        const stored = sessionStorage.getItem('adminLocationData');
        if (stored) {
            const parsed = JSON.parse(stored);
            return {
                venue: VENUE_CONFIG.NAME,
                latitude: parsed.latitude,
                longitude: parsed.longitude,
                distanceMeters: parsed.distanceMeters,
                status: "Verified Venue Location",
                adminRole: "admin",
                adminUser: admin?.username || admin?.name || 'Admin',
                timestamp: new Date().toISOString()
            };
        }
    } catch (e) {}

    return {
        venue: VENUE_CONFIG.NAME,
        latitude: null,
        longitude: null,
        distanceMeters: null,
        status: "Location Session Active",
        adminRole: "admin",
        adminUser: admin?.username || admin?.name || 'Admin',
        timestamp: new Date().toISOString()
    };
};

/**
 * Perform Geolocation check against venue coordinates.
 */
export const verifyAdminLocation = () => {
    return new Promise((resolve) => {
        // 1. Super Admin bypass check
        if (isSuperAdmin()) {
            setLocationVerifiedSession({ bypassed: true });
            return resolve({
                allowed: true,
                bypassed: true,
                message: "Super Admin location bypass active."
            });
        }

        // 2. Already verified in current session check
        if (sessionStorage.getItem('adminLocationVerified') === 'true') {
            try {
                const cached = JSON.parse(sessionStorage.getItem('adminLocationData') || '{}');
                return resolve({
                    allowed: true,
                    bypassed: false,
                    distanceMeters: cached.distanceMeters || 0,
                    latitude: cached.latitude,
                    longitude: cached.longitude
                });
            } catch (e) {
                return resolve({ allowed: true, bypassed: false });
            }
        }

        // 3. Geolocation API check
        if (typeof navigator === 'undefined' || !navigator.geolocation) {
            return resolve({
                allowed: false,
                errorType: 'UNSUPPORTED',
                message: "Geolocation is not supported by your browser device."
            });
        }

        const options = {
            enableHighAccuracy: true,
            timeout: 12000, // 12-second timeout
            maximumAge: 60000
        };

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const userLat = position.coords.latitude;
                const userLng = position.coords.longitude;

                const distance = calculateHaversineDistance(
                    userLat, userLng,
                    VENUE_CONFIG.LATITUDE, VENUE_CONFIG.LONGITUDE
                );

                const isWithinRange = distance <= VENUE_CONFIG.MAX_RADIUS_METERS;
                const locationPayload = {
                    latitude: userLat,
                    longitude: userLng,
                    distanceMeters: distance,
                    timestamp: new Date().toISOString()
                };

                if (isWithinRange) {
                    setLocationVerifiedSession(locationPayload);
                    resolve({
                        allowed: true,
                        bypassed: false,
                        distanceMeters: distance,
                        latitude: userLat,
                        longitude: userLng
                    });
                } else {
                    resolve({
                        allowed: false,
                        errorType: 'OUT_OF_RANGE',
                        distanceMeters: distance,
                        latitude: userLat,
                        longitude: userLng,
                        message: `You must be at ${VENUE_CONFIG.NAME} to access the admin panel.`
                    });
                }
            },
            (error) => {
                let errorType = 'UNKNOWN';
                let message = "An error occurred while fetching your location.";

                if (error.code === error.PERMISSION_DENIED) {
                    errorType = 'PERMISSION_DENIED';
                    message = "Location permission was denied. Please allow location access in browser settings to proceed.";
                } else if (error.code === error.POSITION_UNAVAILABLE) {
                    errorType = 'POSITION_UNAVAILABLE';
                    message = "Location information is unavailable. Please ensure GPS / Location services are enabled.";
                } else if (error.code === error.TIMEOUT) {
                    errorType = 'TIMEOUT';
                    message = "GPS location request timed out. Click retry to attempt location resolution again.";
                }

                resolve({
                    allowed: false,
                    errorType,
                    message
                });
            },
            options
        );
    });
};
