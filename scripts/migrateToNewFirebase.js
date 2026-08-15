import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, setDoc } from "firebase/firestore";

// Old Firebase Config
const oldConfig = {
  apiKey: "AIzaSyCioM3O_3T72CZgbSBDICBOcIx8guZpwig",
  authDomain: "attendace-863f6.firebaseapp.com",
  projectId: "attendace-863f6",
  storageBucket: "attendace-863f6.firebasestorage.app",
  messagingSenderId: "815990575525",
  appId: "1:815990575525:web:4347e05aae5ac4464fd84c",
  measurementId: "G-X47FX6JM33"
};

// New Firebase Config
const newConfig = {
  apiKey: "AIzaSyDXzeSElbY-N4h_aFT-k1tLDIYVVFZ70zI",
  authDomain: "attendace-a7258.firebaseapp.com",
  projectId: "attendace-a7258",
  storageBucket: "attendace-a7258.firebasestorage.app",
  messagingSenderId: "694091372107",
  appId: "1:694091372107:web:2b27eb290e951ff343dfce",
  measurementId: "G-T223QDE7S3"
};

const oldApp = initializeApp(oldConfig, "oldApp");
const oldDb = getFirestore(oldApp);

const newApp = initializeApp(newConfig, "newApp");
const newDb = getFirestore(newApp);

const COLLECTIONS = ["students", "attendance", "admins", "audit_logs"];

async function migrate() {
  console.log("=== STARTING FIRESTORE MIGRATION ===");
  console.log(`From OLD project (${oldConfig.projectId}) -> NEW project (${newConfig.projectId})\n`);

  for (const collectionName of COLLECTIONS) {
    console.log(`--- Processing collection: '${collectionName}' ---`);
    try {
      const oldColRef = collection(oldDb, collectionName);
      const snapshot = await getDocs(oldColRef);
      console.log(`Found ${snapshot.docs.length} documents in old '${collectionName}' collection.`);

      if (snapshot.empty) {
        console.log(`No documents found in '${collectionName}'. Skipping...`);
        continue;
      }

      let successCount = 0;
      let failCount = 0;
      const docs = snapshot.docs;
      const BATCH_SIZE = 30;

      for (let i = 0; i < docs.length; i += BATCH_SIZE) {
        const chunk = docs.slice(i, i + BATCH_SIZE);
        await Promise.all(chunk.map(async (docSnap) => {
          const docId = docSnap.id;
          const data = docSnap.data();
          try {
            const newDocRef = doc(newDb, collectionName, docId);
            await setDoc(newDocRef, data);
            successCount++;
          } catch (err) {
            console.error(`Failed to copy doc '${docId}' in '${collectionName}':`, err.message);
            failCount++;
          }
        }));
        console.log(`Uploaded ${Math.min(i + BATCH_SIZE, docs.length)}/${docs.length} in '${collectionName}'...`);
      }

      console.log(`✅ Collection '${collectionName}' completed: ${successCount} migrated, ${failCount} failed.\n`);
    } catch (err) {
      console.error(`Error processing collection '${collectionName}':`, err.message);
    }
  }

  console.log("=== MIGRATION COMPLETE ===");
}

migrate().then(() => {
  process.exit(0);
}).catch(err => {
  console.error("Migration error:", err);
  process.exit(1);
});
