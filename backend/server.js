require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const path = require('path');
const { db, initDatabase, medicalDictionary } = require('./database');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..')));

// Initialize Database
initDatabase();

// --- 1. USER ENDPOINTS ---

// Authenticate user login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }
  db.get("SELECT * FROM users WHERE email = ? AND password = ?", [email, password], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(401).json({ error: "Invalid email or password" });
    res.json({
      message: "Login successful",
      user: {
        user_id: row.user_id,
        name: row.name,
        email: row.email,
        phone: row.phone,
        loyalty_points: row.loyalty_points,
        role: row.role,
        allergies: row.allergies,
        chronic_conditions: row.chronic_conditions,
        blood_type: row.blood_type,
        weight: row.weight,
        height: row.height
      }
    });
  });
});

// Register new patient user
app.post('/api/auth/register', (req, res) => {
  const { name, email, phone, password, allergies, chronic_conditions, blood_type, weight, height } = req.body;
  if (!name || !email || !phone || !password) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  db.get("SELECT * FROM users WHERE email = ?", [email], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (row) return res.status(400).json({ error: "Email already exists" });

    db.get("SELECT COUNT(*) as count FROM users WHERE user_id LIKE 'u%'", (err, countRow) => {
      if (err) return res.status(500).json({ error: err.message });
      const nextId = `u${String(countRow.count + 1).padStart(3, '0')}`;
      const role = 'patient';
      const points = 0;
      const allgs = allergies || 'None';
      const chronic = chronic_conditions || 'None';
      const bType = blood_type || 'O';
      const w = weight || 0.0;
      const h = height || 0.0;

      db.run(
        `INSERT INTO users (user_id, name, email, phone, loyalty_points, password, role, allergies, chronic_conditions, blood_type, weight, height)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [nextId, name, email, phone, points, password, role, allgs, chronic, bType, w, h],
        function(err) {
          if (err) return res.status(500).json({ error: err.message });
          res.status(201).json({
            message: "Registration successful",
            user: { user_id: nextId, name, email, phone, role, allergies: allgs, chronic_conditions: chronic, blood_type: bType, weight: w, height: h }
          });
        }
      );
    });
  });
});

// Update patient health profile
app.put('/api/users/:id/health-profile', (req, res) => {
  const { allergies, chronic_conditions, blood_type, weight, height } = req.body;
  db.run(
    `UPDATE users SET allergies = ?, chronic_conditions = ?, blood_type = ?, weight = ?, height = ? WHERE user_id = ?`,
    [allergies || 'None', chronic_conditions || 'None', blood_type || 'O', weight || 0.0, height || 0.0, req.params.id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: "User not found" });
      res.json({ message: "Health profile updated successfully" });
    }
  );
});

// Get all users (patients)
app.get('/api/users', (req, res) => {
  db.all("SELECT * FROM users", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Get user by ID
app.get('/api/users/:id', (req, res) => {
  db.get("SELECT * FROM users WHERE user_id = ?", [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: "User not found" });
    res.json(row);
  });
});

// Update user details (e.g. loyalty points or personal details)
app.put('/api/users/:id', (req, res) => {
  const { name, email, phone, loyalty_points, role, password, allergies, chronic_conditions, blood_type, weight, height } = req.body;
  db.run(
    `UPDATE users SET name = ?, email = ?, phone = ?, loyalty_points = ?, role = ?, password = ?, allergies = ?, chronic_conditions = ?, blood_type = ?, weight = ?, height = ? WHERE user_id = ?`,
    [name, email, phone, loyalty_points, role, password, allergies, chronic_conditions, blood_type, weight, height, req.params.id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: "User not found" });
      res.json({ message: "User updated successfully" });
    }
  );
});

// --- 2. DOCTOR ENDPOINTS ---

// Get all doctors with filters
app.get('/api/doctors', (req, res) => {
  const { search, department, hospital, consult_type, language, availability } = req.query;
  let query = "SELECT * FROM doctors WHERE 1=1";
  const params = [];

  if (search) {
    query += " AND (name LIKE ? OR department LIKE ? OR hospital LIKE ?)";
    const wildcard = `%${search}%`;
    params.push(wildcard, wildcard, wildcard);
  }

  if (department) {
    query += " AND department = ?";
    params.push(department);
  }

  if (hospital) {
    query += " AND hospital = ?";
    params.push(hospital);
  }

  if (consult_type) {
    // Matches "video" or "clinic" or "both"
    if (consult_type === "video") {
      query += " AND (consult_type = 'video' OR consult_type = 'both')";
    } else if (consult_type === "clinic") {
      query += " AND (consult_type = 'clinic' OR consult_type = 'both')";
    }
  }

  if (language) {
    query += " AND languages LIKE ?";
    params.push(`%${language}%`);
  }

  if (availability) {
    query += " AND availability LIKE ?";
    params.push(`%${availability}%`);
  }

  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    // Parse JSON string back to array for frontend convenience
    const doctors = rows.map(r => ({
      ...r,
      languages: JSON.parse(r.languages)
    }));
    res.json(doctors);
  });
});

// Get doctor by ID
app.get('/api/doctors/:id', (req, res) => {
  db.get("SELECT * FROM doctors WHERE doctor_id = ?", [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: "Doctor not found" });
    res.json({
      ...row,
      languages: JSON.parse(row.languages)
    });
  });
});

// --- 3. APPOINTMENT ENDPOINTS ---

// Get all appointments with filter
app.get('/api/appointments', (req, res) => {
  const { user_id, doctor_id, date, status } = req.query;
  let query = `
    SELECT a.*, d.name as doctor_name, d.department, d.hospital, d.fee, u.name as user_name, u.allergies as user_allergies, u.chronic_conditions as user_chronic_conditions
    FROM appointments a
    JOIN doctors d ON a.doctor_id = d.doctor_id
    JOIN users u ON a.user_id = u.user_id
    WHERE 1=1
  `;
  const params = [];

  if (user_id) {
    query += " AND a.user_id = ?";
    params.push(user_id);
  }
  if (doctor_id) {
    query += " AND a.doctor_id = ?";
    params.push(doctor_id);
  }
  if (date) {
    query += " AND a.date LIKE ?";
    params.push(`${date}%`);
  }
  if (status) {
    query += " AND a.status = ?";
    params.push(status);
  }

  query += " ORDER BY a.date DESC";

  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Get appointment + medical record by ID
app.get('/api/appointments/:id', (req, res) => {
  db.get(`
    SELECT a.*, d.name as doctor_name, d.department, d.hospital, d.fee, u.name as user_name, u.email as user_email, u.phone as user_phone
    FROM appointments a
    JOIN doctors d ON a.doctor_id = d.doctor_id
    JOIN users u ON a.user_id = u.user_id
    WHERE a.apt_id = ?
  `, [req.params.id], (err, aptRow) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!aptRow) return res.status(404).json({ error: "Appointment not found" });

    if (aptRow.status === 'COMPLETED') {
      db.get("SELECT * FROM medical_records WHERE apt_id = ?", [req.params.id], (err, mrRow) => {
        if (err) return res.status(500).json({ error: err.message });
        if (mrRow) {
          mrRow.prescription = JSON.parse(mrRow.prescription);
          aptRow.medical_record = mrRow;
        }
        res.json(aptRow);
      });
    } else {
      res.json(aptRow);
    }
  });
});

// Create new appointment
app.post('/api/appointments', (req, res) => {
  const { user_id, doctor_id, date, symptom, consult_type } = req.body;
  if (!user_id || !doctor_id || !date || !symptom) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  // Generate unique appointment ID (apt-XXX)
  db.get("SELECT COUNT(*) as count FROM appointments", (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    const count = row.count + 1;
    const apt_id = `apt-${String(count).padStart(3, '0')}`;
    const status = "PENDING";
    const cType = consult_type || "video";

    db.run(
      `INSERT INTO appointments (apt_id, user_id, doctor_id, date, symptom, status, consult_type) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [apt_id, user_id, doctor_id, date, symptom, status, cType],
      function(err) {
        if (err) return res.status(500).json({ error: err.message });
        
        // Add some loyalty points to the user for making a booking (e.g. 50 points)
        db.run("UPDATE users SET loyalty_points = loyalty_points + 50 WHERE user_id = ?", [user_id]);

        res.status(201).json({
          message: "Appointment booked successfully",
          appointment: { apt_id, user_id, doctor_id, date, symptom, status, consult_type: cType }
        });
      }
    );
  });
});

// Update appointment status
app.patch('/api/appointments/:id/status', (req, res) => {
  const { status, diagnosis_code, diagnosis_desc, allergies, prescription, chief_complaint } = req.body;
  if (!status) return res.status(400).json({ error: "Status field is required" });

  db.get("SELECT * FROM appointments WHERE apt_id = ?", [req.params.id], (err, apt) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!apt) return res.status(404).json({ error: "Appointment not found" });

    db.run(
      `UPDATE appointments SET status = ? WHERE apt_id = ?`,
      [status, req.params.id],
      function(err) {
        if (err) return res.status(500).json({ error: err.message });

        // If marked as COMPLETED, auto-create a medical record
        if (status === 'COMPLETED') {
          // Check if medical record already exists
          db.get("SELECT * FROM medical_records WHERE apt_id = ?", [req.params.id], (err, record) => {
            if (err) console.error("Error checking record:", err);
            
            if (!record) {
              const symptom = chief_complaint || apt.symptom || "Checkup";
              const info = medicalDictionary[symptom] || {
                code: "R69",
                desc: "Illness, unspecified",
                allergies: "None",
                prescription: []
              };

              const code = diagnosis_code || info.code;
              const desc = diagnosis_desc || info.desc;
              const allgs = allergies || info.allergies;
              const pres = prescription ? JSON.stringify(prescription) : JSON.stringify(info.prescription);
              const randDigits = Math.floor(100000 + Math.random() * 900000);
              const mcLink = `https://digimc.clickcare.gov.th/verify/MC-${randDigits}`;
              
              // Generate record ID
              db.get("SELECT COUNT(*) as count FROM medical_records", (err, rCount) => {
                const recId = `rec-${rCount.count + 100}`;
                db.run(
                  `INSERT INTO medical_records 
                    (record_id, apt_id, user_id, doctor_id, diagnosis_code, diagnosis_desc, chief_complaint, allergies, prescription, digimc_link, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                  [recId, apt.apt_id, apt.user_id, apt.doctor_id, code, desc, symptom, allgs, pres, mcLink, apt.date],
                  (err) => {
                    if (err) {
                      console.error("Failed to insert medical record:", err);
                    } else {
                      // Also update user's allergies in the users table
                      db.run("UPDATE users SET allergies = ? WHERE user_id = ?", [allgs, apt.user_id]);
                    }
                  }
                );
              });
            }
          });
        }

        res.json({ message: `Appointment status updated to ${status}` });
      }
    );
  });
});

// Delete (cancel) appointment
app.delete('/api/appointments/:id', (req, res) => {
  db.run(
    `UPDATE appointments SET status = 'CANCELLED' WHERE apt_id = ?`,
    [req.params.id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: "Appointment not found" });
      res.json({ message: "Appointment cancelled successfully" });
    }
  );
});

// --- 4. MEDICAL RECORD ENDPOINTS ---

// Get all medical records filterable by user_id
app.get('/api/medical-records', (req, res) => {
  const { user_id } = req.query;
  let query = `
    SELECT m.*, d.name as doctor_name, d.department, d.hospital, u.name as user_name
    FROM medical_records m
    JOIN doctors d ON m.doctor_id = d.doctor_id
    JOIN users u ON m.user_id = u.user_id
  `;
  const params = [];

  if (user_id) {
    query += " WHERE m.user_id = ?";
    params.push(user_id);
  }

  query += " ORDER BY m.created_at DESC";

  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    const records = rows.map(r => ({
      ...r,
      prescription: JSON.parse(r.prescription)
    }));
    res.json(records);
  });
});

// --- 5. STATS OVERVIEW ENDPOINT ---

// Get statistics for clinical dashboard
app.get('/api/stats/overview', (req, res) => {
  const stats = {};
  
  // Total Patients
  db.get("SELECT COUNT(*) as count FROM users", (err, uRow) => {
    stats.totalPatients = uRow ? uRow.count : 0;

    // Today's Queue Count
    const today = new Date().toISOString().substring(0, 10);
    db.get("SELECT COUNT(*) as count FROM appointments WHERE date LIKE ? AND status IN ('PENDING', 'CONFIRMED')", [`${today}%`], (err, qRow) => {
      stats.todayQueue = qRow ? qRow.count : 0;
      stats.averageWaitingTime = stats.todayQueue > 0 ? `${stats.todayQueue * 12 + 5} mins` : "0 mins";

      // Status breakdown
      db.all("SELECT status, COUNT(*) as count FROM appointments GROUP BY status", (err, statusRows) => {
        stats.statusBreakdown = {
          PENDING: 0,
          CONFIRMED: 0,
          COMPLETED: 0,
          CANCELLED: 0,
          NO_SHOW: 0
        };
        if (statusRows) {
          statusRows.forEach(row => {
            stats.statusBreakdown[row.status] = row.count;
          });
        }

        // Department breakdown
        db.all(`
          SELECT d.department, COUNT(*) as count 
          FROM appointments a 
          JOIN doctors d ON a.doctor_id = d.doctor_id 
          GROUP BY d.department
        `, (err, deptRows) => {
          stats.departmentBreakdown = deptRows || [];

          // Common symptoms
          db.all(`
            SELECT symptom, COUNT(*) as count 
            FROM appointments 
            GROUP BY symptom 
            ORDER BY count DESC 
            LIMIT 6
          `, (err, symRows) => {
            stats.symptomBreakdown = symRows || [];

            // No-shows by department
            db.all(`
              SELECT d.department, 
                     COUNT(CASE WHEN a.status = 'NO_SHOW' THEN 1 END) as noShows,
                     COUNT(*) as total
              FROM appointments a
              JOIN doctors d ON a.doctor_id = d.doctor_id
              GROUP BY d.department
            `, (err, noShowRows) => {
              stats.noShowRates = (noShowRows || []).map(r => ({
                department: r.department,
                rate: r.total > 0 ? parseFloat(((r.noShows / r.total) * 100).toFixed(1)) : 0
              }));

              // Monthly trends (group by substr)
              db.all(`
                SELECT substr(date, 1, 7) as month, COUNT(*) as count 
                FROM appointments 
                GROUP BY month 
                ORDER BY month ASC
              `, (err, trendRows) => {
                stats.monthlyTrends = trendRows || [];
                res.json(stats);
              });
            });
          });
        });
      });
    });
  });
});

// --- 6. AI TRIAGE & SYMPTOM CHECKER ---

app.post('/api/ai/triage', async (req, res) => {
  const { symptom } = req.body;
  if (!symptom) return res.status(400).json({ error: "Symptom description is required" });

  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      const prompt = `
You are an AI Clinical Triage Nurse named Clickcare. Analyze the following symptom text described by a patient: "${symptom}".
Provide a structured JSON response in the following format. Do NOT wrap the JSON in markdown code blocks, backticks, or any leading/trailing text. Output ONLY valid JSON:
{
  "conditionTh": "ชื่อโรคหรืออาการที่น่าจะเป็นไปได้เป็นภาษาไทย",
  "conditionEn": "Likely condition/symptom name in English",
  "severity": "Low" or "Medium" or "High",
  "department": "Cardiology" or "Dermatology" or "Gynecology" or "Neurology" or "Oncology" or "Orthopedics" or "Pediatrics" or "Psychiatry" or "Urology" or "General Medicine",
  "adviceTh": "คำแนะนำการดูแลตัวเองเบื้องต้นเป็นภาษาไทย",
  "adviceEn": "First aid/self-care advice in English"
}
Ensure the "department" field matches exactly one of the 10 departments listed above.
`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json" }
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        const textResponse = data.candidates[0].content.parts[0].text;
        const triageResult = JSON.parse(textResponse.trim());

        // Get matching doctors from the database for the recommended department
        db.all("SELECT doctor_id, name, department, hospital, consult_type, fee FROM doctors WHERE department = ?", [triageResult.department], (err, docs) => {
          res.json({
            ...triageResult,
            recommendedDoctors: docs || []
          });
        });
        return;
      } else {
        console.warn("Gemini API call failed with status:", response.status);
      }
    } catch (e) {
      console.error("Gemini integration error, falling back to NLP:", e);
    }
  }

  // --- NLP KEYWORD FALLBACK ---
  const lowerText = symptom.toLowerCase();
  let dept = "General Medicine";
  let condTh = "อาการเจ็บป่วยทั่วไป";
  let condEn = "General symptoms / Malaise";
  let severity = "Low";
  let adviceTh = "พักผ่อนให้เพียงพอ ดื่มน้ำมากๆ หากอาการไม่ดีขึ้นใน 2-3 วัน ควรปรึกษาแพทย์";
  let adviceEn = "Rest well and drink plenty of fluids. If symptoms persist for 2-3 days, please consult a doctor.";

  if (lowerText.includes("chest") || lowerText.includes("heart") || lowerText.includes("อก") || lowerText.includes("หัวใจ")) {
    dept = "Cardiology";
    condTh = "อาการแน่นหน้าอก / เสี่ยงโรคหัวใจ";
    condEn = "Chest pain / Suspected Cardiac Event";
    severity = "High";
    adviceTh = "หลีกเลี่ยงการออกแรง หากมีอาการเหนื่อยหอบ ร้าวไปที่แขนหรือกราม กรุณาไปห้องฉุกเฉินทันที";
    adviceEn = "Avoid physical exertion. If chest pain radiates to the arm or jaw, seek immediate emergency medical care.";
  } else if (lowerText.includes("rash") || lowerText.includes("itch") || lowerText.includes("acne") || lowerText.includes("skin") || lowerText.includes("ผื่น") || lowerText.includes("คัน") || lowerText.includes("สิว") || lowerText.includes("ผิวหนัง")) {
    dept = "Dermatology";
    condTh = "ผื่นแพ้ผิวหนังหรือการอักเสบ";
    condEn = "Skin rash or dermatological inflammation";
    severity = "Low";
    adviceTh = "หลีกเลี่ยงการเกา อาบน้ำอุณหภูมิปกติ และงดใช้ผลิตภัณฑ์ที่มีน้ำหอม";
    adviceEn = "Avoid scratching. Bathe in lukewarm water and avoid using perfumed products.";
  } else if (lowerText.includes("pregnant") || lowerText.includes("pregnancy") || lowerText.includes("gyneco") || lowerText.includes("ท้อง") || lowerText.includes("ครรภ์") || lowerText.includes("ประจำเดือน") || lowerText.includes("มดลูก")) {
    dept = "Gynecology";
    condTh = "การดูแลครรภ์หรือปัญหาระบบสืบพันธุ์สตรี";
    condEn = "Prenatal care or female reproductive health issue";
    severity = "Medium";
    adviceTh = "บันทึกรอบเดือนล่าสุด สังเกตอาการปวดเกร็งท้อง หรือการมีเลือดออกผิดปกติ";
    adviceEn = "Track your menstrual cycle and note any abdominal cramping or abnormal bleeding.";
  } else if (lowerText.includes("brain") || lowerText.includes("headache") || lowerText.includes("neuro") || lowerText.includes("migraine") || lowerText.includes("สมอง") || lowerText.includes("ปวดหัว") || lowerText.includes("ชา") || lowerText.includes("ไมเกรน")) {
    dept = "Neurology";
    condTh = "อาการปวดหัวรุนแรง / ปัญหาทางระบบประสาท";
    condEn = "Severe headache / Suspected Neurological condition";
    severity = "Medium";
    adviceTh = "หลีกเลี่ยงแสงจ้าและเสียงดัง นอนพักในห้องเงียบๆ สามารถทานพาราเซตามอลบรรเทาอาการได้";
    adviceEn = "Avoid bright lights and loud noises. Rest in a quiet room. Paracetamol can be taken for pain relief.";
  } else if (lowerText.includes("cancer") || lowerText.includes("tumor") || lowerText.includes("oncology") || lowerText.includes("มะเร็ง") || lowerText.includes("เนื้องอก")) {
    dept = "Oncology";
    condTh = "การคัดกรองหรือติดตามผลโรคมะเร็ง";
    condEn = "Cancer screening or oncology follow-up";
    severity = "High";
    adviceTh = "เตรียมประวัติการรักษาเดิม ผลตรวจชิ้นเนื้อ หรือผลแลปเพื่อประกอบการวินิจฉัย";
    adviceEn = "Prepare your clinical history, biopsy results, or lab reports to assist the doctor.";
  } else if (lowerText.includes("bone") || lowerText.includes("joint") || lowerText.includes("back pain") || lowerText.includes("ortho") || lowerText.includes("กระดูก") || lowerText.includes("ข้อ") || lowerText.includes("หลัง") || lowerText.includes("ปวดข้อ")) {
    dept = "Orthopedics";
    condTh = "อาการปวดเมื่อยกล้ามเนื้อและกระดูก";
    condEn = "Musculoskeletal pain / Joint issue";
    severity = "Medium";
    adviceTh = "ประคบอุ่นบริเวณที่ปวด หลีกเลี่ยงการยกของหนักและการนั่งหน้าจอเป็นเวลานาน";
    adviceEn = "Apply a warm compress. Avoid heavy lifting and prolonged sitting at desks.";
  } else if (lowerText.includes("child") || lowerText.includes("pediatric") || lowerText.includes("baby") || lowerText.includes("kid") || lowerText.includes("เด็ก") || lowerText.includes("กุมาร")) {
    dept = "Pediatrics";
    condTh = "การดูแลสุขภาพหรือตรวจอาการในเด็ก";
    condEn = "Pediatric health issue / Child development check";
    severity = "Medium";
    adviceTh = "เช็ดตัวบ่อยๆ หากมีไข้สูง ให้ดื่มน้ำเกลือแร่หรือน้ำผลไม้เจือจาง และหลีกเลี่ยงการใช้ยาลดไข้กลุ่มแอสไพริน";
    adviceEn = "Tepid sponge frequently for fever. Provide oral rehydration solution, and avoid aspirin.";
  } else if (lowerText.includes("depress") || lowerText.includes("anxiety") || lowerText.includes("stress") || lowerText.includes("sleep") || lowerText.includes("mental") || lowerText.includes("psych") || lowerText.includes("เครียด") || lowerText.includes("ซึมเศร้า") || lowerText.includes("วิตก") || lowerText.includes("นอนไม่หลับ")) {
    dept = "Psychiatry";
    condTh = "ภาวะความเครียด วิตกกังวล หรือนอนไม่หลับ";
    condEn = "Stress, anxiety, or sleep disorder symptoms";
    severity = "Medium";
    adviceTh = "ฝึกกำหนดลมหายใจช้าๆ งดใช้มือถือก่อนนอน และหลีกเลี่ยงเครื่องดื่มคาเฟอีน";
    adviceEn = "Practice deep breathing exercises. Limit screen time before bed and avoid caffeine.";
  } else if (lowerText.includes("urine") || lowerText.includes("kidney") || lowerText.includes("urology") || lowerText.includes("ปัสสาวะ") || lowerText.includes("ไต")) {
    dept = "Urology";
    condTh = "การติดเชื้อหรือปัญหาในทางเดินปัสสาวะ";
    condEn = "Urinary tract infection / Renal system concern";
    severity = "Medium";
    adviceTh = "ดื่มน้ำสะอาดปริมาณมาก ห้ามกลั้นปัสสาวะ และรักษาความสะอาดหลังการขับถ่าย";
    adviceEn = "Drink plenty of water. Do not delay urination and maintain hygiene after voiding.";
  }

  db.all("SELECT doctor_id, name, department, hospital, consult_type, fee FROM doctors WHERE department = ?", [dept], (err, docs) => {
    res.json({
      conditionTh: condTh,
      conditionEn: condEn,
      severity,
      department: dept,
      adviceTh,
      adviceEn,
      recommendedDoctors: docs || []
    });
  });
});

// --- 7. CLINIC STATS & OVERVIEW ---

app.get('/api/stats/overview', (req, res) => {
  // Query all data to construct real-time stats
  db.all("SELECT * FROM users WHERE role = 'patient'", [], (err, pts) => {
    if (err) return res.status(500).json({ error: err.message });
    
    db.all("SELECT * FROM appointments", [], (err, apts) => {
      if (err) return res.status(500).json({ error: err.message });
      
      const totalPts = pts.length;
      const totalApts = apts.length;
      
      // Calculate by status
      const statusCounts = {};
      apts.forEach(a => {
        statusCounts[a.status] = (statusCounts[a.status] || 0) + 1;
      });
      
      const byStatus = Object.keys(statusCounts).map(status => ({
        status,
        count: statusCounts[status]
      }));
      
      // Calculate by department (join details from appointments which should have doctor's details mapped or default details)
      // Since doctors are mapped in frontend fetch, we can aggregate appointments' symptoms to guess workload or mock dynamically
      const byDept = [
        { department: 'Psychiatry', count: apts.filter(a => a.symptom === 'Anxiety' || a.symptom === 'Insomnia' || a.symptom === 'Sleep disorder').length || 10 }, 
        { department: 'Cardiology', count: apts.filter(a => a.symptom === 'Chest pain').length || 8 },
        { department: 'Dermatology', count: apts.filter(a => a.symptom === 'Skin rash' || a.symptom === 'Acne').length || 15 },
        { department: 'Pediatrics', count: apts.filter(a => a.symptom === 'Fever' || a.symptom === 'Flu symptoms').length || 12 },
        { department: 'General Practice', count: apts.filter(a => !a.symptom).length || 20 }
      ];

      // Calculate top symptoms
      const symptomCounts = {};
      apts.forEach(a => {
        if (a.symptom) {
          symptomCounts[a.symptom] = (symptomCounts[a.symptom] || 0) + 1;
        }
      });
      const topSymptoms = Object.keys(symptomCounts)
        .map(s => ({ symptom: s, count: symptomCounts[s] }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      const noShowCount = statusCounts['NO_SHOW'] || 0;
      const noShowRate = totalApts > 0 ? ((noShowCount / totalApts) * 100).toFixed(1) : '0.0';

      res.json({
        totalPts,
        totalApts,
        noShowRate,
        byDept,
        byStatus,
        topSymptoms
      });
    });
  });
});

app.listen(PORT, () => {
  console.log(`Clickcare backend running on http://localhost:${PORT}`);
});
