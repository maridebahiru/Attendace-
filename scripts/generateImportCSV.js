import XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';

const filePath = 'C:\\Users\\Mar\\Downloads\\_የ4ኛ ሱባዔ ጉባዔ መመዝገቢያ ቅፅ (Responses) (1).xlsx';
const outputPath = path.resolve('users_import.csv');

try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const rawData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    console.log(`Processing ${rawData.length} rows from Excel file...`);

    const escapeCsv = (val) => `"${String(val || '').replace(/"/g, '""').trim()}"`;

    const formattedRows = rawData.map((row, index) => {
        const name = String(row['ሙሉ ስም'] || '').trim();
        const christianName = String(row[' የክርስትና ስም'] || row['የክርስትና ስም'] || '').trim();
        const phone = String(row['ስልክ ቁጥር'] || '').trim();
        const education = String(row['የትምህርት ደረጃ'] || '').trim();
        const work = String(row['የስራ ዘርፍ'] || '').trim();
        const church = String(row['እርስዎ በሚኖሩበት አጥቢያ የሚቀርብዎት ምን ቤ/ክ አለ?'] || '').trim();
        const isSundayStudent = String(row['የ ሰንበት ተማሪ ኖት ?'] || '').trim();
        const idPhotoUrl = String(row['መታወቂያዎትን ያያይዙ'] || '').trim();
        const hearFrom = String(row[' ስለሱባዔ ጉባኤ ከየት ሰሙ?'] || row['ስለሱባዔ ጉባኤ ከየት ሰሙ?'] || '').trim();

        const formId = phone && phone !== '000' ? phone : `FORM-${1000 + index}`;
        const email = `${formId.replace(/[^a-zA-Z0-9]/g, '')}@ejat.org`.toLowerCase();

        return [
            escapeCsv(formId),
            escapeCsv(name || `User ${index + 1}`),
            escapeCsv(email),
            escapeCsv('user'),
            escapeCsv(phone),
            escapeCsv(christianName),
            escapeCsv(education),
            escapeCsv(work),
            escapeCsv(church),
            escapeCsv(isSundayStudent),
            escapeCsv(idPhotoUrl),
            escapeCsv(hearFrom)
        ].join(',');
    });

    const csvHeader = 'form_id,name,email,role,phone,christian_name,education,work,church,is_sunday_student,id_photo_url,hear_from\n';
    const csvContent = csvHeader + formattedRows.join('\n');

    fs.writeFileSync(outputPath, csvContent, 'utf8');

    console.log(`\n✅ Generated ${outputPath} with ${rawData.length} rows and all 12 columns!`);
} catch (err) {
    console.error("Error generating CSV:", err);
}
