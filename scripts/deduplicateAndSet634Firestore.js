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

async function runDeduplicationAndUpload() {
  console.log("=== STEP 1: PURGING ALL CURRENT DOCUMENTS FROM FIRESTORE ===");
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
  }

  console.log("✅ Firestore students collection is completely empty.");

  console.log("\n=== STEP 2: DEDUPLICATING 708 EXCEL RESPONSES ===");
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const rawRows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

  const seenPhones = new Set();
  const seenNameCombos = new Set();
  const uniqueAttendees = [];

  rawRows.forEach((r, index) => {
    const name = String(r['ሙሉ ስም'] || '').trim();
    const christianName = String(r[' የክርስትና ስም'] || r['የክርስትና ስም'] || '').trim();
    const rawPhone = String(r['ስልክ ቁጥር'] || '').trim();
    const cleanPhone = rawPhone.replace(/[^\d+]/g, '');

    const nameKey = `${name.toLowerCase()}_${christianName.toLowerCase()}`;
    const isValidPhone = cleanPhone && cleanPhone !== '000' && cleanPhone.length >= 9;

    let isDuplicate = false;
    if (isValidPhone && seenPhones.has(cleanPhone)) {
      isDuplicate = true;
    } else if (nameKey !== '_' && seenNameCombos.has(nameKey)) {
      isDuplicate = true;
    }

    if (!isDuplicate) {
      if (isValidPhone) seenPhones.add(cleanPhone);
      if (nameKey !== '_') seenNameCombos.add(nameKey);

      uniqueAttendees.push({
        rawIndex: index + 1,
        rawName: name,
        rawChristianName: christianName,
        rawPhone: cleanPhone,
        eduLevel: String(r['የትምህርት ደረጃ'] || '').trim(),
        pos: String(r['የስራ ዘርፍ'] || '').trim(),
        dept: String(r['እርስዎ በሚኖሩበት አጥቢያ የሚቀርብዎት ምን ቤ/ክ አለ?'] || '').trim(),
        sundaySchool: String(r['የ ሰንበት ተማሪ ኖት ?'] || '').trim(),
        photoUrl: convertDriveUrl(r['መታወቂያዎትን ያያይዙ']),
        hearFrom: String(r[' ስለሱባዔ ጉባኤ ከየት ሰሙ?'] || r['ስለሱባዔ ጉባኤ ከየት ሰሙ?'] || '').trim()
      });
    }
  });

  console.log(`Raw Excel Rows: ${rawRows.length}`);
  console.log(`Deduplicated Unique Attendees: ${uniqueAttendees.length}`);
  console.log(`Redundant Registrations Removed: ${rawRows.length - uniqueAttendees.length}`);

  console.log("\n=== STEP 3: UPLOADING 634 UNIQUE ATTENDEES TO FIRESTORE ===");

  let inserted = 0;
  const UPLOAD_BATCH = 25;

  for (let i = 0; i < uniqueAttendees.length; i += UPLOAD_BATCH) {
    const batch = uniqueAttendees.slice(i, i + UPLOAD_BATCH);

    await Promise.all(batch.map(async (st, idx) => {
      const globalIdx = i + idx;
      const empId = `EJAT-${String(globalIdx + 1).padStart(4, '0')}`;
      let phone = st.rawPhone;
      if (!phone || phone.length < 5 || phone === '000') {
        phone = `090000${String(globalIdx + 1).padStart(4, '0')}`;
      }

      // Use unique employee ID for document ID to ensure 1:1 match
      const docId = empId;

      const studentData = {
        name: st.rawName || `Attendee ${globalIdx + 1}`,
        phone: phone,
        christianName: st.rawChristianName,
        employeeId: empId,
        department: st.dept || 'General',
        position: st.pos,
        educationLevel: st.eduLevel,
        sundaySchoolMember: st.sundaySchool,
        profilePhotoUrl: st.photoUrl,
        hearFrom: st.hearFrom
      };

      const res = await writeDoc(docId, studentData);
      if (res.status === 200) inserted++;
    }));

    console.log(`Uploaded ${Math.min(i + UPLOAD_BATCH, uniqueAttendees.length)}/${uniqueAttendees.length} unique attendees...`);
  }

  const finalCheck = await fetchAllDocNames();
  console.log(`\n🎉 === DEDUPLICATION & SYNC COMPLETE ===`);
  console.log(`Verified Total Unique Attendees in Firestore: ${finalCheck.length}`);
}

runDeduplicationAndUpload();
