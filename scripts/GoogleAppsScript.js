/**
 * Google Apps Script for Google Form -> Firestore Sync
 * 
 * Setup Instructions:
 * 1. Open your Google Form or linked Google Sheet.
 * 2. Click Extensions > Apps Script.
 * 3. Replace the code in Code.gs with this script.
 * 4. Update FIREBASE_PROJECT_ID if needed.
 * 5. Add a trigger: Click Triggers (clock icon) > Add Trigger > Select 'onFormSubmit' function > Select event type 'On form submit'.
 */

const FIREBASE_PROJECT_ID = "attendace-67816";

function onFormSubmit(e) {
  try {
    let response;
    
    // Check if triggered by Form or Sheet
    if (e.response) {
      // Form response trigger
      const itemResponses = e.response.getItemResponses();
      response = {};
      itemResponses.forEach(itemResponse => {
        const title = itemResponse.getItem().getTitle().toLowerCase().trim();
        const value = itemResponse.getResponse();
        
        if (title.includes('name')) response.name = value;
        else if (title.includes('phone')) response.phone = value;
        else if (title.includes('id')) response.employeeId = value;
        else if (title.includes('department')) response.department = value;
        else if (title.includes('position')) response.position = value;
        else if (title.includes('email')) response.email = value;
        else if (title.includes('photo')) response.profilePhotoUrl = value;
      });
    } else if (e.namedValues) {
      // Sheet response trigger
      const nv = e.namedValues;
      response = {
        name: (nv['Full Name'] || nv['Name'] || nv['name'] || [''])[0],
        phone: (nv['Phone Number'] || nv['Phone'] || nv['phone'] || [''])[0],
        employeeId: (nv['Employee/Student ID'] || nv['Student ID'] || nv['Employee ID'] || nv['id'] || [''])[0],
        department: (nv['Department'] || nv['department'] || [''])[0],
        position: (nv['Position'] || nv['position'] || [''])[0],
        email: (nv['Email'] || nv['email'] || [''])[0],
        profilePhotoUrl: (nv['Profile Photo'] || nv['Profile Photo URL'] || nv['Photo'] || [''])[0]
      };
    } else {
      Logger.log("No form response data found.");
      return;
    }

    // Clean & validate phone number (doc ID)
    const rawPhone = String(response.phone || '').trim();
    if (!rawPhone) {
      Logger.log("Skipped: Empty phone number.");
      return;
    }
    const cleanPhone = rawPhone.replace(/[^\d+]/g, '');

    const employeeId = String(response.employeeId || '').trim();
    const name = String(response.name || '').trim();
    const department = String(response.department || 'General').trim();
    const position = String(response.position || '').trim();
    const email = String(response.email || '').trim();
    const profilePhotoUrl = String(response.profilePhotoUrl || '').trim();

    // Step 1: Check duplicate by phone doc ID
    const phoneUrl = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/students/${cleanPhone}`;
    const checkPhoneResponse = UrlFetchApp.fetch(phoneUrl, { muteHttpExceptions: true });
    
    if (checkPhoneResponse.getResponseCode() === 200) {
      Logger.log(`Skipped duplicate phone: ${cleanPhone}`);
      return;
    }

    // Step 2: Check duplicate by employeeId via RunQuery REST API
    if (employeeId) {
      const queryUrl = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents:runQuery`;
      const queryPayload = {
        structuredQuery: {
          from: [{ collectionId: 'students' }],
          where: {
            fieldFilter: {
              field: { fieldPath: 'employeeId' },
              op: 'EQUAL',
              value: { stringValue: employeeId }
            }
          }
        }
      };
      
      const queryResponse = UrlFetchApp.fetch(queryUrl, {
        method: 'POST',
        contentType: 'application/json',
        payload: JSON.stringify(queryPayload),
        muteHttpExceptions: true
      });
      
      if (queryResponse.getResponseCode() === 200) {
        const queryResults = JSON.parse(queryResponse.getContentText());
        const hasMatch = queryResults.some(res => res.document);
        if (hasMatch) {
          Logger.log(`Skipped duplicate employeeId: ${employeeId}`);
          return;
        }
      }
    }

    // Step 3: Insert new student doc (leaving qrToken unset until first login)
    const nowIso = new Date().toISOString();
    const fields = {
      name: { stringValue: name },
      phone: { stringValue: cleanPhone },
      idNo: { stringValue: employeeId || cleanPhone },
      employeeId: { stringValue: employeeId },
      department: { stringValue: department },
      position: { stringValue: position },
      email: { stringValue: email },
      profilePhotoUrl: { stringValue: profilePhotoUrl },
      createdAt: { timestampValue: nowIso }
    };

    const patchUrl = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/students/${cleanPhone}?currentDocument.exists=false`;
    
    const insertResponse = UrlFetchApp.fetch(patchUrl, {
      method: 'PATCH',
      contentType: 'application/json',
      payload: JSON.stringify({ fields }),
      muteHttpExceptions: true
    });

    Logger.log(`Sync status for ${cleanPhone}: ${insertResponse.getResponseCode()} - ${insertResponse.getContentText()}`);
  } catch (err) {
    Logger.log(`Error syncing to Firestore: ${err.message}`);
  }
}
