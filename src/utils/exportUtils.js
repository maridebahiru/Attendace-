import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Filter students & attendance records based on Date Range and Department.
 */
export const filterReportData = ({ students, attendance, startDate, endDate, department }) => {
  let filteredStudents = [...students];
  if (department && department !== 'All') {
    filteredStudents = filteredStudents.filter(s => (s.department || 'Unassigned') === department);
  }

  const allowedPhones = new Set(filteredStudents.map(s => s.phone));

  let filteredAttendance = attendance.filter(a => allowedPhones.has(a.phone));

  if (startDate) {
    filteredAttendance = filteredAttendance.filter(a => a.date >= startDate);
  }
  if (endDate) {
    filteredAttendance = filteredAttendance.filter(a => a.date <= endDate);
  }

  return { filteredStudents, filteredAttendance };
};

/**
 * Prepare flat report rows for export.
 */
export const prepareReportRows = (filteredStudents, filteredAttendance) => {
  const studentMap = {};
  filteredStudents.forEach(s => {
    studentMap[s.phone] = s;
  });

  return filteredAttendance.map((a, index) => {
    const s = studentMap[a.phone] || {};
    let scannedAtStr = '';
    if (a.scannedAt?.toDate) {
      scannedAtStr = a.scannedAt.toDate().toLocaleTimeString();
    } else if (a.scannedAt) {
      scannedAtStr = String(a.scannedAt);
    }

    return {
      '#': index + 1,
      'Name': a.studentName || s.name || 'N/A',
      'Employee ID': a.employeeId || s.employeeId || s.idNo || 'N/A',
      'Phone': a.phone || 'N/A',
      'Department': a.department || s.department || 'N/A',
      'Position': s.position || 'N/A',
      'Date': a.date || 'N/A',
      'Time': scannedAtStr || 'N/A',
      'Scanned By': a.scannedBy || 'Admin',
      'Device Info': a.deviceInfo || 'Desktop Browser'
    };
  });
};

/**
 * Export report as CSV.
 */
export const exportToCSV = ({ students, attendance, startDate, endDate, department }) => {
  const { filteredStudents, filteredAttendance } = filterReportData({ students, attendance, startDate, endDate, department });
  const rows = prepareReportRows(filteredStudents, filteredAttendance);

  if (rows.length === 0) {
    alert("No records found matching the selected filters.");
    return;
  }

  const headers = Object.keys(rows[0]).join(',');
  const csvLines = rows.map(r => Object.values(r).map(val => `"${String(val).replace(/"/g, '""')}"`).join(','));
  const csvContent = [headers, ...csvLines].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  const fileDate = new Date().toISOString().split('T')[0];
  link.download = `attendance_report_${fileDate}.csv`;
  link.click();
};

/**
 * Export report as Excel (.xlsx).
 */
export const exportToExcel = ({ students, attendance, startDate, endDate, department }) => {
  const { filteredStudents, filteredAttendance } = filterReportData({ students, attendance, startDate, endDate, department });
  const rows = prepareReportRows(filteredStudents, filteredAttendance);

  if (rows.length === 0) {
    alert("No records found matching the selected filters.");
    return;
  }

  // Summary sheet data
  const summaryData = filteredStudents.map(s => {
    const studentScans = filteredAttendance.filter(a => a.phone === s.phone);
    return {
      'Name': s.name || 'N/A',
      'Employee ID': s.employeeId || s.idNo || 'N/A',
      'Phone': s.phone || 'N/A',
      'Department': s.department || 'N/A',
      'Position': s.position || 'N/A',
      'Email': s.email || 'N/A',
      'Total Days Attended': studentScans.length
    };
  });

  const wb = XLSX.utils.book_new();

  const logsWs = XLSX.utils.json_to_sheet(rows);
  const summaryWs = XLSX.utils.json_to_sheet(summaryData);

  XLSX.utils.book_append_sheet(wb, logsWs, "Attendance Logs");
  XLSX.utils.book_append_sheet(wb, summaryWs, "Student Directory & Summary");

  const fileDate = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `attendance_report_${fileDate}.xlsx`);
};

/**
 * Export report as PDF using jsPDF & autoTable.
 */
export const exportToPDF = ({ students, attendance, startDate, endDate, department }) => {
  const { filteredStudents, filteredAttendance } = filterReportData({ students, attendance, startDate, endDate, department });
  const rows = prepareReportRows(filteredStudents, filteredAttendance);

  if (rows.length === 0) {
    alert("No records found matching the selected filters.");
    return;
  }

  const doc = new jsPDF('landscape');

  // Title
  doc.setFontSize(16);
  doc.setTextColor(101, 8, 27); // #65081b
  doc.text("Attendance Analytics Report", 14, 18);

  doc.setFontSize(10);
  doc.setTextColor(100);
  const filterDesc = `Generated: ${new Date().toLocaleString()} | Dept: ${department || 'All'} | Range: ${startDate || 'Start'} to ${endDate || 'Latest'}`;
  doc.text(filterDesc, 14, 25);

  // Table Columns
  const tableColumn = ["#", "Name", "Emp ID", "Phone", "Department", "Date", "Time", "Scanned By"];
  const tableRows = rows.map(r => [
    r['#'], r['Name'], r['Employee ID'], r['Phone'], r['Department'], r['Date'], r['Time'], r['Scanned By']
  ]);

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 30,
    theme: 'grid',
    headStyles: { fillColor: [101, 8, 27], textColor: [211, 162, 0], fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 3 }
  });

  const fileDate = new Date().toISOString().split('T')[0];
  doc.save(`attendance_report_${fileDate}.pdf`);
};
