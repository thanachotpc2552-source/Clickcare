import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const AuthContext = createContext(null)

const MOCK_USER = { user_id: 'usr-demo', name: 'Somchai (Mock)', email: 'somchai@example.com', role: 'PATIENT', gender: 'Male', blood_type: 'O', allergies: 'None' }
const MOCK_DOCTORS = [
  { doctor_id: 'doc-01', name: 'Dr. Alice Smith', department: 'Psychiatry', hospital: 'Central Health', rating: 4.8, fee: 1500, availability: '10:00 - 18:00', consult_type: 'video', languages: 'Thai, English', appointment_count: 120 },
  { doctor_id: 'doc-02', name: 'Dr. Kenji Rodriguez', department: 'Dermatology', hospital: 'Siriraj', rating: 4.5, fee: 1000, availability: '09:00 - 16:00', consult_type: 'clinic', languages: 'Thai, Japanese', appointment_count: 85 },
  { doctor_id: 'doc-03', name: 'Dr. Sarah Brown', department: 'Cardiology', hospital: 'Bumrungrad', rating: 4.9, fee: 2500, availability: '08:00 - 15:00', consult_type: 'video', languages: 'Thai, English', appointment_count: 230 },
  { doctor_id: 'doc-04', name: 'Dr. John Doe', department: 'Pediatrics', hospital: 'City Hospital', rating: 4.2, fee: 800, availability: '11:00 - 19:00', consult_type: 'clinic', languages: 'Thai', appointment_count: 40 },
  { doctor_id: 'doc-05', name: 'Dr. Lisa Wong', department: 'Gynecology', hospital: 'Samitivej', rating: 4.7, fee: 2000, availability: '09:00 - 17:00', consult_type: 'video', languages: 'Thai, English, Chinese', appointment_count: 150 },
  { doctor_id: 'doc-06', name: 'Dr. Somchai Prasert', department: 'General Practice', hospital: 'Bangkok General', rating: 4.6, fee: 700, availability: '08:00 - 16:00', consult_type: 'clinic', languages: 'Thai', appointment_count: 310 },
  { doctor_id: 'doc-07', name: 'Dr. Napat Wongkul', department: 'General Practice', hospital: 'Central Health', rating: 4.4, fee: 600, availability: '09:00 - 17:00', consult_type: 'video', languages: 'Thai, English', appointment_count: 275 },
  { doctor_id: 'doc-08', name: 'Dr. Priya Sharma', department: 'General Practice', hospital: 'Siam Medical', rating: 4.3, fee: 650, availability: '10:00 - 18:00', consult_type: 'clinic', languages: 'Thai, Hindi, English', appointment_count: 190 },
  { doctor_id: 'doc-09', name: 'Dr. Tanaka Yuki', department: 'Neurology', hospital: 'Bumrungrad', rating: 4.8, fee: 2200, availability: '08:00 - 14:00', consult_type: 'video', languages: 'Thai, Japanese, English', appointment_count: 180 },
  { doctor_id: 'doc-10', name: 'Dr. Wichai Suthon', department: 'Neurology', hospital: 'Siriraj', rating: 4.7, fee: 1800, availability: '09:00 - 15:00', consult_type: 'clinic', languages: 'Thai', appointment_count: 210 },
  { doctor_id: 'doc-11', name: 'Dr. Emily Chen', department: 'Orthopedics', hospital: 'Samitivej', rating: 4.5, fee: 1600, availability: '08:00 - 16:00', consult_type: 'clinic', languages: 'Thai, English, Chinese', appointment_count: 145 },
  { doctor_id: 'doc-12', name: 'Dr. Pichit Kaewmanee', department: 'Orthopedics', hospital: 'Chiang Mai Ram', rating: 4.6, fee: 1400, availability: '09:00 - 17:00', consult_type: 'video', languages: 'Thai', appointment_count: 130 },
  { doctor_id: 'doc-13', name: 'Dr. Maria Santos', department: 'Oncology', hospital: 'Bumrungrad', rating: 4.9, fee: 3000, availability: '08:00 - 14:00', consult_type: 'clinic', languages: 'Thai, English', appointment_count: 95 },
  { doctor_id: 'doc-14', name: 'Dr. Anurak Thongdee', department: 'Urology', hospital: 'Bangkok General', rating: 4.4, fee: 1500, availability: '10:00 - 18:00', consult_type: 'clinic', languages: 'Thai', appointment_count: 70 },
  { doctor_id: 'doc-15', name: 'Dr. Sophie Laurent', department: 'Dermatology', hospital: 'Phuket International', rating: 4.7, fee: 1200, availability: '09:00 - 17:00', consult_type: 'video', languages: 'Thai, English, French', appointment_count: 160 },
  { doctor_id: 'doc-16', name: 'Dr. Kittisak Rattanakorn', department: 'Cardiology', hospital: 'Thonburi Hospital', rating: 4.6, fee: 2000, availability: '08:00 - 15:00', consult_type: 'clinic', languages: 'Thai', appointment_count: 200 },
  { doctor_id: 'doc-17', name: 'Dr. Aisha Rahman', department: 'Pediatrics', hospital: 'Samitivej', rating: 4.8, fee: 1000, availability: '09:00 - 17:00', consult_type: 'video', languages: 'Thai, Malay, English', appointment_count: 220 },
  { doctor_id: 'doc-18', name: 'Dr. Pattaraporn Suksri', department: 'Psychiatry', hospital: 'Siam Medical', rating: 4.5, fee: 1800, availability: '10:00 - 18:00', consult_type: 'video', languages: 'Thai, English', appointment_count: 100 },
  { doctor_id: 'doc-19', name: 'Dr. David Kim', department: 'Gynecology', hospital: 'City Hospital', rating: 4.3, fee: 1500, availability: '08:00 - 16:00', consult_type: 'clinic', languages: 'Thai, Korean, English', appointment_count: 110 },
  { doctor_id: 'doc-20', name: 'Dr. Naree Chaisiri', department: 'Pulmonology', hospital: 'Siriraj', rating: 4.7, fee: 1600, availability: '09:00 - 15:00', consult_type: 'clinic', languages: 'Thai', appointment_count: 175 },
]

