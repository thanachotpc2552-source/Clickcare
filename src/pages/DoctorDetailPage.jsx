import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import {
  ArrowLeft, MapPin, Clock, Star, Video, Building2,
  Languages, DollarSign, Calendar, CheckCircle, X
} from 'lucide-react'
import './DoctorDetailPage.css'

const SYMPTOMS = ['Chest pain','Headache','Allergy','Sore throat','Flu symptoms','Dizziness',
  'Joint pain','Pregnancy checkup','Acne','Vision problem','Anxiety','Back pain',
  'Toothache','Stomach ache','Skin rash','Sleep disorder','Vaccination','Annual Checkup']

const TIME_SLOTS = [
  { time: '09:00', label: '09:00 น.' },
  { time: '10:00', label: '10:00 น.' },
  { time: '11:00', label: '11:00 น.' },
  { time: '13:00', label: '13:00 น.' },
  { time: '14:00', label: '14:00 น.' },
  { time: '15:00', label: '15:00 น.' },
  { time: '16:00', label: '16:00 น.' },
]

export default function DoctorDetailPage() {
  const { id } = useParams()
  const { user, authFetch } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [doctor, setDoctor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [bookOpen, setBookOpen] = useState(false)
  const [bookForm, setBookForm] = useState({ date: '', time_slot: '', symptom: '', consult_type: 'clinic', notes: '' })
  const [booking, setBooking] = useState(false)
  const [queueInfo, setQueueInfo] = useState(null)

  // Generate mock queue info when date + time selected
  useEffect(() => {
    if (bookForm.date && bookForm.time_slot) {
      const seed = bookForm.date.charCodeAt(8) + bookForm.time_slot.charCodeAt(1)
      const currentQueue = (seed % 5) + 1
      const totalSlots = 8
      const remaining = totalSlots - currentQueue
      setQueueInfo({ currentQueue, totalSlots, remaining, waitTime: currentQueue * 15 })
    } else {
      setQueueInfo(null)
    }
  }, [bookForm.date, bookForm.time_slot])

  useEffect(() => {
    authFetch(`/api/doctors/${id}`)
      .then(r => r.success && setDoctor(r.data))
      .finally(() => setLoading(false))
  }, [id])

  const handleBook = async (e) => {
    e.preventDefault()
    if (!bookForm.date || !bookForm.time_slot || !bookForm.symptom) { toast('กรุณากรอกข้อมูลให้ครบ', 'error'); return }
    setBooking(true)
    try {
      const res = await authFetch('/api/appointments', {
        method: 'POST',
        body: JSON.stringify({
          user_id: user.user_id,
          doctor_id: id,
          date: bookForm.date,
          symptom: bookForm.symptom,
          consult_type: bookForm.consult_type,
          notes: bookForm.notes
        })
      })
      if (!res.success) throw new Error(res.error)
      toast('จองนัดหมายสำเร็จ! 🎉', 'success')
      setBookOpen(false)
      navigate('/appointments')
    } catch (err) {
      toast(err.message || 'เกิดข้อผิดพลาด', 'error')
    } finally {
      setBooking(false)
    }
  }

  if (loading) return (
    <div className="page-content">
      <div className="container">
        <div className="doctor-detail-skeleton">
          <div className="skeleton" style={{ height: 200, borderRadius: 'var(--radius-lg)', marginBottom: '1.5rem' }} />
          <div className="skeleton" style={{ height: 24, width: '50%', marginBottom: '0.75rem' }} />
          <div className="skeleton" style={{ height: 16, width: '30%' }} />
        </div>
      </div>
    </div>
  )

  if (!doctor) return (
    <div className="page-content">
      <div className="container">
        <div className="empty-state"><h3>ไม่พบข้อมูลแพทย์</h3></div>
      </div>
    </div>
  )

  const stars = Math.round(doctor.rating)

  return (
    <div className="page-content">
      <div className="container fade-in">
        {/* Back */}
        <button className="btn btn-secondary btn-sm" style={{ marginBottom: '1.25rem' }} onClick={() => navigate(-1)}>
          <ArrowLeft size={15} /> ย้อนกลับ
        </button>

        <div className="doctor-detail-layout">
          {/* Main */}
          <div className="doctor-detail-main">
            {/* Profile card */}
            <div className="card doctor-detail-profile">
              <div className="doctor-detail-hero">
                <div className="avatar" style={{ width: 88, height: 88, fontSize: '2rem', background: 'rgba(255,255,255,0.2)', color: 'white', border: '3px solid rgba(255,255,255,0.4)' }}>
                  {doctor.name?.replace('Dr. ', '').charAt(0)}
                </div>
                <div className="doctor-detail-hero-info">
                  <h1>{doctor.name}</h1>
                  <div className="doctor-detail-dept">{doctor.department}</div>
                  <div className="doctor-detail-hospital"><MapPin size={14} />{doctor.hospital}</div>
                  <div className="doctor-detail-rating">
                    <span className="stars">{Array(stars).fill('★').join('')}</span>
                    <span>{doctor.rating}</span>
                    <span className="doctor-detail-apt-count">({doctor.appointment_count} การนัดหมาย)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Info cards */}
            <div className="doctor-detail-info-grid">
              <div className="card doctor-detail-info-card">
                <div className="doctor-detail-info-icon" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
                  {doctor.consult_type === 'video' ? <Video size={18} /> : <Building2 size={18} />}
                </div>
                <div>
                  <div className="doctor-detail-info-label">ประเภทการปรึกษา</div>
                  <div className="doctor-detail-info-value">
                    {doctor.consult_type === 'video' ? 'Video Online' : 'คลินิก'}
                  </div>
                </div>
              </div>
              <div className="card doctor-detail-info-card">
                <div className="doctor-detail-info-icon" style={{ background: 'var(--warning-light)', color: '#92400e' }}>
                  <Clock size={18} />
                </div>
                <div>
                  <div className="doctor-detail-info-label">เวลาทำการ</div>
                  <div className="doctor-detail-info-value">{doctor.availability}</div>
                </div>
              </div>
              <div className="card doctor-detail-info-card">
                <div className="doctor-detail-info-icon" style={{ background: 'var(--success-light)', color: '#065f46' }}>
                  <Languages size={18} />
                </div>
                <div>
                  <div className="doctor-detail-info-label">ภาษาที่ใช้ได้</div>
                  <div className="doctor-detail-info-value">{doctor.languages}</div>
                </div>
              </div>
              <div className="card doctor-detail-info-card">
                <div className="doctor-detail-info-icon" style={{ background: '#fef3c7', color: '#92400e' }}>
                  <DollarSign size={18} />
                </div>
                <div>
                  <div className="doctor-detail-info-label">ค่าปรึกษา</div>
                  <div className="doctor-detail-info-value" style={{ color: 'var(--primary)' }}>฿{doctor.fee?.toLocaleString()}</div>
                </div>
              </div>
            </div>

            {/* About (generated) */}
            <div className="card" style={{ padding: '1.5rem' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.875rem' }}>เกี่ยวกับแพทย์</h2>
              <p style={{ color: 'var(--gray-600)', lineHeight: 1.8, fontSize: '0.925rem' }}>
                {doctor.name} เป็นแพทย์ผู้เชี่ยวชาญด้าน {doctor.department} ประจำ {doctor.hospital}
                ให้บริการทั้งการปรึกษาออนไลน์และที่คลินิก รับผู้ป่วยทุกวัย มีความเชี่ยวชาญในการวินิจฉัยและรักษาโรคในสาขา {doctor.department}
                โดยใช้เทคนิคและเทคโนโลยีทางการแพทย์ที่ทันสมัย
              </p>
            </div>
          </div>

          {/* Sidebar */}
          <div className="doctor-detail-sidebar">
            <div className="card doctor-book-card">
              <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>จองนัดหมาย</h3>
              <div className="doctor-book-fee">
                <span>ค่าปรึกษา</span>
                <span style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--primary)' }}>฿{doctor.fee?.toLocaleString()}</span>
              </div>
              <div className="doctor-book-features">
                {['จองง่าย ใช้เวลาไม่ถึง 1 นาที', 'ยืนยันทันทีผ่าน SMS/Email', 'ฟรีค่าบริการจอง'].map(f => (
                  <div key={f} className="doctor-book-feature">
                    <CheckCircle size={14} className="doctor-book-feature-icon" />
                    {f}
                  </div>
                ))}
              </div>
              <button className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => setBookOpen(true)}>
                <Calendar size={18} /> จองนัดหมาย
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Book Modal */}
      {bookOpen && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setBookOpen(false)}>
          <div className="modal-box">
            <div className="modal-header">
              <div>
                <h3 style={{ fontWeight: 700, color: 'var(--gray-900)' }}>จองนัดหมาย</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--gray-500)', marginTop: 2 }}>{doctor.name} · {doctor.department}</p>
              </div>
              <button onClick={() => setBookOpen(false)} style={{ color: 'var(--gray-400)' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleBook}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">วันที่นัดหมาย *</label>
                  <input
                    type="date"
                    className="form-input"
                    min={new Date().toISOString().split('T')[0]}
                    value={bookForm.date}
                    onChange={e => setBookForm(f => ({ ...f, date: e.target.value, time_slot: '' }))}
                    required
                  />
                </div>
                {bookForm.date && (
                  <div className="form-group">
                    <label className="form-label">เลือกช่วงเวลา *</label>
                    <div className="time-slots-grid">
                      {TIME_SLOTS.map(slot => {
                        const seed = bookForm.date.charCodeAt(8) + slot.time.charCodeAt(1)
                        const booked = (seed % 8) + 1
                        const total = 8
                        const remaining = total - booked
                        const isFull = remaining <= 0
                        return (
                          <button
                            type="button"
                            key={slot.time}
                            className={`time-slot-btn ${bookForm.time_slot === slot.time ? 'selected' : ''} ${isFull ? 'full' : ''}`}
                            onClick={() => !isFull && setBookForm(f => ({ ...f, time_slot: slot.time }))}
                            disabled={isFull}
                          >
                            <span className="time-slot-time">{slot.label}</span>
                            <span className={`time-slot-remain ${remaining <= 2 ? 'low' : ''}`}>
                              {isFull ? 'เต็ม' : `เหลือ ${remaining} คิว`}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
                {queueInfo && (
                  <div className="queue-info-card">
                    <div className="queue-info-header">📋 ข้อมูลคิวของคุณ</div>
                    <div className="queue-info-grid">
                      <div className="queue-info-item">
                        <div className="queue-info-num">{queueInfo.currentQueue + 1}</div>
                        <div className="queue-info-label">ลำดับคิว</div>
                      </div>
                      <div className="queue-info-item">
                        <div className="queue-info-num">~{queueInfo.waitTime} นาที</div>
                        <div className="queue-info-label">เวลารอโดยประมาณ</div>
                      </div>
                      <div className="queue-info-item">
                        <div className="queue-info-num">{queueInfo.remaining}</div>
                        <div className="queue-info-label">คิวที่เหลือ</div>
                      </div>
                    </div>
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label">อาการ / เหตุผลการมาพบแพทย์ *</label>
                  <select
                    className="form-input form-select"
                    value={bookForm.symptom}
                    onChange={e => setBookForm(f => ({ ...f, symptom: e.target.value }))}
                    required
                  >
                    <option value="">เลือกอาการ</option>
                    {SYMPTOMS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">ประเภทการปรึกษา</label>
                  <select
                    className="form-input form-select"
                    value={bookForm.consult_type}
                    onChange={e => setBookForm(f => ({ ...f, consult_type: e.target.value }))}
                  >
                    <option value="clinic">คลินิก (เจอตัว)</option>
                    <option value="video">Video Call (ออนไลน์)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">หมายเหตุเพิ่มเติม</label>
                  <textarea
                    className="form-input"
                    placeholder="อธิบายอาการเพิ่มเติม..."
                    rows={3}
                    value={bookForm.notes}
                    onChange={e => setBookForm(f => ({ ...f, notes: e.target.value }))}
                    style={{ resize: 'vertical' }}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setBookOpen(false)}>ยกเลิก</button>
                <button type="submit" className="btn btn-primary" disabled={booking}>
                  {booking ? <span className="spinner" /> : <><Calendar size={16} /> ยืนยันจองนัด</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
