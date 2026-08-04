import XLSX from 'xlsx';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nrrpqkqkztbbvgwnaguh.supabase.co';
const supabaseKey = 'sb_publishable_33zO-E4C0wcaKf-Zb6iOiQ_fAhQj6pi';

const supabase = createClient(supabaseUrl, supabaseKey);

const filePath = path.resolve('_የ4ኛ ሱባዔ ጉባዔ መመዝገቢያ ቅፅ (Responses).xlsx');

async function uploadToSupabase() {
    console.log("Reading Excel file...");
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const rawData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    console.log(`Found ${rawData.length} rows to upload.`);

    const formattedRows = rawData.map((row, index) => {
        const name = String(row['ሙሉ ስም'] || '').trim();
        const phone = String(row['ስልክ ቁጥር'] || '').trim();

        // Form ID strategy: use phone number or generated ID if empty/000
        const formId = phone && phone !== '000' ? phone : `FORM-${1000 + index}`;
        // Email fallback using phone or formId
        const email = `${formId.replace(/[^a-zA-Z0-9]/g, '')}@ejat.org`.toLowerCase();

        return {
            form_id: formId,
            name: name || `User ${index + 1}`,
            email: email,
            role: 'user'
        };
    }).filter(r => r.name);

    console.log(`Uploading ${formattedRows.length} user records to Supabase table 'users'...`);

    // Batch insert in chunks of 50
    const chunkSize = 50;
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < formattedRows.length; i += chunkSize) {
        const chunk = formattedRows.slice(i, i + chunkSize);
        const { data, error } = await supabase
            .from('users')
            .upsert(chunk, { onConflict: 'email' });

        if (error) {
            console.error(`Chunk ${Math.floor(i / chunkSize) + 1} upload error:`, error.message);
            errorCount += chunk.length;
        } else {
            successCount += chunk.length;
            console.log(`Successfully uploaded batch ${Math.floor(i / chunkSize) + 1} (${chunk.length} records). Progress: ${successCount}/${formattedRows.length}`);
        }
    }

    console.log(`\n🎉 Upload Summary: Successfully uploaded ${successCount} records to Supabase! Errors: ${errorCount}`);
}

uploadToSupabase().catch(err => {
    console.error("Fatal upload error:", err);
});