const MOCK_APTS = [
  { apt_id: 'apt-001', doctor_name: 'Dr. Alice Smith', doctor_id: 'doc-01', department: 'Psychiatry', hospital: 'Central Health', date: new Date(Date.now() + 86400000).toISOString(), status: 'CONFIRMED', symptom: 'Anxiety', doctor_consult: 'video', fee: 1500 },
  { apt_id: 'apt-002', doctor_name: 'Dr. Kenji Rodriguez', doctor_id: 'doc-02', department: 'Dermatology', hospital: 'Siriraj', date: new Date(Date.now() - 86400000).toISOString(), status: 'COMPLETED', symptom: 'Skin rash', doctor_consult: 'clinic', fee: 1000, medical_record: { diagnosis: 'Allergic rash', prescription: 'Antihistamine 10mg', mc_url: '#', notes: 'พักผ่อนให้เพียงพอ หลีกเลี่ยงแสงแดด' } }
]

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('cc_token'))
  const [loading, setLoading] = useState(true)
  const [apts, setApts] = useState(MOCK_APTS)

  useEffect(() => {
    if (token) {
      const email = token
      let role = 'PATIENT'
      if (email.includes('doctor') || email.includes('smith')) role = 'DOCTOR'
      else if (email.includes('admin')) role = 'ADMIN'
      else if (email.includes('vip') || email.includes('alice')) role = 'VIP'

      const namePart = email.split('@')[0]
      const name = namePart.charAt(0).toUpperCase() + namePart.slice(1)
      setUser({ ...MOCK_USER, email, name: name + ' (Mock)', role })
    }
    setLoading(false)
  }, [token])

  const login = useCallback(async (email, password) => {
    return new Promise((resolve, reject) => setTimeout(() => {
      if (password !== 'demo1234') {
        reject(new Error('รหัสผ่านไม่ถูกต้อง (ใช้ demo1234)'))
        return
      }
      
      let role = 'PATIENT'
      if (email.includes('doctor') || email.includes('smith')) role = 'DOCTOR'
      else if (email.includes('admin')) role = 'ADMIN'
      else if (email.includes('vip') || email.includes('alice')) role = 'VIP'

      const namePart = email.split('@')[0]
      const name = namePart.charAt(0).toUpperCase() + namePart.slice(1)
      const dynamicUser = { ...MOCK_USER, email, name: name + ' (Mock)', role }

      localStorage.setItem('cc_token', email)
      setToken(email)
      setUser(dynamicUser)
      resolve(dynamicUser)
    }, 600))
  }, [])

  const register = useCallback(async (form) => {
    return login(form.email, 'demo1234')
  }, [login])

  const logout = useCallback(async () => {
    localStorage.removeItem('cc_token')
    setToken(null)
    setUser(null)
  }, [])

  const authFetch = useCallback((url, opts = {}) => {
    return new Promise(resolve => {
      setTimeout(() => {
        // Mock Doctors
        if (url.includes('/api/doctors/')) {
          const id = url.split('/').pop()
          const doc = MOCK_DOCTORS.find(d => d.doctor_id === id) || MOCK_DOCTORS[0]
          resolve({ success: true, data: doc })
        } else if (url.includes('/api/doctors')) {
          resolve({ success: true, data: MOCK_DOCTORS })
        } 
        
        // Mock Appointments
        else if (url.includes('/api/appointments')) {
          if (opts.method === 'POST') {
            const body = JSON.parse(opts.body)
            const doc = MOCK_DOCTORS.find(d => d.doctor_id === body.doctor_id) || MOCK_DOCTORS[0]
            const newApt = { 
              apt_id: 'apt-' + Date.now(), 
              doctor_id: doc.doctor_id,
              doctor_name: doc.name, 
              department: doc.department, 
              hospital: doc.hospital, 
              date: body.date, 
              status: 'CONFIRMED', 
              symptom: body.symptom, 
              doctor_consult: body.consult_type, 
              fee: doc.fee,
              notes: body.notes
            }
            setApts(prev => [newApt, ...prev])
            resolve({ success: true, data: newApt })
          } else if (opts.method === 'DELETE') {
            const id = url.split('/').pop()
            setApts(prev => prev.map(a => a.apt_id === id ? { ...a, status: 'CANCELLED' } : a))
            resolve({ success: true })
          } else {
            const id = url.split('/').pop()
            if (id && !url.includes('?')) {
              resolve({ success: true, data: apts.find(a => a.apt_id === id) || apts[0] })
            } else {
              resolve({ success: true, data: apts })
            }
          }
        } 
        
        // Mock Stats
        else if (url.includes('/api/stats/overview')) {
          resolve({ success: true, data: {
            totalPts: 2450, totalApts: 8600, noShowRate: '4.5',
            byDept: [
              { department: 'Psychiatry', count: 320 }, 
              { department: 'Cardiology', count: 280 },
              { department: 'Dermatology', count: 410 },
              { department: 'Pediatrics', count: 190 }
            ],
            byStatus: [
              { status: 'COMPLETED', count: 6500 }, 
              { status: 'CONFIRMED', count: 1200 }, 
              { status: 'PENDING', count: 400 }, 
              { status: 'CANCELLED', count: 350 },
              { status: 'NO_SHOW', count: 150 }
            ],
            topSymptoms: [
              { symptom: 'Headache', count: 850 }, 
              { symptom: 'Anxiety', count: 620 },
              { symptom: 'Skin rash', count: 540 },
              { symptom: 'Chest pain', count: 310 }
            ]
          }})
        } 
        
        // Default
        else {
          resolve({ success: true, data: {} })
        }
      }, 300)
    })
  }, [apts])

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, authFetch }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
