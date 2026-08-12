/**
 * Native IndexedDB Offline Storage Manager for Attendance System.
 *
 * Database: AttendanceDB (v1)
 * Stores:
 *  - `students`: Local cache of student records for instant offline lookup.
 *  - `pendingAttendance`: Queue of check-in records captured offline waiting to sync.
 *  - `checkedIn`: Local index of checked-in attendees to prevent duplicate scans offline & online.
 *  - `appMeta`: Key-value metadata store (e.g., lastSyncTime).
 */

const DB_NAME = 'AttendanceDB';
const DB_VERSION = 1;

let dbPromise = null;

export const openDB = () => {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB is not supported in this environment.'));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // 1. Student List Store
      if (!db.objectStoreNames.contains('students')) {
        const studentStore = db.createObjectStore('students', { keyPath: 'primaryKey' });
        studentStore.createIndex('phone', 'phone', { unique: false });
        studentStore.createIndex('employeeId', 'employeeId', { unique: false });
        studentStore.createIndex('qrToken', 'qrToken', { unique: false });
      }

      // 2. Pending Attendance Queue Store
      if (!db.objectStoreNames.contains('pendingAttendance')) {
        db.createObjectStore('pendingAttendance', { keyPath: 'docId' });
      }

      // 3. Checked-In Index Store (for offline & online duplicate prevention)
      if (!db.objectStoreNames.contains('checkedIn')) {
        db.createObjectStore('checkedIn', { keyPath: 'idKey' });
      }

      // 4. App Metadata Store
      if (!db.objectStoreNames.contains('appMeta')) {
        db.createObjectStore('appMeta', { keyPath: 'key' });
      }
    };

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onerror = (event) => {
      console.error('[IndexedDB] Failed to open database:', event.target.error);
      reject(event.target.error);
    };
  });

  return dbPromise;
};

/**
 * Saves/updates the full list of students in local IndexedDB storage.
 */
export const saveStudentsLocal = async (studentsList) => {
  try {
    const db = await openDB();
    const tx = db.transaction('students', 'readwrite');
    const store = tx.objectStore('students');

    // Clear old student store entries to remain up-to-date
    store.clear();

    studentsList.forEach((s) => {
      const primaryKey = String(s.docId || s.phone || s.employeeId || s.idNo || Math.random()).trim();
      store.put({
        ...s,
        primaryKey,
        phone: String(s.phone || '').trim(),
        employeeId: String(s.employeeId || s.idNo || '').trim(),
        qrToken: String(s.qrToken || '').trim()
      });
    });

    await new Promise((res, rej) => {
      tx.oncomplete = res;
      tx.onerror = () => rej(tx.error);
    });

    await setMeta('lastStudentsSync', new Date().toISOString());
    console.log(`[IndexedDB] Cached ${studentsList.length} students locally.`);
    return true;
  } catch (err) {
    console.error('[IndexedDB] saveStudentsLocal error:', err);
    return false;
  }
};

/**
 * Retrieves cached students list from IndexedDB.
 */
export const getStudentsLocal = async () => {
  try {
    const db = await openDB();
    const tx = db.transaction('students', 'readonly');
    const store = tx.objectStore('students');
    const req = store.getAll();

    return await new Promise((res, rej) => {
      req.onsuccess = () => res(req.result || []);
      req.onerror = () => rej(req.error);
    });
  } catch (err) {
    console.error('[IndexedDB] getStudentsLocal error:', err);
    return [];
  }
};

/**
 * Checks if student is already marked checked in today in IndexedDB `checkedIn` store.
 */
export const isAlreadyCheckedInLocal = async (studentId, dateStr) => {
  if (!studentId || !dateStr) return false;
  const key = `${String(studentId).trim()}_${dateStr}`;
  try {
    const db = await openDB();
    const tx = db.transaction('checkedIn', 'readonly');
    const store = tx.objectStore('checkedIn');
    const req = store.get(key);

    const record = await new Promise((res, rej) => {
      req.onsuccess = () => res(req.result);
      req.onerror = () => rej(req.error);
    });

    return !!record;
  } catch (err) {
    console.error('[IndexedDB] isAlreadyCheckedInLocal error:', err);
    return false;
  }
};

