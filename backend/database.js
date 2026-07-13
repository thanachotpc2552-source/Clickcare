const fs = require('fs');
const path = require('path');
const { db: firestore } = require('./firebase');
const { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where,
  limit
} = require('firebase/firestore');

const usersFilePath = path.join(__dirname, '..', 'data', 'users.json');
const doctorsFilePath = path.join(__dirname, '..', 'data', '6. ระบบนัดพบแพทย์ (Healthcare)', 'doctors.json');
const appointmentsFilePath = path.join(__dirname, '..', 'data', '6. ระบบนัดพบแพทย์ (Healthcare)', 'appointments.json');

const medicalDictionary = {
  "Chest pain": { code: "I20.9", desc: "Angina pectoris, unspecified", allergies: "None", prescription: [{ name: "Aspirin 81mg", dosage: "1 tablet daily after breakfast" }, { name: "Nitroglycerin 0.4mg", dosage: "1 tablet sublingually every 5 minutes as needed for chest pain (max 3 doses)" }] },
  "Headache": { code: "G44.20", desc: "Tension-type headache, unspecified", allergies: "None", prescription: [{ name: "Paracetamol 500mg", dosage: "1-2 tablets every 4-6 hours as needed for headache (max 8 tablets/day)" }] },
  "Flu symptoms": { code: "J11.1", desc: "Influenza due to unidentified influenza virus with other respiratory manifestations", allergies: "Penicillin", prescription: [{ name: "Paracetamol 500mg", dosage: "1 tablet every 6 hours for fever" }, { name: "Chlorpheniramine 4mg", dosage: "1 tablet bedtime for runny nose" }, { name: "Oseltamivir 75mg", dosage: "1 capsule twice daily for 5 days" }] },
  "Stomach ache": { code: "K30", desc: "Functional dyspepsia", allergies: "None", prescription: [{ name: "Antacid Tablet", dosage: "Chew 1-2 tablets 1 hour after meals and bedtime" }, { name: "Omeprazole 20mg", dosage: "1 capsule 30 minutes before breakfast" }] },
  "Allergy": { code: "T78.40", desc: "Allergy, unspecified", allergies: "Sulfa drugs", prescription: [{ name: "Cetirizine 10mg", dosage: "1 tablet once daily before bedtime" }, { name: "Hydrocortisone 1% Cream", dosage: "Apply thin layer to affected area twice daily" }] },
  "Pregnancy checkup": { code: "Z34.90", desc: "Encounter for supervision of normal pregnancy, unspecified trimester", allergies: "None", prescription: [{ name: "Prenatal Multivitamins", dosage: "1 tablet daily after breakfast" }, { name: "Folic Acid 5mg", dosage: "1 tablet daily" }] },
  "Back pain": { code: "M54.5", desc: "Low back pain", allergies: "None", prescription: [{ name: "Ibuprofen 400mg", dosage: "1 tablet three times daily after meals" }, { name: "Eperisone 50mg", dosage: "1 tablet three times daily after meals" }] },
  "Skin rash": { code: "L30.9", desc: "Dermatitis, unspecified", allergies: "None", prescription: [{ name: "Loratadine 10mg", dosage: "1 tablet once daily" }, { name: "Triamcinolone 0.1% Cream", dosage: "Apply thin layer twice daily" }] },
  "Vision problem": { code: "H52.1", desc: "Myopia", allergies: "None", prescription: [{ name: "Artificial Tears Drops", dosage: "Instill 1 drop in both eyes 4 times daily as needed" }] },
  "Anxiety": { code: "F41.1", desc: "Generalized anxiety disorder", allergies: "None", prescription: [{ name: "Sertraline 50mg", dosage: "1/2 tablet daily after breakfast for 7 days, then increase to 1 tablet daily" }] },
  "Dizziness": { code: "R42", desc: "Dizziness and giddiness", allergies: "None", prescription: [{ name: "Dimenhydrinate 50mg", dosage: "1 tablet every 8 hours as needed for dizziness" }] },
  "Sore throat": { code: "J02.9", desc: "Acute pharyngitis, unspecified", allergies: "None", prescription: [{ name: "Decomin Lozenges", dosage: "Dissolve 1 lozenge slowly in mouth every 2-3 hours" }, { name: "Amoxicillin 500mg", dosage: "1 capsule twice daily for 5 days" }] },
  "Acne": { code: "L70.0", desc: "Acne vulgaris", allergies: "None", prescription: [{ name: "Clindamycin 1% Gel", dosage: "Apply thin layer to affected area twice daily" }, { name: "Benzoyl Peroxide 5% Gel", dosage: "Apply to acne spots once daily before bedtime" }] },
  "Sleep disorder": { code: "G47.0", desc: "Insomnia, unspecified", allergies: "None", prescription: [{ name: "Melatonin 5mg", dosage: "1 tablet 30 minutes before bedtime" }] },
  "Toothache": { code: "K08.8", desc: "Other specified disorders of teeth and supporting structures", allergies: "None", prescription: [{ name: "Mefenamic Acid 500mg", dosage: "1 tablet three times daily after meals as needed for toothache" }, { name: "Chlorhexidine 0.12% Mouthwash", dosage: "Rinse mouth with 15 ml for 30 seconds twice daily" }] },
  "Vaccination": { code: "Z23", desc: "Encounter for immunization", allergies: "None", prescription: [{ name: "Paracetamol 500mg", dosage: "1 tablet every 6 hours as needed for arm pain or fever" }] },
  "Annual Checkup": { code: "Z00.00", desc: "Encounter for general adult medical examination without abnormal findings", allergies: "None", prescription: [] }
};

