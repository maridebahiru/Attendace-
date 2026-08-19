import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ID = 'attendace-a7258';

function parseFirestoreField(field) {
  if (!field) return '';
  if ('stringValue' in field) return field.stringValue;
  if ('integerValue' in field) return parseInt(field.integerValue, 10);
  if ('doubleValue' in field) return parseFloat(field.doubleValue);
  if ('booleanValue' in field) return field.booleanValue;
  if ('timestampValue' in field) return field.timestampValue;
  if ('nullValue' in field) return null;
  if ('mapValue' in field) {
    const res = {};
    const fields = field.mapValue.fields || {};
    for (const key of Object.keys(fields)) {
      res[key] = parseFirestoreField(fields[key]);
    }
    return res;
  }
  if ('arrayValue' in field) {
    const values = field.arrayValue.values || [];
    return values.map(v => parseFirestoreField(v));
  }
  return '';
}

function parseFirestoreDoc(doc) {
  const fields = doc.fields || {};
  const data = {};
  for (const key of Object.keys(fields)) {
    data[key] = parseFirestoreField(fields[key]);
  }
  const parts = doc.name.split('/');
  data._id = parts[parts.length - 1];
  data._createTime = doc.createTime;
  data._updateTime = doc.updateTime;
  return data;
}

async function fetchAllDocuments(collectionName) {
  let documents = [];
  let nextPageToken = '';
  
  do {
    let url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${collectionName}?pageSize=300`;
    if (nextPageToken) {
      url += `&pageToken=${nextPageToken}`;
    }
    try {
      const res = await fetch(url);
      const data = await res.json();
      if (data.documents) {
        documents.push(...data.documents.map(parseFirestoreDoc));
      }
      nextPageToken = data.nextPageToken || '';
    } catch (err) {
      console.error(`Error fetching collection ${collectionName}:`, err);
      break;
    }
  } while (nextPageToken);

  return documents;
}

function escapeCSV(val) {
  if (val === null || val === undefined) return '""';
  if (typeof val === 'object') {
    val = JSON.stringify(val);
  }
  return `"${String(val).replace(/"/g, '""')}"`;
}

async function runExport() {
  console.log(`🚀 Starting Database Export for migration from project: ${PROJECT_ID}...`);
  
  const [students, attendance] = await Promise.all([
    fetchAllDocuments('students'),
    fetchAllDocuments('attendance')
  ]);

  console.log(`📦 Fetched ${students.length} students and ${attendance.length} attendance records.`);

  // Create student maps
  const studentByPhone = {};
  const studentByEmpId = {};
  students.forEach(s => {
    if (s.phone) studentByPhone[s.phone] = s;
    if (s.employeeId) studentByEmpId[s.employeeId] = s;
  });

  const columns = [
    "Id",
    "student_id",
    "student_name",
    "phone",
    "employee_id",
    "id_no",
    "department",
    "date",
    "scanned_at",
    "scanned_by_email",
    "scanned_by",
    "device_info",
    "scanned_location",
    "created_at",
    "updated_at"
  ];

  // Map attendance records to migration schema
  const formattedAttendanceRows = attendance.map(a => {
    const student = studentByPhone[a.phone] || studentByEmpId[a.employeeId] || {};
    
    const locationObj = a.scannedLocation || null;
    const adminEmail = a.scannedByEmail || (locationObj && locationObj.adminUser) || '';

    return {
      "Id": a._id || '',
      "student_id": student._id || a.phone || '',
      "student_name": a.studentName || student.name || '',
      "phone": a.phone || student.phone || '',
      "employee_id": a.employeeId || student.employeeId || '',
      "id_no": a.idNo || student.idNo || student.employeeId || '',
      "department": a.department || student.department || 'General',
      "date": a.date || '',
      "scanned_at": a.scannedAt || a._createTime || '',
      "scanned_by_email": adminEmail,
      "scanned_by": a.scannedBy || '',
      "device_info": a.deviceInfo || '',
      "scanned_location": locationObj ? JSON.stringify(locationObj) : '',
      "created_at": a._createTime || a.scannedAt || '',
      "updated_at": a._updateTime || a.scannedAt || ''
    };
  });

  // Generate CSV for attendance
  const csvHeaders = columns.join(',');
  const csvLines = formattedAttendanceRows.map(row => 
    columns.map(col => escapeCSV(row[col])).join(',')
  );
  const attendanceCSVContent = [csvHeaders, ...csvLines].join('\n');

  const rootDir = path.resolve(__dirname, '..');
  const attendanceCsvPath = path.join(rootDir, 'attendance_migration_export.csv');
  const attendanceJsonPath = path.join(rootDir, 'attendance_migration_export.json');
  
  fs.writeFileSync(attendanceCsvPath, attendanceCSVContent, 'utf8');
  fs.writeFileSync(attendanceJsonPath, JSON.stringify(formattedAttendanceRows, null, 2), 'utf8');

  console.log(`✅ Saved Attendance Export CSV to: ${attendanceCsvPath}`);
  console.log(`✅ Saved Attendance Export JSON to: ${attendanceJsonPath}`);

  // Also create export for students in migration schema format
  const formattedStudentsRows = students.map(s => {
    return {
      "Id": s._id || s.phone || '',
      "student_id": s._id || s.phone || '',
      "student_name": s.name || '',
      "phone": s.phone || '',
      "employee_id": s.employeeId || '',
      "id_no": s.idNo || s.employeeId || '',
      "department": s.department || 'General',
      "date": '',
      "scanned_at": '',
      "scanned_by_email": '',
      "scanned_by": '',
      "device_info": '',
      "scanned_location": '',
      "created_at": s._createTime || '',
      "updated_at": s._updateTime || ''
    };
  });

  const studentCsvLines = formattedStudentsRows.map(row => 
    columns.map(col => escapeCSV(row[col])).join(',')
  );
  const studentCSVContent = [csvHeaders, ...studentCsvLines].join('\n');

  const studentsCsvPath = path.join(rootDir, 'students_migration_export.csv');
  const studentsJsonPath = path.join(rootDir, 'students_migration_export.json');

  fs.writeFileSync(studentsCsvPath, studentCSVContent, 'utf8');
  fs.writeFileSync(studentsJsonPath, JSON.stringify(formattedStudentsRows, null, 2), 'utf8');

  console.log(`✅ Saved Students Export CSV to: ${studentsCsvPath}`);
  console.log(`✅ Saved Students Export JSON to: ${studentsJsonPath}`);
  console.log(`🎉 DATABASE EXPORT COMPLETE!`);
}

runExport().catch(err => {
  console.error("Export failed:", err);
  process.exit(1);
});
