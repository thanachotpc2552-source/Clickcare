import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import {
  Calendar, Users, TrendingUp, Heart, ChevronRight,
  Clock, MapPin, Sparkles, MessageSquare, Send, X, AlertCircle
} from 'lucide-react'
import './HomePage.css'

const DEPARTMENTS = [
  { name: 'Cardiology', emoji: '❤️', color: '#fee2e2', text: '#991b1b' },
  { name: 'Dermatology', emoji: '✨', color: '#fef3c7', text: '#92400e' },
  { name: 'Pediatrics', emoji: '👶', color: '#dbeafe', text: '#1e40af' },
  { name: 'Gynecology', emoji: '🌸', color: '#fce7f3', text: '#9d174d' },
  { name: 'Neurology', emoji: '🧠', color: '#ede9fe', text: '#5b21b6' },
  { name: 'Orthopedics', emoji: '🦴', color: '#dcfce7', text: '#15803d' },
  { name: 'Psychiatry', emoji: '🧘', color: '#e0f2fe', text: '#0369a1' },
  { name: 'Oncology', emoji: '💊', color: '#f0fdf4', text: '#15803d' },
  { name: 'Urology', emoji: '💧', color: '#eff6ff', text: '#1d4ed8' },
]

const GEMINI_KEY = import.meta.env.VITE_GEMINI_KEY || ''