// ── SQLite-to-Firestore Query Adapter ─────────────────────────────────────────
const dbAdapter = {
  get: async function(sql, params, callback) {
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }
    const safeCallback = callback || (() => {});
    try {
      const cleanSql = sql.replace(/\s+/g, ' ').trim();

      if (cleanSql.includes("SELECT * FROM users WHERE email = ? AND password = ?")) {
        const [email, pwd] = params;
        const q = query(collection(firestore, "users"), where("email", "==", email), where("password", "==", pwd), limit(1));
        const snap = await getDocs(q);
        if (snap.empty) return safeCallback(null, null);
        return safeCallback(null, snap.docs[0].data());
      }

      if (cleanSql.includes("SELECT * FROM users WHERE email = ?")) {
        const [email] = params;
        const q = query(collection(firestore, "users"), where("email", "==", email), limit(1));
        const snap = await getDocs(q);
        if (snap.empty) return safeCallback(null, null);
        return safeCallback(null, snap.docs[0].data());
      }

      if (cleanSql.includes("SELECT COUNT(*) as count FROM users WHERE user_id LIKE 'u%'") || cleanSql.includes("SELECT COUNT(*) as count FROM users")) {
        const snap = await getDocs(collection(firestore, "users"));
        return safeCallback(null, { count: snap.size });
      }

      if (cleanSql.includes("SELECT * FROM users WHERE user_id = ?")) {
        const [userId] = params;
        const docRef = doc(firestore, "users", userId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          return safeCallback(null, docSnap.data());
        }
        return safeCallback(null, null);
      }

      if (cleanSql.includes("SELECT * FROM doctors WHERE doctor_id = ?")) {
        const [docId] = params;
        const docRef = doc(firestore, "doctors", docId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          const langs = Array.isArray(data.languages) ? data.languages : [data.languages || 'Thai'];
          return safeCallback(null, {
            ...data,
            languages: JSON.stringify(langs),
            appointment_count: data.appointment_count ?? (data.experience ? data.experience * 32 : 120)
          });
        }
        return safeCallback(null, null);
      }

      if (cleanSql.includes("SELECT COUNT(*) as count FROM appointments")) {
        const snap = await getDocs(collection(firestore, "appointments"));
        return safeCallback(null, { count: snap.size });
      }

      if (cleanSql.includes("SELECT COUNT(*) as count FROM medical_records")) {
        const snap = await getDocs(collection(firestore, "medical_records"));
        return safeCallback(null, { count: snap.size });
      }

      if (cleanSql.includes("SELECT * FROM appointments WHERE apt_id = ?")) {
        const [aptId] = params;
        const docSnap = await getDoc(doc(firestore, "appointments", aptId));
        if (docSnap.exists()) return safeCallback(null, docSnap.data());
        return safeCallback(null, null);
      }

      if (cleanSql.includes("FROM appointments") && cleanSql.includes("WHERE a.apt_id = ?")) {
        const [aptId] = params;
        const docSnap = await getDoc(doc(firestore, "appointments", aptId));
        if (docSnap.exists()) {
          const a = docSnap.data();
          const userSnap = await getDoc(doc(firestore, "users", a.user_id));
          const doctorSnap = await getDoc(doc(firestore, "doctors", a.doctor_id));
          const u = userSnap.exists() ? userSnap.data() : {};
          const d = doctorSnap.exists() ? doctorSnap.data() : {};
          
          return safeCallback(null, {
            ...a,
            doctor_name: d.name || 'Unknown Doctor',
            department: d.department || 'General Medicine',
            hospital: d.hospital || 'Central Hospital',
            fee: d.fee || 500,
            user_name: u.name || 'Unknown Patient',
            user_email: u.email || '',
            user_phone: u.phone || ''
          });
        }
        return safeCallback(null, null);
      }

      console.warn("[Firestore Adapter] Unsupported GET query:", sql);
      return safeCallback(new Error("Query not supported by adapter"), null);

    } catch (e) {
      return safeCallback(e, null);
    }
  },

  all: async function(sql, params, callback) {
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }
    const safeCallback = callback || (() => {});
    try {
      const cleanSql = sql.replace(/\s+/g, ' ').trim();

      if (cleanSql.includes("SELECT * FROM users")) {
        const snap = await getDocs(collection(firestore, "users"));
        const results = snap.docs.map(d => d.data());
        return safeCallback(null, results);
      }

      if (cleanSql.includes("SELECT * FROM doctors WHERE 1=1")) {
        const snap = await getDocs(collection(firestore, "doctors"));
        const results = snap.docs.map(d => {
          const data = d.data();
          const langs = Array.isArray(data.languages) ? data.languages : [data.languages || 'Thai'];
          return {
            ...data,
            languages: JSON.stringify(langs),
            appointment_count: data.appointment_count ?? (data.experience ? data.experience * 32 : 120)
          };
        });
        
        let filtered = results;
        let pIndex = 0;
        
        if (sql.includes("AND (name LIKE ? OR department LIKE ? OR hospital LIKE ?)")) {
          const wildcard = params[pIndex].replace(/%/g, '').toLowerCase();
          pIndex += 3;
          filtered = filtered.filter(d => 
            d.name.toLowerCase().includes(wildcard) ||
            d.department.toLowerCase().includes(wildcard) ||
            d.hospital.toLowerCase().includes(wildcard)
          );
        }
        if (sql.includes("AND department = ?")) {
          const dept = params[pIndex++];
          filtered = filtered.filter(d => d.department === dept);
        }
        if (sql.includes("AND hospital = ?")) {
          const hosp = params[pIndex++];
          filtered = filtered.filter(d => d.hospital === hosp);
        }
        if (sql.includes("AND languages LIKE ?")) {
          const lang = params[pIndex++].replace(/%/g, '').toLowerCase();
          filtered = filtered.filter(d => 
            d.languages.toLowerCase().includes(lang)
          );
        }
        if (sql.includes("AND availability LIKE ?")) {
          const avail = params[pIndex++].replace(/%/g, '').toLowerCase();
          filtered = filtered.filter(d => d.availability.toLowerCase().includes(avail));
        }

        return safeCallback(null, filtered);
      }

      // Emulate Joins and full list queries from React app (Dashboard/Appointments page)
      if (cleanSql.includes("FROM appointments") || cleanSql.includes("SELECT a.*")) {
        const snap = await getDocs(collection(firestore, "appointments"));
        let results = snap.docs.map(d => d.data());

        const usersSnap = await getDocs(collection(firestore, "users"));
        const doctorsSnap = await getDocs(collection(firestore, "doctors"));
        const usersMap = {};
        const docsMap = {};
        usersSnap.forEach(d => { usersMap[d.id] = d.data(); });
        doctorsSnap.forEach(d => { docsMap[d.id] = d.data(); });

        results = results.map(a => ({
          ...a,
          doctor_name: docsMap[a.doctor_id]?.name || 'Unknown Doctor',
          department: docsMap[a.doctor_id]?.department || 'General Medicine',
          hospital: docsMap[a.doctor_id]?.hospital || 'Central Hospital',
          fee: docsMap[a.doctor_id]?.fee || 500,
          patient_name: usersMap[a.user_id]?.name || 'Unknown Patient',
          user_name: usersMap[a.user_id]?.name || 'Unknown Patient',
          user_allergies: usersMap[a.user_id]?.allergies || 'None',
          user_chronic_conditions: usersMap[a.user_id]?.chronic_conditions || 'None'
        }));

        // Filter parameters
        let filtered = results;
        let paramIdx = 0;
        
        if (sql.includes("a.user_id = ?") || sql.includes("user_id = ?")) {
          const uid = params[paramIdx++];
          filtered = filtered.filter(a => a.user_id === uid);
        } else if (sql.includes("a.doctor_id = ?") || sql.includes("doctor_id = ?")) {
          const did = params[paramIdx++];
          filtered = filtered.filter(a => a.doctor_id === did);
        }
        if (sql.includes("a.date LIKE ?")) {
          const datePrefix = params[paramIdx++]?.replace(/%/g, '');
          if (datePrefix) filtered = filtered.filter(a => a.date?.startsWith(datePrefix));
        }
        if (sql.includes("a.status = ?")) {
          const st = params[paramIdx++];
          filtered = filtered.filter(a => a.status === st);
        }
        
        // Sort by date descending
        filtered.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
        
        return safeCallback(null, filtered);
      }

      if (cleanSql.includes("FROM medical_records") || cleanSql.includes("SELECT mr.*")) {
        const snap = await getDocs(collection(firestore, "medical_records"));
        let results = snap.docs.map(d => d.data());

        const usersSnap = await getDocs(collection(firestore, "users"));
        const doctorsSnap = await getDocs(collection(firestore, "doctors"));
        const usersMap = {};
        const docsMap = {};
        usersSnap.forEach(d => { usersMap[d.id] = d.data(); });
        doctorsSnap.forEach(d => { docsMap[d.id] = d.data(); });

        results = results.map(mr => ({
          ...mr,
          doctor_name: docsMap[mr.doctor_id]?.name || 'Unknown Doctor',
          department: docsMap[mr.doctor_id]?.department || 'General Medicine',
          patient_name: usersMap[mr.user_id]?.name || 'Unknown Patient',
          user_name: usersMap[mr.user_id]?.name || 'Unknown Patient'
        }));

        let filtered = results;
        if (sql.includes("mr.user_id = ?") || sql.includes("user_id = ?")) {
          filtered = filtered.filter(mr => mr.user_id === params[0]);
        } else if (sql.includes("mr.doctor_id = ?") || sql.includes("doctor_id = ?")) {
          filtered = filtered.filter(mr => mr.doctor_id === params[0]);
        }

        return safeCallback(null, filtered);
      }

      console.warn("[Firestore Adapter] Unsupported ALL query:", sql);
      return safeCallback(null, []);

    } catch (e) {
      return safeCallback(e, null);
    }
  },

  run: async function(sql, params, callback) {
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }
    const safeCallback = callback || (() => {});
    try {
      const cleanSql = sql.replace(/\s+/g, ' ').trim();

      // D. Update loyalty points (+50)
      if (cleanSql.includes("UPDATE users SET loyalty_points = loyalty_points + 50")) {
        const [userId] = params;
        const ref = doc(firestore, "users", userId);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const currentPts = snap.data().loyalty_points || 0;
          await setDoc(ref, {
            ...snap.data(),
            loyalty_points: currentPts + 50
          });
          return safeCallback.call({ changes: 1 }, null);
        }
        return safeCallback.call({ changes: 0 }, null);
      }

      if (cleanSql.includes("INSERT INTO users")) {
        const [user_id, name, email, phone, loyalty_points, password, role, allergies, chronic_conditions, blood_type, weight, height] = params;
        await setDoc(doc(firestore, "users", user_id), {
          user_id, name, email, phone, loyalty_points, password, role, allergies, chronic_conditions, blood_type, weight, height
        });
        return safeCallback.call({ lastID: user_id, changes: 1 }, null);
      }

      if (cleanSql.includes("UPDATE users SET allergies = ?, chronic_conditions = ?, blood_type = ?, weight = ?, height = ? WHERE user_id = ?")) {
        const [allergies, chronic, blood, weight, height, user_id] = params;
        const ref = doc(firestore, "users", user_id);
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          return safeCallback.call({ changes: 0 }, null);
        }
        await setDoc(ref, {
          ...snap.data(),
          allergies, chronic_conditions: chronic, blood_type: blood, weight, height
        });
        return safeCallback.call({ changes: 1 }, null);
      }

      if (cleanSql.includes("UPDATE users SET name = ?, email = ?, phone = ?, loyalty_points = ?, role = ?, password = ?")) {
        const [name, email, phone, loyalty_points, role, password, allergies, chronic, blood, weight, height, user_id] = params;
        await setDoc(doc(firestore, "users", user_id), {
          user_id, name, email, phone, loyalty_points, role, password, allergies, chronic_conditions: chronic, blood_type: blood, weight, height
        });
        return safeCallback.call({ changes: 1 }, null);
      }

      if (cleanSql.includes("INSERT INTO appointments")) {
        const [apt_id, user_id, doctor_id, date, symptom, status, consult_type] = params;
        await setDoc(doc(firestore, "appointments", apt_id), {
          apt_id, user_id, doctor_id, date, symptom, status, consult_type
        });
        return safeCallback.call({ changes: 1 }, null);
      }

      if (cleanSql.includes("UPDATE appointments SET status = ? WHERE apt_id = ?")) {
        const [status, apt_id] = params;
        const ref = doc(firestore, "appointments", apt_id);
        const snap = await getDoc(ref);
        if (!snap.exists()) return safeCallback.call({ changes: 0 }, null);
        await setDoc(ref, {
          ...snap.data(),
          status
        });
        return safeCallback.call({ changes: 1 }, null);
      }

      if (cleanSql.includes("INSERT INTO medical_records")) {
        const [record_id, apt_id, user_id, doctor_id, diagnosis_code, diagnosis_desc, chief_complaint, allergies, prescription, digimc_link, created_at] = params;
        await setDoc(doc(firestore, "medical_records", record_id), {
          record_id, apt_id, user_id, doctor_id, diagnosis_code, diagnosis_desc, chief_complaint, allergies, prescription, digimc_link, created_at
        });
        return safeCallback.call({ changes: 1 }, null);
      }

      console.warn("[Firestore Adapter] Unsupported RUN query:", sql);
      return safeCallback(null);

    } catch (e) {
      return safeCallback(e);
    }
  }
};

