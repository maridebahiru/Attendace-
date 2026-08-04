import XLSX from 'xlsx';

const filePath = 'C:\\Users\\Mar\\Downloads\\_የ4ኛ ሱባዔ ጉባዔ መመዝገቢያ ቅፅ (Responses) (1).xlsx';

try {
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(sheet);
  
  console.log(`Sheet Name: ${sheetName}`);
  console.log(`Total Rows: ${data.length}`);
  if (data.length > 0) {
    console.log('Columns:', Object.keys(data[0]));
    console.log('Sample Row 1:', JSON.stringify(data[0], null, 2));
    if (data.length > 1) {
      console.log('Sample Row 2:', JSON.stringify(data[1], null, 2));
    }
  }
} catch (err) {
  console.error("Error reading file:", err);
}
