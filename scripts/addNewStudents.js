import fs from 'fs';
import path from 'path';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDXzeSElbY-N4h_aFT-k1tLDIYVVFZ70zI",
  authDomain: "attendace-a7258.firebaseapp.com",
  projectId: "attendace-a7258",
  storageBucket: "attendace-a7258.firebasestorage.app",
  messagingSenderId: "694091372107",
  appId: "1:694091372107:web:2b27eb290e951ff343dfce",
  measurementId: "G-T223QDE7S3"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const rawInput = [
  // Page 1
  { name: "Betlehem Nicola", phone: "0915753376" },
  { name: "Liyuwork Gezalegn", phone: "0947971050" },
  { name: "Rediet Ayelew", phone: "0942217889" },
  { name: "Elshaday Abrham", phone: "0904913015" },
  { name: "Hiwot Belay", phone: "0915739474" },
  { name: "Mihret Sntayehu", phone: "0929067676" },
  { name: "Maza Sisay", phone: "0946961705" },
  { name: "Serkalem derese", phone: "0943923455" },
  { name: "Samrawit Abebe", phone: "0941120576" },
  { name: "Nardos Leta", phone: "0977452623" },
  { name: "Matiyos Engeda", phone: "0936312361" },
  { name: "kudus yosef", phone: "0945593083" },
  { name: "Metasebiya Geremew", phone: "0977716707" },
  { name: "Metshafe Eyob", phone: "0991292671" },
  { name: "Mihret habte", phone: "0953004174" },
  { name: "Natnael Solomon", phone: "0945231653" },
  { name: "Tsion Kassahun", phone: "0915010099" },
  { name: "W/Inspector Helen Assefa", phone: "0915039949" },
  { name: "Henok TeJu", phone: "0913238098" },
  { name: "Esrom Efrem", phone: "0928414100" },
  { name: "Elshaday Belete", phone: "0978376889" },
  { name: "Feven Mirtayew", phone: "0973370275" },
  { name: "Yabsira Kasa", phone: "0946042927" },
  { name: "Fiker Getaneh", phone: "0923097081" },
  { name: "Amanuel Mulisa", phone: "0975817525" },
  { name: "Yordanos Kebede", phone: "0975721470" },
  { name: "Misiker Alemayhu", phone: "0932291905" },
  { name: "Mekdelawit Asefa", phone: "0940874063" },
  { name: "Yohanes Fikeru", phone: "0927802631" },
  { name: "Betelhaem Yenenh", phone: "0932417426" },
  { name: "Simon Alemayhu", phone: "0979681007" },
  { name: "D.n Nahome Seifu", phone: "0926519476" },
  { name: "yohanes Regasa", phone: "0938694178" },
  { name: "Habtamu Tezazu", phone: "0942995553" },
  { name: "Yamrot Kasahun", phone: "0920748715" },
  { name: "Solomon Mamo", phone: "0922802258" },
  { name: "Mebrate Adisu", phone: "0915750677" },
  { name: "Noren Lergese", phone: "0923265144" },
  { name: "Mehader Siyum", phone: "0902584888" },
  { name: "Sintayhu Abate", phone: "0986894600" },
  { name: "Tesfaye Biru", phone: "0939290171" },
  { name: "Urji Abebe", phone: "0924232356" },
  { name: "Mikiyas Tekalign", phone: "0992073265" },
  { name: "Biruk Amane", phone: "0951157862" },
  { name: "Lidiya Tilahun", phone: "0977875652" },
  { name: "Tsion Kassahun", phone: "0915010099" },

  // Page 2
  { name: "Danawit Mesfin", phone: "0915735288" },
  { name: "Hana Arega", phone: "0902583708" },
  { name: "Edlawit Feyisa", phone: "0978513493" },
  { name: "Mihret Getachew", phone: "0978392272" },
  { name: "Helen Bezabih", phone: "0942003071" },
  { name: "Bethlehem Yonas", phone: "0994857529" },
  { name: "Bemnet Muluken", phone: "0982421243" },
  { name: "Edlawit Asfaw", phone: "0940640128" },
  { name: "Mikiyas Wondossen", phone: "0994025808" },
  { name: "Lidet Bekele", phone: "0926537152" },
  { name: "Monica Lema", phone: "0924192088" },
  { name: "Mihret Biniyam", phone: "0904536759" },
  { name: "Bereket Demissie", phone: "0915735396" },
  { name: "Michael Wendyirad", phone: "0949582691" },
  { name: "Makida Ibrahim", phone: "0937770583" },
  { name: "Hermela Minda", phone: "0713882322" },
  { name: "Yodit Lema", phone: "0990960459" },
  { name: "Kalkidan Wondimu", phone: "0978726732" },
  { name: "Eyerus Takele", phone: "0939630456" },
  { name: "Mihretemariyam Abebaw", phone: "0944561019" },
  { name: "Lidiya Abraraw", phone: "0946499835" },
  { name: "Mahlet Girma", phone: "0924171845" },
  { name: "Kidist Mamush", phone: "0967872501" },
  { name: "Mahlet Tesfaye", phone: "0938934211" },
  { name: "Habtemaryam Teklay", phone: "0915016428" },
  { name: "Sintayhu Mekasha", phone: "0961956073" },
  { name: "Samuel Berhanu", phone: "0900475636" },
  { name: "Michael Abera", phone: "0968837572" },
  { name: "ሄኖክ ግርማ", phone: "0940597915" },
  { name: "ሜላት ገበየሁ", phone: "0991288052" },
  { name: "ናርዶስ ሳሟኤል", phone: "0977684865" },
  { name: "እጹብድንቅ በቀለ", phone: "0986385228" },
  { name: "ናትናኤል ሰለሞን", phone: "0945231653" },
  { name: "ጺሆን ካሳሁን", phone: "0915010099" },
  { name: "የአብ ስራ ተፈራ", phone: "0949503796" },
  { name: "ሆሳዕና በሉህ", phone: "0987907346" },
  { name: "ስንታየሁ", phone: "0956191360" },
  { name: "ፍጹም ጌትነት", phone: "0909440872" },
  { name: "ልዶ በረከት ዳኜ", phone: "0960609269" },
  { name: "መርሀዊት ጸጋብ", phone: "0977134964" },
  { name: "መታሰቢያ በቀለ", phone: "0924756131" },
  { name: "ቲና መስፍን", phone: "0988134368" },
  { name: "ምህረት ገ/መደን", phone: "0946041320" },

  // Page 3
  { name: "አማኑኤል አያልቅበት", phone: "0946001957" },
  { name: "ቃለአብ መልካሙ", phone: "0966383011" },
  { name: "እዩኤል ደረጀ", phone: "0921021433" },
  { name: "ኤፍራታ ወንድም አገኝ", phone: "0960958552" },
  { name: "ዮናስ ፍሰሃ", phone: "0915151759" },
  { name: "ሄለን አሰፋ", phone: "0915039949" },
  { name: "ያሬድ ደምስ", phone: "0973222744" },
  { name: "ዘሪሁን ባይሳ", phone: "0994030365" },
  { name: "ወርቅ አበብ ዘሪሁን", phone: "0987539356" },
  { name: "እየሩስ ልቡ", phone: "0973871979" },
  { name: "ገነት በቀለ", phone: "0915000522" },
  { name: "ሒወት መርከቡ", phone: "0986871715" },
  { name: "ሒሩት ግርማ", phone: "0909022916" },
  { name: "ናኒ ወይማ", phone: "0952752332" },
  { name: "አዲስ ግዛው", phone: "0986796550" },
  { name: "ዮናታን ታደሰ", phone: "0929163040" },
  { name: "ቃልኪዳን ዮሃነስ", phone: "0980295598" },
  { name: "ሰራዊት ጌታቸው", phone: "0920467975" },
  { name: "ናትናኤል ሶሎሞን", phone: "0945231653" },
  { name: "ቤተለሄም ሃይሉ", phone: "0976371158" },
  { name: "የአብስራ ፍቃዱ", phone: "0915664569" },
  { name: "ቃልኪዳን ግርማ", phone: "0973248379" },
  { name: "ናርዶስ ግርማ", phone: "0935628014" },
  { name: "ስመኝ ደጀኔ", phone: "0951422943" },
  { name: "ሆሳዕና ሺመልስ", phone: "0936360464" },
  { name: "ሳሮን ምንዳ", phone: "0943350903" },
  { name: "ስመኝ ታረቀኝ", phone: "0905755536" },
  { name: "ዮርዳኖስ ትዝታው", phone: "0991336261" },
  { name: "ሃቦን ነዲር", phone: "0915150094" },
  { name: "ሲሳይ ሞገስ", phone: "0915763640" },
  { name: "ከነዓን ሰሎሞን", phone: "0939161181" },
  { name: "ብሩክ በሃይሉ", phone: "0988709494" },
  { name: "ህዝቅያስ ወሰን", phone: "0948643904" },
  { name: "በእምነት የስማሸዋ", phone: "0968339353" },
  { name: "ማህደር ግርማ", phone: "0901581571" },
  { name: "ፍራኦል ጎንፋ", phone: "0915444988" },
  { name: "አዶንያስ የሺጥላ", phone: "0948593015" },
  { name: "አዛሪያ ኤፍሬም", phone: "0993972798" },
  { name: "ሜላት", phone: "0955787822" },
  { name: "ወገኔ መርጋ", phone: "0927162442" },

  // Page 4
  { name: "ኪሩቤል ግርማ", phone: "0969926074" }
];