export default function HomePage() {
  const { user, authFetch } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [upcomingApts, setUpcomingApts] = useState([])
  const [topDoctors, setTopDoctors] = useState([])
  const [stats, setStats] = useState(null)
  const [aiOpen, setAiOpen] = useState(false)
  const [aiMsg, setAiMsg] = useState('')
  const [aiChat, setAiChat] = useState([])
  const [aiLoading, setAiLoading] = useState(false)
  const [doctors, setDoctors] = useState([])

  useEffect(() => {
    // Load upcoming appointments
    authFetch(`/api/appointments?user_id=${user.user_id}&status=CONFIRMED`)
      .then(r => r.success && setUpcomingApts(r.data?.slice(0, 3) || []))

    // Top doctors
    authFetch('/api/doctors?consult_type=video')
      .then(r => r.success && setTopDoctors(r.data?.slice(0, 4) || []))

    // All doctors for AI context
    authFetch('/api/doctors')
      .then(r => r.success && setDoctors(r.data || []))

    // Stats
    authFetch('/api/stats/overview')
      .then(r => r.success && setStats(r.data))
  }, [user.user_id])

  const today = new Date().toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  const analyzeSymptomWithNLP = (text) => {
    const keywords = {
      'ปวดหัว': { dept: 'Neurology', deptTh: 'อายุรกรรมระบบประสาท' },
      'ตัวร้อน': { dept: 'General Practice', deptTh: 'อายุรกรรมทั่วไป' },
      'ไข้': { dept: 'General Practice', deptTh: 'อายุรกรรมทั่วไป' },
      'ไอ': { dept: 'Pulmonology', deptTh: 'ระบบทางเดินหายใจ' },
      'ผื่น': { dept: 'Dermatology', deptTh: 'ผิวหนัง' },
      'สิว': { dept: 'Dermatology', deptTh: 'ผิวหนัง' },
      'คัน': { dept: 'Dermatology', deptTh: 'ผิวหนัง' },
      'ปวดท้อง': { dept: 'Gastroenterology', deptTh: 'ทางเดินอาหาร' },
      'ปวดเข่า': { dept: 'Orthopedics', deptTh: 'กระดูกและข้อ' },
      'ปวดหลัง': { dept: 'Orthopedics', deptTh: 'กระดูกและข้อ' },
      'ซึมเศร้า': { dept: 'Psychiatry', deptTh: 'จิตเวช' },
      'เครียด': { dept: 'Psychiatry', deptTh: 'จิตเวช' },
      'นอนไม่หลับ': { dept: 'Psychiatry', deptTh: 'จิตเวช' },
      'หัวใจ': { dept: 'Cardiology', deptTh: 'โรคหัวใจ' },
      'เหนื่อย': { dept: 'Cardiology', deptTh: 'โรคหัวใจ' },
      'เด็ก': { dept: 'Pediatrics', deptTh: 'กุมารเวชกรรม' },
      'ลูก': { dept: 'Pediatrics', deptTh: 'กุมารเวชกรรม' },
    }

    const found = Object.keys(keywords).find(k => text.includes(k))
    if (found) {
      const info = keywords[found]
      const docsInDept = doctors.filter(d => d.department.includes(info.dept) || info.deptTh.includes(d.department)).slice(0, 2)
      let docsText = docsInDept.map(d => `- ${d.name} (${d.hospital}) ฿${d.fee}`).join('\n')
      if (!docsText) docsText = `- คุณหมอในแผนก ${info.deptTh}`

      return `[ใช้ระบบ NLP วิเคราะห์]
จากการวิเคราะห์คำว่า "${found}":
แนะนำให้พบแพทย์แผนก: **${info.deptTh} (${info.dept})**

👨‍⚕️ แพทย์ที่แนะนำ:
${docsText}

💡 ข้อแนะนำ: พักผ่อนให้เพียงพอ หากอาการไม่ดีขึ้นควรจองนัดหมายพบแพทย์ทันทีครับ`
    }

    return `[ใช้ระบบ NLP วิเคราะห์]
ขออภัยครับ ระบบไม่สามารถระบุแผนกที่เฉพาะเจาะจงจากอาการของคุณได้ 
เบื้องต้นแนะนำให้ปรึกษา **แพทย์อายุรกรรมทั่วไป (General Practice)** เพื่อประเมินอาการครับ`
  }

  const sendAiMessage = async () => {
    if (!aiMsg.trim()) return
    const userMsg = aiMsg.trim()
    setAiMsg('')
    setAiChat(c => [...c, { role: 'user', text: userMsg }])
    setAiLoading(true)

    try {
      const deptSummary = [...new Set(doctors.map(d => d.department))].join(', ')
      const doctorContext = doctors.slice(0, 20).map(d =>
        `${d.name} (${d.department}, ${d.hospital}, ราคา ฿${d.fee}, Rating ${d.rating})`
      ).join('\n')

      const prompt = `คุณเป็น AI แพทย์ผู้ช่วยของ ClickCare ที่ช่วยวิเคราะห์อาการเบื้องต้นและแนะนำแผนกที่ควรพบแพทย์
      
แพทย์ที่มีในระบบ:
${doctorContext}

แผนกที่มี: ${deptSummary}

ผู้ใช้บอกว่า: "${userMsg}"

โปรดตอบ:
1. วิเคราะห์อาการเบื้องต้น (สั้น กระชับ)
2. แนะนำแผนกที่ควรพบแพทย์
3. แนะนำแพทย์ 2-3 ท่านที่เหมาะสม (ระบุชื่อ แผนก โรงพยาบาล และราคา)
4. คำแนะนำเพิ่มเติม

หมายเหตุ: นี่คือคำแนะนำเบื้องต้นเท่านั้น ไม่ใช่การวินิจฉัยทางการแพทย์`

      const resp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
          })
        }
      )
      const data = await resp.json()
      let reply = data?.candidates?.[0]?.content?.parts?.[0]?.text

      // ถ้า API ตอบกลับมาสั้นผิดปกติ ให้ใช้ NLP แทน
      if (!reply || reply.length < 50) {
        throw new Error('API response truncated or invalid')
      }

      setAiChat(c => [...c, { role: 'ai', text: reply }])
    } catch (err) {
      console.warn('Gemini API failed or truncated, falling back to NLP', err)
      let debugInfo = ''
      if (!GEMINI_KEY) debugInfo = '\n\n[Debug: API Key is missing! Please check Vercel Environment Variables]'
      else debugInfo = `\n\n[Debug Error: ${err.message}]`
      
      const nlpReply = analyzeSymptomWithNLP(userMsg) + debugInfo
      setAiChat(c => [...c, { role: 'ai', text: nlpReply }])
    } finally {
      setAiLoading(false)
    }
  }

  const formatDate = (d) => new Date(d).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <div className="home-page page-content">
      {/* Hero Banner */}
      <div className="home-hero">
        <div className="container">
          <div className="home-hero-inner">
            <div className="home-hero-text">
              <p className="home-hero-date">{today}</p>
              <h1 className="home-hero-title">
                สวัสดี, <span>{user?.name?.split(' ')[0]}</span> 👋
              </h1>
              <p className="home-hero-sub">ดูแลสุขภาพของคุณกับ ClickCare พบแพทย์ออนไลน์ง่ายๆ ในคลิกเดียว</p>
              <div className="home-hero-actions">
                <button className="btn btn-primary btn-lg" onClick={() => navigate('/doctors')}>
                  <Users size={18} /> ค้นหาแพทย์
                </button>
                <button className="btn" style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.3)' }}
                  onClick={() => setAiOpen(true)}>
                  <Sparkles size={18} /> ถามอาการกับ AI
                </button>
              </div>
            </div>
            <div className="home-hero-illustration">
              <div className="home-stats-grid">
                {stats && <>
                  <div className="home-stat-card">
                    <Heart size={20} className="home-stat-icon" style={{ color: '#ef4444' }} />
                    <div className="home-stat-num">{stats.totalPts}</div>
                    <div className="home-stat-label">ผู้ป่วย</div>
                  </div>
                  <div className="home-stat-card">
                    <Calendar size={20} className="home-stat-icon" style={{ color: '#006bcd' }} />
                    <div className="home-stat-num">{stats.totalApts}</div>
                    <div className="home-stat-label">นัดหมาย</div>
                  </div>
                  <div className="home-stat-card">
                    <Users size={20} className="home-stat-icon" style={{ color: '#00cca9' }} />
                    <div className="home-stat-num">50</div>
                    <div className="home-stat-label">แพทย์</div>
                  </div>
                  <div className="home-stat-card">
                    <TrendingUp size={20} className="home-stat-icon" style={{ color: '#f59e0b' }} />
                    <div className="home-stat-num">{100 - parseFloat(stats.noShowRate || 0)}%</div>
                    <div className="home-stat-label">ความพึงพอใจ</div>
                  </div>
                </>}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        {/* Upcoming appointments */}
        {upcomingApts.length > 0 && (
          <section className="home-section fade-in">
            <div className="home-section-header">
              <div>
                <h2 className="section-title">นัดหมายที่กำลังจะมาถึง</h2>
                <p className="section-subtitle">การนัดหมายที่ยืนยันแล้วของคุณ</p>
              </div>
              <Link to="/appointments" className="btn btn-secondary btn-sm">ดูทั้งหมด <ChevronRight size={14} /></Link>
            </div>
            <div className="home-apts-list">
              {upcomingApts.map(a => (
                <Link to={`/appointments/${a.apt_id}`} key={a.apt_id} className="home-apt-card card card-hover">
                  <div className="home-apt-date">
                    <Calendar size={16} />
                    {formatDate(a.date)}
                  </div>
                  <div className="home-apt-info">
                    <div className="avatar" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
                      {a.doctor_name?.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--gray-900)', fontSize: '0.9rem' }}>{a.doctor_name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>{a.department} · {a.hospital}</div>
                    </div>
                  </div>
                  <span className="badge badge-confirmed">{a.symptom}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Departments */}
        <section className="home-section fade-in">
          <div className="home-section-header">
            <div>
              <h2 className="section-title">แผนกผู้เชี่ยวชาญ</h2>
              <p className="section-subtitle">เลือกแผนกที่ต้องการพบแพทย์</p>
            </div>
          </div>
          <div className="home-depts-grid">
            {DEPARTMENTS.map(d => (
              <button
                key={d.name}
                className="home-dept-card"
                style={{ background: d.color, color: d.text }}
                onClick={() => navigate(`/doctors?department=${d.name}`)}
              >
                <span className="home-dept-emoji">{d.emoji}</span>
                <span className="home-dept-name">{d.name}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Top doctors */}
        {topDoctors.length > 0 && (
          <section className="home-section fade-in">
            <div className="home-section-header">
              <div>
                <h2 className="section-title">แพทย์ออนไลน์แนะนำ</h2>
                <p className="section-subtitle">แพทย์ที่ให้บริการปรึกษาออนไลน์</p>
              </div>
              <Link to="/doctors" className="btn btn-secondary btn-sm">ดูทั้งหมด <ChevronRight size={14} /></Link>
            </div>
            <div className="home-doctors-grid">
              {topDoctors.map(d => (
                <Link to={`/doctors/${d.doctor_id}`} key={d.doctor_id} className="home-doctor-card card card-hover">
                  <div className="home-doctor-header">
                    <div className="avatar avatar-lg" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
                      {d.name?.replace('Dr. ', '').charAt(0)}
                    </div>
                    <span className="badge" style={{ background: '#f0fdf4', color: '#15803d', fontSize: '0.72rem' }}>🟢 Online</span>
                  </div>
                  <h3 className="home-doctor-name">{d.name}</h3>
                  <div className="home-doctor-dept">{d.department}</div>
                  <div className="home-doctor-hospital"><MapPin size={12} />{d.hospital}</div>
                  <div className="home-doctor-meta">
                    <span className="stars">{'★'.repeat(Math.round(d.rating))}</span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--gray-600)' }}>{d.rating}</span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--primary)', fontWeight: 600, marginLeft: 'auto' }}>฿{d.fee?.toLocaleString()}</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* AI Chat Floating Button */}
      <button className="home-ai-fab" onClick={() => setAiOpen(true)}>
        <Sparkles size={20} />
        <span>AI ช่วยวิเคราะห์อาการ</span>
      </button>

      {/* AI Chat Modal */}
      {aiOpen && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setAiOpen(false)}>
          <div className="ai-modal">
            <div className="ai-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                <div className="ai-modal-icon"><Sparkles size={18} /></div>
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--gray-900)' }}>AI Symptom Checker</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--gray-500)' }}>Powered by Gemini</div>
                </div>
              </div>
              <button onClick={() => setAiOpen(false)} style={{ color: 'var(--gray-400)' }}><X size={20} /></button>
            </div>

            <div className="ai-modal-disclaimer">
              <AlertCircle size={14} />
              คำแนะนำเบื้องต้นเท่านั้น ไม่ใช่การวินิจฉัยทางการแพทย์
            </div>

            <div className="ai-chat-area">
              {aiChat.length === 0 && (
                <div className="ai-chat-welcome">
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🤖</div>
                  <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>สวัสดีครับ! ผมช่วยวิเคราะห์อาการเบื้องต้นได้</p>
                  <p style={{ fontSize: '0.85rem', color: 'var(--gray-500)' }}>ลองพิมพ์อาการของคุณ เช่น "ปวดหัว เวียนหัว มีไข้" แล้วผมจะแนะนำแพทย์ที่เหมาะสม</p>
                  <div className="ai-suggestions">
                    {['ปวดหัวบ่อย', 'ผื่นคัน', 'หัวใจเต้นเร็ว', 'ปวดเข่า'].map(s => (
                      <button key={s} className="ai-suggestion-btn" onClick={() => { setAiMsg(s) }}>{s}</button>
                    ))}
                  </div>
                </div>
              )}
              {aiChat.map((m, i) => (
                <div key={i} className={`ai-bubble ${m.role}`}>
                  {m.role === 'ai' && <div className="ai-bubble-icon">🤖</div>}
                  <div className="ai-bubble-text" style={{ whiteSpace: 'pre-line' }}>{m.text}</div>
                </div>
              ))}
              {aiLoading && (
                <div className="ai-bubble ai">
                  <div className="ai-bubble-icon">🤖</div>
                  <div className="ai-bubble-text ai-typing">
                    <span /><span /><span />
                  </div>
                </div>
              )}
            </div>

            <div className="ai-chat-input">
              <input
                className="form-input"
                placeholder="อธิบายอาการของคุณ..."
                value={aiMsg}
                onChange={e => setAiMsg(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendAiMessage()}
                style={{ flex: 1 }}
              />
              <button className="btn btn-primary" onClick={sendAiMessage} disabled={aiLoading || !aiMsg.trim()}>
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