// Seed database on Firestore with random values where missing (just like the original seed in sqlite3)
async function initDatabase() {
  try {
    console.log("[OncoVision/Clickcare] Checking Firestore collections configuration...");

    // 1. Seed Users
    const usersRef = collection(firestore, "users");
    const usersSnap = await getDocs(query(usersRef, limit(1)));
    if (usersSnap.empty) {
      console.log("Firestore users collection is empty. Seeding...");
      
      await setDoc(doc(firestore, "users", "admin"), {
        user_id: 'admin', name: 'System Admin', email: 'admin@clickcare.com', phone: '02-111-1111', loyalty_points: 0, password: 'password123', role: 'admin', allergies: 'None', chronic_conditions: 'None', blood_type: 'AB', weight: 65, height: 170
      });

      await setDoc(doc(firestore, "users", "doc-44"), {
        user_id: 'doc-44', name: 'Dr. Alice Davis', email: 'alice.davis@clickcare.com', phone: '02-222-2222', loyalty_points: 0, password: 'password123', role: 'doctor', allergies: 'None', chronic_conditions: 'None', blood_type: 'O', weight: 70, height: 175
      });

      const sampleAllergies = ["None", "Penicillin", "Sulfa drugs", "Aspirin", "None", "None"];
      const sampleChronic = ["None", "Hypertension", "Diabetes", "None", "Asthma", "None"];
      const sampleBlood = ["A", "B", "O", "AB", "O", "A"];

      if (fs.existsSync(usersFilePath)) {
        const fileUsers = JSON.parse(fs.readFileSync(usersFilePath, 'utf8'));
        fileUsers.forEach(async (u, idx) => {
          const password = "password123";
          const role = "patient";
          const allergies = sampleAllergies[idx % sampleAllergies.length];
          const chronic = sampleChronic[idx % sampleChronic.length];
          const blood = sampleBlood[idx % sampleBlood.length];
          const weight = 50 + (idx % 5) * 6;
          const height = 155 + (idx % 5) * 4;

          await setDoc(doc(firestore, "users", u.user_id), {
            user_id: u.user_id,
            name: u.name,
            email: u.email,
            phone: u.phone,
            loyalty_points: u.loyalty_points || 0,
            password: password,
            role: role,
            allergies: allergies,
            chronic_conditions: chronic,
            blood_type: blood,
            weight: weight,
            height: height
          });
        });
      }
      console.log("Users seeded successfully on Firestore.");
    }

    // 2. Seed Doctors
    const doctorsRef = collection(firestore, "doctors");
    const docsSnap = await getDocs(query(doctorsRef, limit(1)));
    if (docsSnap.empty) {
      console.log("Firestore doctors collection is empty. Seeding...");

      const consultTypes = ["video", "clinic", "both"];
      const languagesList = [
        ["Thai", "English"],
        ["Thai", "English", "Japanese"],
        ["Thai", "English", "Chinese"],
        ["Thai"]
      ];
      const availabilities = [
        "Mon-Wed 09:00 - 12:00",
        "Tue-Thu 13:00 - 16:00",
        "Mon-Fri 09:00 - 15:00",
        "Wed-Fri 13:00 - 17:00",
        "Sat-Sun 09:00 - 12:00"
      ];

      if (fs.existsSync(doctorsFilePath)) {
        const fileDoctors = JSON.parse(fs.readFileSync(doctorsFilePath, 'utf8'));
        
        for (let idx = 0; idx < fileDoctors.length; idx++) {
          const d = fileDoctors[idx];
          const cType = consultTypes[idx % consultTypes.length];
          const lang = languagesList[idx % languagesList.length];
          const avail = availabilities[idx % availabilities.length];
          const fee = 500 + (idx % 5) * 200;
          const rating = parseFloat((4.5 + (idx % 6) * 0.1).toFixed(1));
          const exp = 3 + (idx % 20);

          await setDoc(doc(firestore, "doctors", d.doctor_id), {
            doctor_id: d.doctor_id,
            name: d.name,
            department: d.department,
            hospital: d.hospital,
            consult_type: cType,
            availability: avail,
            fee: fee,
            languages: lang,
            rating: rating,
            experience: exp
          });

          // Seed corresponding Doctor user account
          const cleanName = d.name.replace(/^Dr\.\s+/, "");
          const emailName = cleanName.toLowerCase().replace(/\s+/g, ".");
          const email = `${emailName}@clickcare.com`;

          await setDoc(doc(firestore, "users", d.doctor_id), {
            user_id: d.doctor_id,
            name: d.name,
            email: email,
            phone: "02-222-2222",
            loyalty_points: 0,
            password: "password123",
            role: "doctor",
            allergies: "None",
            chronic_conditions: "None",
            blood_type: "O",
            weight: 70.0,
            height: 175.0
          });
        }
      }
      console.log("Doctors seeded successfully on Firestore.");
    }

    // 3. Seed Appointments
    const apptsRef = collection(firestore, "appointments");
    const apptsSnap = await getDocs(query(apptsRef, limit(1)));
    if (apptsSnap.empty) {
      console.log("Firestore appointments collection is empty. Seeding...");
      if (fs.existsSync(appointmentsFilePath)) {
        const fileAppts = JSON.parse(fs.readFileSync(appointmentsFilePath, 'utf8'));
        
        for (let idx = 0; idx < fileAppts.length; idx++) {
          const a = fileAppts[idx];
          const cType = idx % 2 === 0 ? "video" : "clinic";
          await setDoc(doc(firestore, "appointments", a.apt_id), {
            apt_id: a.apt_id,
            user_id: a.user_id,
            doctor_id: a.doctor_id,
            date: a.date,
            symptom: a.symptom,
            status: a.status,
            consult_type: cType
          });
        }
      }
      console.log("Appointments seeded successfully on Firestore.");
    }

    console.log("Firestore Database initialization/sync check complete.");
  } catch (e) {
    console.error("Failed to check or seed Firestore:", e);
  }
}

module.exports = {
  db: dbAdapter,
  initDatabase,
  medicalDictionary
};
