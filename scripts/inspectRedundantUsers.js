import XLSX from 'xlsx';

const filePath = 'C:\\Users\\Mar\\Downloads\\_የ4ኛ ሱባዔ ጉባዔ መመዝገቢያ ቅፅ (Responses) (1).xlsx';

try {
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

  console.log(`Total Raw Rows in Excel: ${rows.length}`);

  const seenPhones = new Set();
  const seenNameCombos = new Set();
  const uniqueUsers = [];
  const duplicates = [];

  rows.forEach((r, index) => {
    const name = String(r['ሙሉ ስም'] || '').trim().toLowerCase();
    const christianName = String(r[' የክርስትና ስም'] || r['የክርስትና ስም'] || '').trim().toLowerCase();
    const rawPhone = String(r['ስልክ ቁጥር'] || '').trim();
    const cleanPhone = rawPhone.replace(/[^\d+]/g, '');

    const nameKey = `${name}_${christianName}`;
    const isValidPhone = cleanPhone && cleanPhone !== '000' && cleanPhone.length >= 9;

    let isDuplicate = false;
    if (isValidPhone && seenPhones.has(cleanPhone)) {
      isDuplicate = true;
    } else if (nameKey !== '_' && seenNameCombos.has(nameKey)) {
      isDuplicate = true;
    }

    if (isDuplicate) {
      duplicates.push({ index: index + 1, name: r['ሙሉ ስም'], phone: cleanPhone, christianName: r[' የክርስትና ስም'] });
    } else {
      if (isValidPhone) seenPhones.add(cleanPhone);
      if (nameKey !== '_') seenNameCombos.add(nameKey);
      uniqueUsers.push({ index: index + 1, ...r });
    }
  });

  console.log(`\nUnique Users Count: ${uniqueUsers.length}`);
  console.log(`Redundant/Duplicate Users Count: ${duplicates.length}`);
  console.log('\nSample Duplicates Removed:', duplicates.slice(0, 10));

} catch (err) {
  console.error("Error inspecting duplicates:", err);
}
