import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import {
  Calendar, Users, CheckCircle2, Clock, Stethoscope,
  TrendingUp, AlertTriangle, Activity, ChevronRight, Star, X
} from 'lucide-react'
import './DoctorDashboard.css'

export default function DoctorDashboard() {
  const { user, authFetch } = useAuth()
  const { toast } = useToast()
  const [myApts, setMyApts] = useState([])
  const [loading, setLoading] = useState(true)
  const [diagnoseOpen, setDiagnoseOpen] = useState(false)
  const [selectedApt, setSelectedApt] = useState(null)
  
  // Diagnose form
  const [diagnoseForm, setDiagnoseForm] = useState({
    diagnosis_code: 'R51.9', // Default headache
    diagnosis_desc: 'Headache, unspecified',
    allergies: 'None',
    prescription: 'Paracetamol 500mg - 1 tab every 6 hours as needed',
    chief_complaint: 'Severe headache and stress'
  })
  const [saving, setSaving] = useState(false)

  // Fetch doctor's appointments
  const fetchAppointments = () => {
    authFetch(`/api/appointments?doctor_id=${user.user_id || 'doc-44'}`)
      .then(r => {
        if (r.success) {
          setMyApts(r.data || [])
        }
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchAppointments()
  }, [user.user_id])

  const todayStr = new Date().toISOString().split('T')[0]
  const todayLabel = new Date().toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  // Filters
  const todayApts = myApts.filter(a => a.date === todayStr || a.date?.startsWith(todayStr))
  const upcomingApts = myApts.filter(a => ['PENDING','CONFIRMED'].includes(a.status))
  
  const todayTotal = todayApts.length
  const todayDone = todayApts.filter(a => a.status === 'COMPLETED').length
  const todayPending = todayApts.filter(a => ['PENDING', 'CONFIRMED'].includes(a.status)).length
  
  const completionPct = todayTotal > 0 ? Math.round((todayDone / todayTotal) * 100) : 0

  const openDiagnoseModal = (apt) => {
    setSelectedApt(apt)
    setDiagnoseForm({
      diagnosis_code: apt.symptom === 'Chest pain' ? 'I20.9' : apt.symptom === 'Flu symptoms' ? 'J11.1' : 'R51.9',
      diagnosis_desc: apt.symptom === 'Chest pain' ? 'Angina pectoris' : apt.symptom === 'Flu symptoms' ? 'Influenza' : 'Headache/Symptom concern',
      allergies: 'None',
      prescription: apt.symptom === 'Chest pain' ? 'Nitroglycerin sublingual' : apt.symptom === 'Flu symptoms' ? 'Oseltamivir 75mg' : 'Paracetamol 500mg',
      chief_complaint: apt.symptom || 'ตรวจอาการทั่วไป'
    })
    setDiagnoseOpen(true)
  }

  const handleCompleteDiagnose = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await authFetch(`/api/appointments/${selectedApt.apt_id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'COMPLETED',
          diagnosis_code: diagnoseForm.diagnosis_code,
          diagnosis_desc: diagnoseForm.diagnosis_desc,
          allergies: diagnoseForm.allergies,
          prescription: diagnoseForm.prescription,
          chief_complaint: diagnoseForm.chief_complaint
        })
      })
      if (!res.success) throw new Error(res.error || 'Failed to complete')
      toast('ตรวจรักษาและบันทึกประวัติสำเร็จ! 📝', 'success')
      setDiagnoseOpen(false)
      fetchAppointments() // Reload
    } catch (err) {
      toast(err.message || 'เกิดข้อผิดพลาด', 'error')
    } finally {
      setSaving(false)
    }
  }

  const kpis = [
    { label: 'ผู้ป่วยวันนี้', value: todayTotal, icon: <Users size={22} />, color: '#006bcd', bg: 'var(--primary-light)' },
    { label: 'เสร็จแล้ว', value: todayDone, icon: <CheckCircle2 size={22} />, color: '#10b981', bg: 'var(--success-light)' },
    { label: 'รอตรวจ', value: todayPending, icon: <Clock size={22} />, color: '#f59e0b', bg: 'var(--warning-light)' },
    { label: 'ผู้ป่วยสะสมทั้งหมด', value: myApts.length, icon: <Star size={22} />, color: '#8b5cf6', bg: '#ede9fe' },
  ]

  if (loading) return (
    <div className="page-content">
      <div className="container">
        <div className="skeleton" style={{ height: 200, borderRadius: 'var(--radius-lg)', marginBottom: '1.5rem' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem' }}>
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 100, borderRadius: 'var(--radius-lg)' }} />)}
        </div>
      </div>
    </div>
  )

  return (
    <div className="page-content">
      {/* Doctor Hero */}
      <div className="doctor-dash-hero">
        <div className="container">
          <div className="doctor-dash-hero-inner">
            <div className="doctor-dash-hero-text">
              <h1>สวัสดี, {user?.name?.split(' ')[0]} 👨‍⚕️</h1>
              <p>{todayLabel}</p>
            </div>
            <div className="doctor-dash-hero-badge">
              <Stethoscope size={16} />
              {user?.department || 'แพทย์'} · {myApts.length} เคสทั้งหมด
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
                <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--gray-900)' }}>🩺 คิวผู้ป่วยวันนี้ ({todayTotal})</h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--gray-500)', marginTop: 2 }}>
                  เสร็จแล้ว {todayDone}/{todayTotal} คน ({completionPct}%)
                </p>
              </div>
              <div style={{ width: 80, background: 'var(--gray-100)', borderRadius: 100, height: 8, overflow: 'hidden' }}>
                <div style={{ width: `${completionPct}%`, height: '100%', background: 'var(--success)', borderRadius: 100 }} />
              </div>
            </div>

            <div className="doctor-queue-list">
              {todayApts.length === 0 ? (
                <div className="empty-state" style={{ padding: '2rem' }}>
                  <Clock size={36} style={{ color: 'var(--gray-300)', marginBottom: '0.5rem' }} />
                  <p>ไม่มีคิวนัดหมายสำหรับวันนี้</p>
                </div>
              ) : (
                todayApts.map((a, i) => {
                  const done = a.status === 'COMPLETED'
                  return (
                    <div key={a.apt_id} className="doctor-queue-item" style={{ opacity: done ? 0.5 : 1 }}>
                      <div className={`doctor-queue-num ${a.status === 'CONFIRMED' ? 'urgent' : ''}`}>
                        {done ? '✓' : i + 1}
                      </div>
                      <div className="doctor-queue-info">
                        <div className="doctor-queue-name">{a.patient_name || a.user_name || 'คนไข้ทั่วไป'}</div>
                        <div className="doctor-queue-meta">{a.symptom} · {a.consult_type === 'video' ? '🎥 ออนไลน์' : '🏥 คลินิก'}</div>
                        {!done && (
                          <div className="doctor-apt-actions">
                            <button className="doctor-apt-btn complete" onClick={() => openDiagnoseModal(a)}>
                              ✓ วินิจฉัยโรค / สั่งยา
                            </button>
                            {a.consult_type === 'video' && (
                              <button className="doctor-apt-btn" style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }} onClick={() => toast('เปิดบริการวิดีโอคอล... 🎥', 'success')}>
                                🎥 เข้าห้องตรวจ
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="doctor-queue-time">{a.date?.split(' ')[1] || '10:00'} น.</div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Right: schedule */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Upcoming appointments */}
            <div className="card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--gray-900)' }}>📅 ตารางนัดหมายเร็วๆ นี้ ({upcomingApts.length})</h3>
                <Link to="/appointments" style={{ fontSize: '0.78rem', color: 'var(--primary)' }}>ดูทั้งหมด</Link>
              </div>
              <div className="doctor-schedule-list">
                {upcomingApts.length === 0 ? (
                  <p style={{ fontSize: '0.85rem', color: 'var(--gray-500)', textAlign: 'center', padding: '1rem' }}>ไม่มีการนัดหมายที่รอดำเนินการ</p>
                ) : (
                  upcomingApts.slice(0, 5).map(a => (
                    <div key={a.apt_id} className="doctor-schedule-item">
                      <div className="doctor-schedule-time">{a.date}</div>
                      <div>
                        <div className="doctor-schedule-patient">{a.patient_name || a.user_name || 'คนไข้ทั่วไป'}</div>
                        <div className="doctor-schedule-symptom">{a.symptom}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Diagnose & Prescribe Modal */}
      {diagnoseOpen && selectedApt && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setDiagnoseOpen(false)}>
          <div className="modal-box">
            <div className="modal-header">
              <div>
                <h3 style={{ fontWeight: 700, color: 'var(--gray-900)' }}>บันทึกการตรวจรักษา</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--gray-500)', marginTop: 2 }}>
                  คนไข้: {selectedApt.patient_name || selectedApt.user_name} · อาการ: {selectedApt.symptom}
                </p>
              </div>
              <button onClick={() => setDiagnoseOpen(false)} style={{ color: 'var(--gray-400)' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleCompleteDiagnose}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">อาการสำคัญ (Chief Complaint)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={diagnoseForm.chief_complaint}
                    onChange={e => setDiagnoseForm(f => ({ ...f, chief_complaint: e.target.value }))}
                    required
                  />
                </div>
                <div className="login-row">
                  <div className="form-group">
                    <label className="form-label">รหัสวินิจฉัยโรค (ICD-10)</label>
                    <input
                      type="text"
                      className="form-input"
                      value={diagnoseForm.diagnosis_code}
                      onChange={e => setDiagnoseForm(f => ({ ...f, diagnosis_code: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">คำอธิบายโรค (Diagnosis Description)</label>
                    <input
                      type="text"
                      className="form-input"
                      value={diagnoseForm.diagnosis_desc}
                      onChange={e => setDiagnoseForm(f => ({ ...f, diagnosis_desc: e.target.value }))}
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">ประวัติการแพ้ยา / หมายเหตุความปลอดภัย</label>
                  <input
                    type="text"
                    className="form-input"
                    value={diagnoseForm.allergies}
                    onChange={e => setDiagnoseForm(f => ({ ...f, allergies: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">ใบสั่งยาและการรับประทาน (Prescription & Dosage) *</label>
                  <textarea
                    className="form-input"
                    rows={3}
                    value={diagnoseForm.prescription}
                    onChange={e => setDiagnoseForm(f => ({ ...f, prescription: e.target.value }))}
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setDiagnoseOpen(false)}>ยกเลิก</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <span className="spinner" /> : 'บันทึกการรักษาและเสร็จสิ้น'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