/**
 * Marks a student as checked in today in local IndexedDB `checkedIn` store.
 */
export const markCheckedInLocal = async (studentId, dateStr, name = '') => {
  if (!studentId || !dateStr) return;
  const key = `${String(studentId).trim()}_${dateStr}`;
  try {
    const db = await openDB();
    const tx = db.transaction('checkedIn', 'readwrite');
    const store = tx.objectStore('checkedIn');
    store.put({ idKey: key, studentId, date: dateStr, name, timestamp: Date.now() });

    await new Promise((res, rej) => {
      tx.oncomplete = res;
      tx.onerror = () => rej(tx.error);
    });
  } catch (err) {
    console.error('[IndexedDB] markCheckedInLocal error:', err);
  }
};

/**
 * Queues an attendance check-in record into IndexedDB `pendingAttendance` store.
 */
export const queuePendingAttendance = async (docId, recordData) => {
  try {
    const db = await openDB();
    const tx = db.transaction('pendingAttendance', 'readwrite');
    const store = tx.objectStore('pendingAttendance');
    const item = {
      docId,
      data: recordData,
      createdAt: Date.now()
    };
    store.put(item);

    await new Promise((res, rej) => {
      tx.oncomplete = res;
      tx.onerror = () => rej(tx.error);
    });

    // Also mark checked-in locally to prevent double scanning
    if (recordData.phone) {
      await markCheckedInLocal(recordData.phone, recordData.date, recordData.studentName);
    }
    if (recordData.employeeId) {
      await markCheckedInLocal(recordData.employeeId, recordData.date, recordData.studentName);
    }

    console.log('[IndexedDB] Queued pending attendance record:', docId);
    return true;
  } catch (err) {
    console.error('[IndexedDB] queuePendingAttendance error:', err);
    return false;
  }
};

/**
 * Fetches all queued pending attendance records.
 */
export const getPendingAttendanceQueue = async () => {
  try {
    const db = await openDB();
    const tx = db.transaction('pendingAttendance', 'readonly');
    const store = tx.objectStore('pendingAttendance');
    const req = store.getAll();

    return await new Promise((res, rej) => {
      req.onsuccess = () => res(req.result || []);
      req.onerror = () => rej(req.error);
    });
  } catch (err) {
    console.error('[IndexedDB] getPendingAttendanceQueue error:', err);
    return [];
  }
};

/**
 * Removes a single successfully synced record from IndexedDB `pendingAttendance` store.
 */
export const removePendingAttendance = async (docId) => {
  try {
    const db = await openDB();
    const tx = db.transaction('pendingAttendance', 'readwrite');
    const store = tx.objectStore('pendingAttendance');
    store.delete(docId);

    await new Promise((res, rej) => {
      tx.oncomplete = res;
      tx.onerror = () => rej(tx.error);
    });

    console.log('[IndexedDB] Removed synced record from queue:', docId);
    return true;
  } catch (err) {
    console.error('[IndexedDB] removePendingAttendance error:', err);
    return false;
  }
};

/**
 * Sets a key-value metadata record in `appMeta`.
 */
export const setMeta = async (key, value) => {
  try {
    const db = await openDB();
    const tx = db.transaction('appMeta', 'readwrite');
    const store = tx.objectStore('appMeta');
    store.put({ key, value });
    await new Promise((res, rej) => {
      tx.oncomplete = res;
      tx.onerror = () => rej(tx.error);
    });
  } catch (err) {
    console.error('[IndexedDB] setMeta error:', err);
  }
};

/**
 * Gets a metadata value from `appMeta`.
 */
export const getMeta = async (key) => {
  try {
    const db = await openDB();
    const tx = db.transaction('appMeta', 'readonly');
    const store = tx.objectStore('appMeta');
    const req = store.get(key);

    const record = await new Promise((res, rej) => {
      req.onsuccess = () => res(req.result);
      req.onerror = () => rej(req.error);
    });

    return record ? record.value : null;
  } catch (err) {
    console.error('[IndexedDB] getMeta error:', err);
    return null;
  }
};
