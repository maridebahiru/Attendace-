import XLSX from 'xlsx';

const filePath = 'C:\\Users\\Mar\\Downloads\\_የ4ኛ ሱባዔ ጉባዔ መመዝገቢያ ቅፅ (Responses) (1).xlsx';
const PROJECT_ID = 'attendace-67816';

function convertDriveUrl(url) {
  if (!url || typeof url !== 'string') return '';
  const match = url.match(/id=([a-zA-Z0-9_-]+)/);
  if (match && match[1]) {
    return `https://drive.google.com/uc?export=view&id=${match[1]}`;
  }
  return url.trim();
}

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
  // fullDocPath is e.g. "projects/attendace-67816/databases/(default)/documents/students/xyz"
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
    idNo: { stringValue: student.phone || student.employeeId || '' },
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

async function cleanPurgeAndSetExact708() {
  console.log("=== STEP 1: PURGING ALL EXISTING DOCUMENTS ===");
  let docNames = await fetchAllDocNames();
  console.log(`Found total ${docNames.length} existing documents in Firestore.`);

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

  console.log("\n=== STEP 2: UPLOADING EXACT 708 UNIQUE ATTENDEES (EJAT-0001 TO EJAT-0708) ===");
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

  console.log(`Uploading exact ${rows.length} rows to Firestore...`);

  let inserted = 0;
  const UPLOAD_BATCH = 25;

  for (let i = 0; i < rows.length; i += UPLOAD_BATCH) {
    const batch = rows.slice(i, i + UPLOAD_BATCH);

    await Promise.all(batch.map(async (r, idx) => {
      const globalIdx = i + idx;
      const rawName = (r['ሙሉ ስም'] || '').toString().trim();
      const rawChristianName = (r[' የክርስትና ስም'] || r['የክርስትና ስም'] || '').toString().trim();
      const rawPhone = (r['ስልክ ቁጥር'] || '').toString().trim();
      const eduLevel = (r['የትምህርት ደረጃ'] || '').toString().trim();
      const pos = (r['የስራ ዘርፍ'] || '').toString().trim();
      const dept = (r['እርስዎ በሚኖሩበት አጥቢያ የሚቀርብዎት ምን ቤ/ክ አለ?'] || '').toString().trim();
      const sundaySchool = (r['የ ሰንበት ተማሪ ኖት ?'] || '').toString().trim();
      const photoUrl = convertDriveUrl(r['መታወቂያዎትን ያያይዙ']);
      const hearFrom = (r[' ስለሱባዔ ጉባኤ ከየት ሰሙ?'] || r['ስለሱባዔ ጉባኤ ከየት ሰሙ?'] || '').toString().trim();

      let cleanPhone = rawPhone.replace(/[^\d+]/g, '');
      if (!cleanPhone || cleanPhone.length < 5 || cleanPhone === '000') {
        cleanPhone = `090000${String(globalIdx + 1).padStart(4, '0')}`;
      }

      const empId = `EJAT-${String(globalIdx + 1).padStart(4, '0')}`;
      const docId = empId; // Unique doc ID EJAT-0001 to EJAT-0708

      const studentData = {
        name: rawName || `Attendee ${globalIdx + 1}`,
        phone: cleanPhone,
        christianName: rawChristianName,
        employeeId: empId,
        department: dept || 'General',
        position: pos,
        educationLevel: eduLevel,
        sundaySchoolMember: sundaySchool,
        profilePhotoUrl: photoUrl,
        hearFrom: hearFrom
      };

      const res = await writeDoc(docId, studentData);
      if (res.status === 200) inserted++;
    }));

    console.log(`Sync Progress: ${Math.min(i + UPLOAD_BATCH, rows.length)}/${rows.length} records...`);
  }

  // Verification step
  const finalDocs = await fetchAllDocNames();
  console.log(`\n🎉 === FINAL VERIFICATION COMPLETE ===`);
  console.log(`Total Student Documents in Firestore: ${finalDocs.length}`);
}

cleanPurgeAndSetExact708();
