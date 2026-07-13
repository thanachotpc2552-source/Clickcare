import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useNavigate } from 'react-router-dom'
import { Heart, Eye, EyeOff, Sparkles } from 'lucide-react'
import './LoginPage.css'

const DEMO_ACCOUNTS = [
  { label: 'Patient (Somchai)', email: 'somchai@example.com', password: 'password123' },
  { label: 'Doctor (Alice Davis)', email: 'alice.davis@clickcare.com', password: 'password123' },
  { label: 'Admin', email: 'admin@clickcare.com', password: 'password123' },
]

export default function LoginPage() {
  const { login, register } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [form, setForm] = useState({ email: '', password: '', name: '', phone: '', dob: '', gender: '', blood_type: '', allergies: 'None' })

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const fillDemo = (acc) => setForm(f => ({ ...f, email: acc.email, password: acc.password }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (mode === 'login') {
        await login(form.email, form.password)
        toast('ยินดีต้อนรับสู่ ClickCare 👋', 'success')
      } else {
        if (!form.name) { toast('กรุณากรอกชื่อ', 'error'); setLoading(false); return }
        await register(form)
        toast('สมัครสมาชิกสำเร็จ! 🎉', 'success')
      }
      navigate('/')
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      {/* Left hero */}
      <div className="login-hero">
        <div className="login-hero-content">
          <div className="login-hero-logo">
            <div className="login-hero-icon">
              <Heart size={32} fill="white" />
            </div>
            <h1>Click<span>Care</span></h1>
          </div>
          <p className="login-hero-desc">
            นัดหมายแพทย์ออนไลน์ ค้นหาคลินิกใกล้บ้าน<br />
            พร้อม AI วิเคราะห์อาการเบื้องต้น
          </p>
          <div className="login-hero-features">
            {['🩺 แพทย์ผู้เชี่ยวชาญ 50+ ท่าน', '📅 จองนัดง่าย 24/7', '🤖 AI Symptom Checker', '📋 ประวัติการรักษาดิจิทัล'].map(f => (
              <div key={f} className="login-hero-feature">{f}</div>
            ))}
          </div>
          <div className="login-hero-badge">
            <Sparkles size={14} />
            Powered by Gemini AI
          </div>
        </div>
      </div>

      {/* Right form */}
      <div className="login-form-side">
        <div className="login-box">
          <div className="login-tabs tabs">
            <button className={`tab-btn ${mode === 'login' ? 'active' : ''}`} onClick={() => setMode('login')}>เข้าสู่ระบบ</button>
            <button className={`tab-btn ${mode === 'register' ? 'active' : ''}`} onClick={() => setMode('register')}>สมัครสมาชิก</button>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            {mode === 'register' && (
              <>
                <div className="form-group">
                  <label className="form-label">ชื่อ-นามสกุล *</label>
                  <input className="form-input" placeholder="กรอกชื่อ-นามสกุล" value={form.name} onChange={e => set('name', e.target.value)} required />
                </div>
                <div className="login-row">
                  <div className="form-group">
                    <label className="form-label">เบอร์โทร</label>
                    <input className="form-input" placeholder="081-xxx-xxxx" value={form.phone} onChange={e => set('phone', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">วันเกิด</label>
                    <input className="form-input" type="date" value={form.dob} onChange={e => set('dob', e.target.value)} />
                  </div>
                </div>
                <div className="login-row">
                  <div className="form-group">
                    <label className="form-label">เพศ</label>
                    <select className="form-input form-select" value={form.gender} onChange={e => set('gender', e.target.value)}>
                      <option value="">เลือก</option>
                      <option value="Male">ชาย</option>
                      <option value="Female">หญิง</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">กรุ๊ปเลือด</label>
                    <select className="form-input form-select" value={form.blood_type} onChange={e => set('blood_type', e.target.value)}>
                      <option value="">เลือก</option>
                      {['A','B','O','AB'].map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                </div>
              </>
            )}

            <div className="form-group">
              <label className="form-label">อีเมล *</label>
              <input className="form-input" type="email" placeholder="yourname@example.com" value={form.email} onChange={e => set('email', e.target.value)} required />
            </div>

            <div className="form-group">
              <label className="form-label">รหัสผ่าน *</label>
              <div className="login-pass-wrap">
                <input
                  className="form-input"
                  type={showPass ? 'text' : 'password'}
                  placeholder="รหัสผ่าน"
                  value={form.password}
                  onChange={e => set('password', e.target.value)}
                  required
                  style={{ paddingRight: '2.75rem' }}
                />
                <button type="button" className="login-show-pass" onClick={() => setShowPass(!showPass)}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
              {loading ? <span className="spinner" /> : mode === 'login' ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}
            </button>
          </form>

          {mode === 'login' && (
            <div className="login-demo">
              <p className="login-demo-title">บัญชีทดสอบ (password: demo1234)</p>
              <div className="login-demo-list">
                {DEMO_ACCOUNTS.map(a => (
                  <button key={a.email} className="login-demo-btn" onClick={() => fillDemo(a)}>
                    {a.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
