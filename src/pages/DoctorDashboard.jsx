import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  Calendar, Users, CheckCircle2, Clock, Stethoscope,
  TrendingUp, AlertTriangle, Activity, ChevronRight, Star
} from 'lucide-react'
import './DoctorDashboard.css'

// Mock patients for the doctor's queue
const MOCK_PATIENTS = [
  { id: 'p01', name: 'นายสมชาย ใจดี', symptom: 'Headache', time: '09:00', type: 'clinic', urgent: false },
  { id: 'p02', name: 'นางสาวมาลี รักสุข', symptom: 'Anxiety', time: '10:00', type: 'video', urgent: false },
  { id: 'p03', name: 'นายวิชัย สุขสันต์', symptom: 'Chest pain', time: '11:00', type: 'clinic', urgent: true },
  { id: 'p04', name: 'นางสาวพิม สวยงาม', symptom: 'Dizziness', time: '13:00', type: 'video', urgent: false },
  { id: 'p05', name: 'เด็กชายกอล์ฟ เด็กดี', symptom: 'Flu symptoms', time: '14:00', type: 'clinic', urgent: false },
]

const MOCK_STATS = {
  todayTotal: 8,
  todayDone: 3,
  todayPending: 5,
  thisWeek: 34,
  avgRating: 4.8,
  totalPatients: 1205,
}

export default function DoctorDashboard() {
  const { user, authFetch } = useAuth()
  const [myApts, setMyApts] = useState([])
  const [loading, setLoading] = useState(true)
  const [queueStatus, setQueueStatus] = useState({}) // track completed in-session

  useEffect(() => {
    authFetch(`/api/appointments?user_id=${user.user_id}`)
      .then(r => r.success && setMyApts(r.data || []))
      .finally(() => setLoading(false))
  }, [user.user_id])

  const today = new Date().toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  const kpis = [
    { label: 'ผู้ป่วยวันนี้', value: MOCK_STATS.todayTotal, icon: <Users size={22} />, color: '#006bcd', bg: 'var(--primary-light)' },
    { label: 'เสร็จแล้ว', value: MOCK_STATS.todayDone, icon: <CheckCircle2 size={22} />, color: '#10b981', bg: 'var(--success-light)' },
    { label: 'รอตรวจ', value: MOCK_STATS.todayPending, icon: <Clock size={22} />, color: '#f59e0b', bg: 'var(--warning-light)' },
    { label: 'คะแนนรีวิว', value: MOCK_STATS.avgRating, icon: <Star size={22} />, color: '#8b5cf6', bg: '#ede9fe' },
  ]

  const upcoming = myApts.filter(a => ['PENDING','CONFIRMED'].includes(a.status))
  const completionPct = Math.round((MOCK_STATS.todayDone / MOCK_STATS.todayTotal) * 100)

  const markDone = (id) => setQueueStatus(s => ({ ...s, [id]: 'done' }))

  return (
    <div className="page-content">
      {/* Doctor Hero */}
      <div className="doctor-dash-hero">
        <div className="container">
          <div className="doctor-dash-hero-inner">
            <div className="doctor-dash-hero-text">
              <h1>สวัสดี, {user?.name?.split(' ')[0]} 👨‍⚕️</h1>
              <p>{today}</p>
            </div>
            <div className="doctor-dash-hero-badge">
              <Stethoscope size={16} />
              {user?.department || 'แพทย์'} · {MOCK_STATS.totalPatients.toLocaleString()} ผู้ป่วยสะสม
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        {/* KPI Cards */}
        <div className="doctor-kpi-grid">
          {kpis.map(k => (
            <div key={k.label} className="card doctor-kpi-card">
              <div className="doctor-kpi-icon" style={{ background: k.bg, color: k.color }}>{k.icon}</div>
              <div>
                <div className="doctor-kpi-val">{k.value}</div>
                <div className="doctor-kpi-label">{k.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Main grid */}
        <div className="doctor-dash-grid">
          {/* Today's Queue */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--gray-900)' }}>🩺 คิวผู้ป่วยวันนี้</h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--gray-500)', marginTop: 2 }}>
                  เสร็จแล้ว {MOCK_STATS.todayDone}/{MOCK_STATS.todayTotal} คน ({completionPct}%)
                </p>
              </div>
              <div style={{ width: 80, background: 'var(--gray-100)', borderRadius: 100, height: 8, overflow: 'hidden' }}>
                <div style={{ width: `${completionPct}%`, height: '100%', background: 'var(--success)', borderRadius: 100 }} />
              </div>
            </div>
            <div className="doctor-queue-list">
              {MOCK_PATIENTS.map((p, i) => {
                const done = queueStatus[p.id] === 'done'
                return (
                  <div key={p.id} className="doctor-queue-item" style={{ opacity: done ? 0.5 : 1 }}>
                    <div className={`doctor-queue-num ${p.urgent ? 'urgent' : ''}`}>
                      {done ? '✓' : i + 1}
                    </div>
                    <div className="doctor-queue-info">
                      <div className="doctor-queue-name">{p.name}</div>
                      <div className="doctor-queue-meta">{p.symptom} · {p.type === 'video' ? '🎥 ออนไลน์' : '🏥 คลินิก'}</div>
                      {!done && (
                        <div className="doctor-apt-actions">
                          <button className="doctor-apt-btn complete" onClick={() => markDone(p.id)}>
                            ✓ ตรวจเสร็จแล้ว
                          </button>
                          {p.type === 'video' && (
                            <button className="doctor-apt-btn" style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}>
                              🎥 เข้าห้องตรวจ
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="doctor-queue-time">{p.time} น.</div>
                    {p.urgent && !done && <span className="badge" style={{ background: '#fee2e2', color: '#dc2626', fontSize: '0.68rem' }}>เร่งด่วน</span>}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Right: mini stats + schedule */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Weekly stats */}
            <div className="card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--gray-900)' }}>📊 สรุปสัปดาห์นี้</h3>
              <div className="doctor-mini-stats">
                {[
                  { label: 'ผู้ป่วยทั้งหมด', value: MOCK_STATS.thisWeek, max: 50, color: '#006bcd' },
                  { label: 'นัด Video Call', value: 14, max: 50, color: '#8b5cf6' },
                  { label: 'ผู้ป่วยใหม่', value: 9, max: 50, color: '#10b981' },
                ].map(s => (
                  <div key={s.label} className="card doctor-mini-stat-card" style={{ padding: '0.875rem' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--gray-600)' }}>{s.label}</span>
                        <span style={{ fontSize: '0.875rem', fontWeight: 700, color: s.color }}>{s.value}</span>
                      </div>
                      <div className="doctor-mini-stat-bar-wrap">
                        <div className="doctor-mini-stat-bar" style={{ width: `${(s.value / s.max) * 100}%`, background: s.color }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Upcoming appointments from mock data */}
            <div className="card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--gray-900)' }}>📅 ตารางนัดหมาย</h3>
                <Link to="/appointments" style={{ fontSize: '0.78rem', color: 'var(--primary)' }}>ดูทั้งหมด</Link>
              </div>
              <div className="doctor-schedule-list">
                {MOCK_PATIENTS.slice(0, 4).map(p => (
                  <div key={p.id} className="doctor-schedule-item">
                    <div className="doctor-schedule-time">{p.time}</div>
                    <div>
                      <div className="doctor-schedule-patient">{p.name}</div>
                      <div className="doctor-schedule-symptom">{p.symptom}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
