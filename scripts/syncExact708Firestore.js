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

async function getAllDocs() {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/students?pageSize=3000`;
  try {
    const res = await fetch(url);
    const json = await res.json();
    return json.documents || [];
  } catch (e) {
    console.error("Error fetching docs:", e);
    return [];
  }
}

async function deleteDoc(docName) {
  const url = `https://firestore.googleapis.com/v1/${docName}`;
  try {
    await fetch(url, { method: 'DELETE' });
  } catch (e) {
    console.error(`Error deleting ${docName}:`, e);
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

async function syncExact708() {
  console.log("1. Fetching all current Firestore student documents...");
  const currentDocs = await getAllDocs();
  console.log(`Found ${currentDocs.length} existing documents in Firestore.`);

  if (currentDocs.length > 0) {
    console.log("Cleaning up old/duplicate documents from Firestore...");
    const deletePromises = currentDocs.map(d => deleteDoc(d.name));
    await Promise.all(deletePromises);
    console.log("Finished deleting old documents.");
  }

  console.log("\n2. Reading Excel file...");
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

  console.log(`Uploading exact ${rows.length} records to Firestore...`);

  let inserted = 0;
  const BATCH_SIZE = 25;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    
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
      // Unique document ID per row to preserve exact count of 708
      const docId = empId;

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

    console.log(`Synced ${Math.min(i + BATCH_SIZE, rows.length)}/${rows.length} records...`);
  }

  console.log(`\n🎉 --- SYNC COMPLETE ---`);
  console.log(`Total Firestore Student Documents: ${inserted}`);
}

syncExact708();