async function run() {
  console.log("=== PROCESSING NEW STUDENTS ===");

  const jsonPath = path.resolve('public/students_746.json');
  let existingList = [];
  if (fs.existsSync(jsonPath)) {
    existingList = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  }
  console.log(`Loaded existing JSON with ${existingList.length} records.`);

  // Determine highest EJAT ID number
  let maxIdNum = 0;
  for (const st of existingList) {
    if (st.employeeId && st.employeeId.startsWith('EJAT-')) {
      const num = parseInt(st.employeeId.replace('EJAT-', ''), 10);
      if (!isNaN(num) && num > maxIdNum) {
        maxIdNum = num;
      }
    }
  }
  console.log(`Highest existing EJAT ID number: ${maxIdNum}`);

  // Deduplicate rawInput based on phone/name to avoid adding exact duplicates if repeated
  const uniqueItems = [];
  const seenKeys = new Set();

  for (const item of rawInput) {
    const key = `${item.name.toLowerCase()}_${item.phone}`;
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      uniqueItems.push(item);
    }
  }

  console.log(`Input items: ${rawInput.length}, Unique new entries: ${uniqueItems.length}`);

  let nextNum = maxIdNum + 1;
  const addedRecords = [];

  for (const item of uniqueItems) {
    const idStr = `EJAT-${String(nextNum).padStart(4, '0')}`;
    nextNum++;

    const studentRecord = {
      docId: idStr,
      employeeId: idStr,
      idNo: idStr,
      name: item.name,
      phone: item.phone,
      email: `${idStr.toLowerCase()}@ejat.org`,
      christianName: "",
      educationLevel: "",
      position: "",
      department: "General",
      sundaySchoolMember: "",
      profilePhotoUrl: "",
      hearFrom: "",
      remark: ""
    };

    addedRecords.push(studentRecord);
  }

  console.log(`Generated ${addedRecords.length} new student records starting from ${addedRecords[0].employeeId} to ${addedRecords[addedRecords.length - 1].employeeId}`);

  // 1. Upload to Firestore
  console.log("\n=== UPLOADING NEW STUDENTS TO FIRESTORE ===");
  let firestoreSuccess = 0;
  let firestoreFail = 0;

  const BATCH_SIZE = 25;
  for (let i = 0; i < addedRecords.length; i += BATCH_SIZE) {
    const batch = addedRecords.slice(i, i + BATCH_SIZE);
    await Promise.all(batch.map(async (st) => {
      try {
        const docRef = doc(db, 'students', st.employeeId);
        await setDoc(docRef, st);
        firestoreSuccess++;
      } catch (err) {
        console.error(`Failed to add doc ${st.employeeId}:`, err.message);
        firestoreFail++;
      }
    }));
  }

  console.log(`✅ Firestore upload complete: ${firestoreSuccess} success, ${firestoreFail} failed.`);

  // 2. Append to public JSON file
  existingList.push(...addedRecords);
  fs.writeFileSync(jsonPath, JSON.stringify(existingList, null, 2), 'utf8');
  console.log(`✅ Updated ${jsonPath} (Total records now: ${existingList.length}).`);

}

run().then(() => {
  process.exit(0);
}).catch(err => {
  console.error("Error adding students:", err);
  process.exit(1);
});
