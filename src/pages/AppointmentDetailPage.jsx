import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { ArrowLeft, Calendar, User, Hospital, FileText, Pill, Video, XCircle, CheckCircle2, Clock, AlertCircle } from 'lucide-react'
import './AppointmentDetailPage.css'

const STATUS_TH = { PENDING:'รอยืนยัน', CONFIRMED:'ยืนยันแล้ว', COMPLETED:'เสร็จสิ้น', CANCELLED:'ยกเลิก', NO_SHOW:'ไม่มา' }
const STATUS_STEP = { PENDING: 0, CONFIRMED: 1, COMPLETED: 2, CANCELLED: -1, NO_SHOW: -1 }

export default function AppointmentDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { authFetch } = useAuth()
  const { toast } = useToast()
  const [apt, setApt] = useState(null)
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)

  const load = () => {
    authFetch(`/api/appointments/${id}`)
      .then(r => r.success && setApt(r.data))
      .finally(() => setLoading(false))
  }
  useEffect(load, [id])

  const handleCancel = async () => {
    if (!confirm('ต้องการยกเลิกการนัดหมายนี้?')) return
    setCancelling(true)
    try {
      const res = await authFetch(`/api/appointments/${id}`, { method: 'DELETE' })
      if (!res.success) throw new Error(res.error)
      toast('ยกเลิกนัดหมายแล้ว', 'info')
      setApt(a => ({ ...a, status: 'CANCELLED' }))
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setCancelling(false)
    }
  }

  if (loading) return (
    <div className="page-content"><div className="container">
      <div className="skeleton" style={{ height: 300, borderRadius: 'var(--radius-lg)' }} />
    </div></div>
  )
  if (!apt) return (
    <div className="page-content"><div className="container">
      <div className="empty-state"><h3>ไม่พบข้อมูลการนัดหมาย</h3></div>
    </div></div>
  )

  const step = STATUS_STEP[apt.status]
  const formatDate = (d) => new Date(d).toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const isUpcoming = new Date(apt.date) >= new Date()

  return (
    <div className="page-content">
      <div className="container fade-in">
        <button className="btn btn-secondary btn-sm" style={{ marginBottom: '1.25rem' }} onClick={() => navigate(-1)}>
          <ArrowLeft size={15} /> ย้อนกลับ
        </button>

        {/* Status header */}
        <div className={`apt-detail-status-card ${apt.status.toLowerCase()}`}>
          <div className="apt-detail-status-left">
            <div className="apt-detail-status-icon">
              {apt.status === 'COMPLETED' ? <CheckCircle2 size={28} /> :
               apt.status === 'CANCELLED' || apt.status === 'NO_SHOW' ? <XCircle size={28} /> :
               <Clock size={28} />}
            </div>
            <div>
              <div className="apt-detail-status-label">สถานะการนัดหมาย</div>
              <div className="apt-detail-status-text">{STATUS_TH[apt.status]}</div>
            </div>
          </div>
          <div className="apt-detail-id">#{apt.apt_id}</div>
        </div>

        {/* Progress stepper (only for active) */}
        {step >= 0 && (
          <div className="card apt-detail-stepper">
            {['จองแล้ว','ยืนยันแล้ว','เสร็จสิ้น'].map((s, i) => (
              <div key={s} className={`apt-step ${i <= step ? 'done' : ''} ${i === step ? 'current' : ''}`}>
                <div className="apt-step-dot">{i < step ? '✓' : i + 1}</div>
                <div className="apt-step-label">{s}</div>
                {i < 2 && <div className={`apt-step-line ${i < step ? 'done' : ''}`} />}
              </div>
            ))}
          </div>
        )}

        <div className="apt-detail-layout">
          {/* Left */}
          <div className="apt-detail-main">
            {/* Doctor info */}
            <div className="card apt-detail-section">
              <h2 className="apt-detail-section-title"><User size={17} /> ข้อมูลแพทย์</h2>
              <div className="apt-detail-doctor">
                <div className="avatar avatar-lg" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
                  {apt.doctor_name?.charAt(0)}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--gray-900)' }}>{apt.doctor_name}</div>
                  <div style={{ color: 'var(--primary)', fontSize: '0.875rem', fontWeight: 500 }}>{apt.department}</div>
                  <div style={{ color: 'var(--gray-500)', fontSize: '0.82rem', marginTop: 2 }}>{apt.hospital}</div>
                  <div style={{ marginTop: 6 }}>
                    <span className={`badge ${apt.doctor_consult === 'video' ? 'badge-confirmed' : 'badge-member'}`} style={{ fontSize: '0.72rem' }}>
                      {apt.doctor_consult === 'video' ? '🎥 ออนไลน์' : '🏥 คลินิก'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Appointment details */}
            <div className="card apt-detail-section">
              <h2 className="apt-detail-section-title"><Calendar size={17} /> รายละเอียดการนัดหมาย</h2>
              <div className="apt-detail-rows">
                <div className="apt-detail-row">
                  <span className="apt-detail-row-label">วันที่นัดหมาย</span>
                  <span className="apt-detail-row-value">{formatDate(apt.date)}</span>
                </div>
                <div className="apt-detail-row">
                  <span className="apt-detail-row-label">อาการ / เหตุผล</span>
                  <span className="apt-detail-row-value">{apt.symptom}</span>
                </div>
                <div className="apt-detail-row">
                  <span className="apt-detail-row-label">ICD-10 Code</span>
                  <span className="apt-detail-row-value" style={{ fontFamily: 'monospace', background: 'var(--gray-100)', padding: '0.2rem 0.5rem', borderRadius: 4 }}>
                    {apt.icd_code || 'Z00.0'}
                  </span>
                </div>
                {apt.notes && <div className="apt-detail-row">
                  <span className="apt-detail-row-label">หมายเหตุ</span>
                  <span className="apt-detail-row-value">{apt.notes}</span>
                </div>}
                <div className="apt-detail-row">
                  <span className="apt-detail-row-label">ค่าปรึกษา</span>
                  <span className="apt-detail-row-value" style={{ color: 'var(--primary)', fontWeight: 700 }}>฿{apt.fee?.toLocaleString() || '-'}</span>
                </div>
              </div>
            </div>

            {/* Medical record (if completed) */}
            {apt.medical_record && (
              <div className="card apt-detail-section apt-detail-medical">
                <h2 className="apt-detail-section-title"><FileText size={17} /> บันทึกการรักษา</h2>
                <div className="apt-detail-rows">
                  <div className="apt-detail-row">
                    <span className="apt-detail-row-label">การวินิจฉัย</span>
                    <span className="apt-detail-row-value">{apt.medical_record.diagnosis}</span>
                  </div>
                  <div className="apt-detail-row">
                    <span className="apt-detail-row-label">ใบสั่งยา</span>
                    <span className="apt-detail-row-value" style={{ color: 'var(--success)', fontWeight: 600 }}>
                      <Pill size={14} style={{ display: 'inline', marginRight: 4 }} />
                      {apt.medical_record.prescription}
                    </span>
                  </div>
                  <div className="apt-detail-row">
                    <span className="apt-detail-row-label">ใบรับรองแพทย์</span>
                    <a href={apt.medical_record.mc_url} target="_blank" rel="noopener noreferrer"
                      className="btn btn-secondary btn-sm" style={{ fontSize: '0.78rem' }}>
                      <FileText size={13} /> ดาวน์โหลด e-MC
                    </a>
                  </div>
                  <div className="apt-detail-row">
                    <span className="apt-detail-row-label">หมายเหตุแพทย์</span>
                    <span className="apt-detail-row-value">{apt.medical_record.notes}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Virtual room (for video + confirmed) */}
            {apt.doctor_consult === 'video' && apt.status === 'CONFIRMED' && (
              <div className="card apt-detail-section apt-detail-video">
                <h2 className="apt-detail-section-title"><Video size={17} /> ห้องประชุมออนไลน์</h2>
                <p style={{ color: 'var(--gray-600)', fontSize: '0.875rem', marginBottom: '1rem' }}>
                  คลิกปุ่มด้านล่างเพื่อเข้าร่วมการประชุมออนไลน์กับแพทย์ในวันนัดหมาย
                </p>
                <button className="btn btn-accent btn-lg">
                  <Video size={18} /> เข้าห้องประชุม (จำลอง)
                </button>
              </div>
            )}
          </div>

          {/* Right actions */}
          <div className="apt-detail-sidebar">
            <div className="card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontWeight: 700, marginBottom: '1rem', fontSize: '0.95rem' }}>การดำเนินการ</h3>
              {['PENDING','CONFIRMED'].includes(apt.status) && (
                <>
                  <Link to={`/doctors/${apt.doctor_id}`} className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center', marginBottom: '0.75rem' }}>
                    ดูโปรไฟล์แพทย์
                  </Link>
                  <button className="btn btn-danger" style={{ width: '100%', justifyContent: 'center' }}
                    onClick={handleCancel} disabled={cancelling}>
                    {cancelling ? <span className="spinner" /> : <><XCircle size={16} /> ยกเลิกนัดหมาย</>}
                  </button>
                </>
              )}
              {apt.status === 'COMPLETED' && (
                <Link to={`/doctors/${apt.doctor_id}`} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                  <Calendar size={16} /> จองนัดใหม่
                </Link>
              )}
              {['CANCELLED','NO_SHOW'].includes(apt.status) && (
                <Link to="/doctors" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                  <Calendar size={16} /> ค้นหาแพทย์
                </Link>
              )}
            </div>

            {/* Patient info */}
            {apt.patient_name && (
              <div className="card" style={{ padding: '1.25rem', marginTop: '1rem' }}>
                <h3 style={{ fontWeight: 700, marginBottom: '0.875rem', fontSize: '0.875rem', color: 'var(--gray-700)' }}>ข้อมูลผู้ป่วย</h3>
                <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div>{apt.patient_name}</div>
                  <div>{apt.patient_email}</div>
                  {apt.patient_phone && <div>{apt.patient_phone}</div>}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
