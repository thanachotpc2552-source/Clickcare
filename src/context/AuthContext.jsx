import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const AuthContext = createContext(null)

const MOCK_USER = { user_id: 'usr-demo', name: 'Somchai (Mock)', email: 'somchai@example.com', role: 'PATIENT', gender: 'Male', blood_type: 'O', allergies: 'None' }
const MOCK_DOCTORS = [
  { doctor_id: 'doc-01', name: 'Dr. Alice Smith', department: 'Psychiatry', hospital: 'Central Health', rating: 4.8, fee: 1500, availability: '10:00 - 18:00', consult_type: 'video', languages: 'Thai, English', appointment_count: 120 },
  { doctor_id: 'doc-02', name: 'Dr. Kenji Rodriguez', department: 'Dermatology', hospital: 'Siriraj', rating: 4.5, fee: 1000, availability: '09:00 - 16:00', consult_type: 'clinic', languages: 'Thai, Japanese', appointment_count: 85 },
  { doctor_id: 'doc-03', name: 'Dr. Sarah Brown', department: 'Cardiology', hospital: 'Bumrungrad', rating: 4.9, fee: 2500, availability: '08:00 - 15:00', consult_type: 'video', languages: 'Thai, English', appointment_count: 230 },
  { doctor_id: 'doc-04', name: 'Dr. John Doe', department: 'Pediatrics', hospital: 'City Hospital', rating: 4.2, fee: 800, availability: '11:00 - 19:00', consult_type: 'clinic', languages: 'Thai', appointment_count: 40 },
  { doctor_id: 'doc-05', name: 'Dr. Lisa Wong', department: 'Gynecology', hospital: 'Samitivej', rating: 4.7, fee: 2000, availability: '09:00 - 17:00', consult_type: 'video', languages: 'Thai, English, Chinese', appointment_count: 150 }
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
