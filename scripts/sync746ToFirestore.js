import fs from 'fs';
import path from 'path';

const PROJECT_ID = 'attendace-a7258';
const jsonPath = path.resolve('public/students_746.json');

async function fetchAllDocNames() {
  let allDocNames = [];
  let nextPageToken = null;

  do {
    let url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/students?pageSize=300`;
    if (nextPageToken) {
      url += `&pageToken=${encodeURIComponent(nextPageToken)}`;
    }

    try {
      const res = await fetch(url);
      const json = await res.json();
      const docs = json.documents || [];
      const names = docs.map(d => d.name);
      allDocNames.push(...names);
      nextPageToken = json.nextPageToken || null;
    } catch (e) {
      console.error("Error fetching doc page:", e);
      break;
    }
  } while (nextPageToken);

  return allDocNames;
}

async function deleteDoc(fullDocPath) {
  const parts = fullDocPath.split('/');
  const docId = parts[parts.length - 1];
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/students/${encodeURIComponent(docId)}`;
  try {
    await fetch(url, { method: 'DELETE' });
  } catch (e) {
    console.error(`Error deleting ${docId}:`, e);
  }
}

async function writeDoc(docId, student) {
  const fields = {
    name: { stringValue: student.name || '' },
    phone: { stringValue: student.phone || '' },
    christianName: { stringValue: student.christianName || '' },
    employeeId: { stringValue: student.employeeId || '' },
    idNo: { stringValue: student.employeeId || student.phone || '' },
    department: { stringValue: student.department || 'General' },
    position: { stringValue: student.position || '' },
    educationLevel: { stringValue: student.educationLevel || '' },
    sundaySchoolMember: { stringValue: student.sundaySchoolMember || '' },
    profilePhotoUrl: { stringValue: student.profilePhotoUrl || '' },
    hearFrom: { stringValue: student.hearFrom || '' }
  };

  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/students/${encodeURIComponent(docId)}`;

  try {
    const res = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields })
    });
    return { status: res.status };
  } catch (err) {
    return { status: 500, error: err.message };
  }
}

async function sync746Students() {
  console.log("=== STEP 1: READING 746 STUDENTS DATA ===");
  if (!fs.existsSync(jsonPath)) {
    console.error("students_746.json not found!");
    return;
  }
  const students = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  console.log(`Loaded ${students.length} students from ${jsonPath}`);

  console.log("\n=== STEP 2: PURGING ALL EXISTING FIRESTORE DOCUMENTS ===");
  let docNames = await fetchAllDocNames();
  console.log(`Found ${docNames.length} existing student documents in Firestore.`);

  let attempts = 0;
  while (docNames.length > 0 && attempts < 5) {
    attempts++;
    console.log(`Purge Pass ${attempts}: Deleting ${docNames.length} documents...`);
    const BATCH_SIZE = 30;
    for (let i = 0; i < docNames.length; i += BATCH_SIZE) {
      const chunk = docNames.slice(i, i + BATCH_SIZE);
      await Promise.all(chunk.map(deleteDoc));
    }
    docNames = await fetchAllDocNames();
    console.log(`Pass ${attempts} complete. Remaining documents: ${docNames.length}`);
  }

  console.log("\n=== STEP 3: UPLOADING 746 STUDENTS (EJAT-0001 TO EJAT-0746) ===");
  let inserted = 0;
  const UPLOAD_BATCH = 25;

  for (let i = 0; i < students.length; i += UPLOAD_BATCH) {
    const batch = students.slice(i, i + UPLOAD_BATCH);
    await Promise.all(batch.map(async (st) => {
      const docId = st.employeeId;
      const res = await writeDoc(docId, st);
      if (res.status === 200) inserted++;
    }));

    console.log(`Uploaded ${Math.min(i + UPLOAD_BATCH, students.length)}/${students.length} records...`);
  }

  const finalDocs = await fetchAllDocNames();
  console.log(`\n🎉 === SYNC COMPLETE ===`);
  console.log(`Total Student Documents in Firestore: ${finalDocs.length}`);
}

sync746Students();
