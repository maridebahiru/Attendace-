import { db } from '../firebase/config';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';

/**
 * Generates an opaque random QR token.
 */
export const generateQrToken = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `QR_${crypto.randomUUID().replace(/-/g, '')}`;
  }
  const rand = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  return `QR_${Date.now()}_${rand}`;
};

/**
 * Ensures that the student document has a permanent qrToken.
 * If qrToken is missing, generates one and updates Firestore.
 * Returns the updated student object.
 */
export const ensureQrToken = async (student) => {
  if (!student || !student.phone) return student;

  if (student.qrToken) {
    return student;
  }

  const newToken = generateQrToken();
  try {
    const studentRef = doc(db, 'students', student.phone);
    await updateDoc(studentRef, { qrToken: newToken });
    return { ...student, qrToken: newToken };
  } catch (err) {
    console.error('Failed to update qrToken:', err);
    return { ...student, qrToken: newToken };
  }
};

/**
 * Searches for a student by Phone Number OR Employee/Student ID.
 */
export const getStudentByIdentifier = async (identifier) => {
  if (!identifier) return null;
  const term = String(identifier).trim();

  // 1. Check direct doc lookup by doc ID (e.g. EJAT-0001)
  try {
    const phoneRef = doc(db, 'students', term);
    const phoneSnap = await getDoc(phoneRef);
    if (phoneSnap.exists()) {
      const data = phoneSnap.data();
      return { docId: phoneSnap.id, ...data, phone: data.phone || data.employeeId || phoneSnap.id };
    }
  } catch (e) {
    console.log('Direct doc lookup skipped');
  }

  // 2. Query by phone field
  const studentsCol = collection(db, 'students');
  const phoneQuery = query(studentsCol, where('phone', '==', term));
  const phoneDocs = await getDocs(phoneQuery);
  if (!phoneDocs.empty) {
    const docSnap = phoneDocs.docs[0];
    const data = docSnap.data();
    return { docId: docSnap.id, ...data, phone: data.phone || data.employeeId || docSnap.id };
  }

  // 3. Query by employeeId field
  const empQuery = query(studentsCol, where('employeeId', '==', term));
  const empDocs = await getDocs(empQuery);
  if (!empDocs.empty) {
    const docSnap = empDocs.docs[0];
    const data = docSnap.data();
    return { docId: docSnap.id, ...data, phone: data.phone || data.employeeId || docSnap.id };
  }

  // 4. Query by idNo field (fallback)
  const idNoQuery = query(studentsCol, where('idNo', '==', term));
  const idNoDocs = await getDocs(idNoQuery);
  if (!idNoDocs.empty) {
    const docSnap = idNoDocs.docs[0];
    const data = docSnap.data();
    return { docId: docSnap.id, ...data, phone: data.phone || data.employeeId || docSnap.id };
  }

  return null;
};

/**
 * Searches for a student by permanent qrToken.
 */
export const getStudentByQrToken = async (qrToken) => {
  if (!qrToken) return null;
  const studentsCol = collection(db, 'students');
  const tokenQuery = query(studentsCol, where('qrToken', '==', String(qrToken).trim()));
  const tokenDocs = await getDocs(tokenQuery);

  if (!tokenDocs.empty) {
    const docSnap = tokenDocs.docs[0];
    return { phone: docSnap.id, ...docSnap.data() };
  }
  return null;
};
