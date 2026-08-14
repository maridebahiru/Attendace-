import fs from 'fs';
import path from 'path';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDocs, collection, deleteDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCioM3O_3T72CZgbSBDICBOcIx8guZpwig",
  authDomain: "attendace-863f6.firebaseapp.com",
  projectId: "attendace-863f6",
  storageBucket: "attendace-863f6.firebasestorage.app",
  messagingSenderId: "815990575525",
  appId: "1:815990575525:web:4347e05aae5ac4464fd84c",
  measurementId: "G-X47FX6JM33"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const jsonPath = path.resolve('public/students_746.json');

async function push746() {
  console.log("=== STEP 1: READING LOCAL 746 STUDENTS DATA ===");
  if (!fs.existsSync(jsonPath)) {
    console.error(`File not found: ${jsonPath}`);
    return;
  }
  const students = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  console.log(`Loaded ${students.length} student records from ${jsonPath}`);

  console.log("\n=== STEP 2: CHECKING CURRENT FIRESTORE DOCUMENTS ===");
  const studentsCol = collection(db, 'students');
  const existingSnap = await getDocs(studentsCol);
  console.log(`Found ${existingSnap.docs.length} existing documents in 'students' collection.`);

  if (existingSnap.docs.length > 0) {
    console.log("Deleting old documents...");
    const BATCH_SIZE = 30;
    for (let i = 0; i < existingSnap.docs.length; i += BATCH_SIZE) {
      const chunk = existingSnap.docs.slice(i, i + BATCH_SIZE);
      await Promise.all(chunk.map(d => deleteDoc(d.ref)));
    }
    console.log("Purge finished.");
  }

  console.log("\n=== STEP 3: UPLOADING ALL 746 STUDENTS TO FIRESTORE ===");
  let successCount = 0;
  let failCount = 0;
  const UPLOAD_BATCH = 25;

  for (let i = 0; i < students.length; i += UPLOAD_BATCH) {
    const batch = students.slice(i, i + UPLOAD_BATCH);
    await Promise.all(batch.map(async (st) => {
      const docId = st.employeeId;
      const docRef = doc(db, 'students', docId);

      const fields = {
        name: st.name || '',
        phone: st.phone || '',
        christianName: st.christianName || '',
        employeeId: st.employeeId || '',
        idNo: st.employeeId || st.phone || '',
        department: st.department || 'General',
        position: st.position || '',
        educationLevel: st.educationLevel || '',
        sundaySchoolMember: st.sundaySchoolMember || '',
        profilePhotoUrl: st.profilePhotoUrl || '',
        hearFrom: st.hearFrom || '',
        remark: st.remark || ''
      };

      try {
        await setDoc(docRef, fields);
        successCount++;
      } catch (err) {
        console.error(`Failed to write ${docId}:`, err.message);
        failCount++;
      }
    }));

    console.log(`Uploaded ${Math.min(i + UPLOAD_BATCH, students.length)}/${students.length} records...`);
  }

  console.log("\n=== STEP 4: ENSURING DEFAULT SUPER ADMIN ACCOUNT ===");
  try {
    const adminRef = doc(db, 'admins', 'default_superadmin');
    await setDoc(adminRef, {
      username: 'maramawitdereje93@gmail.com',
      password: 'maramawitdereje93@gmail.com',
      role: 'superadmin',
      name: 'Super Administrator',
      createdAt: new Date().toISOString()
    });
    console.log("✅ Super Admin account created in 'admins' collection.");
  } catch (e) {
    console.warn("Could not create admin doc:", e.message);
  }

  console.log(`\n🎉 === UPLOAD SUMMARY ===`);
  console.log(`Successfully written: ${successCount}`);
  console.log(`Failed: ${failCount}`);

  // Final verification check
  const verifySnap = await getDocs(studentsCol);
  console.log(`Final Firestore count: ${verifySnap.docs.length} documents.`);
}

push746().then(() => {
  console.log("Process complete.");
  process.exit(0);
}).catch(err => {
  console.error("Fatal upload error:", err.message);
  process.exit(1);
});
