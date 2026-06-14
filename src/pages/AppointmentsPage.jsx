import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Calendar, Clock, ChevronRight, Search, Filter } from 'lucide-react'
import './AppointmentsPage.css'

const STATUSES = ['PENDING','CONFIRMED','COMPLETED','CANCELLED','NO_SHOW']
const STATUS_TH = { PENDING:'รอยืนยัน', CONFIRMED:'ยืนยันแล้ว', COMPLETED:'เสร็จสิ้น', CANCELLED:'ยกเลิก', NO_SHOW:'ไม่มา' }
const STATUS_BADGE = { PENDING:'badge-pending', CONFIRMED:'badge-confirmed', COMPLETED:'badge-completed', CANCELLED:'badge-cancelled', NO_SHOW:'badge-no_show' }
const TABS = [
  { key: 'upcoming', label: 'กำลังจะมา', statuses: ['PENDING','CONFIRMED'] },
  { key: 'past', label: 'ผ่านมาแล้ว', statuses: ['COMPLETED','CANCELLED','NO_SHOW'] },
  { key: 'all', label: 'ทั้งหมด', statuses: [] },
]

export default function AppointmentsPage() {
  const { user, authFetch } = useAuth()
  const [apts, setApts] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('upcoming')
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams({ user_id: user.user_id })
    authFetch(`/api/appointments?${params}`)
      .then(r => r.success && setApts(r.data || []))
      .finally(() => setLoading(false))
  }, [user.user_id])

  const tabDef = TABS.find(t => t.key === tab)
  const filtered = apts.filter(a => {
    const tabMatch = tabDef.statuses.length === 0 || tabDef.statuses.includes(a.status)
    const statusMatch = !statusFilter || a.status === statusFilter
    const searchMatch = !search || a.symptom?.toLowerCase().includes(search.toLowerCase()) || a.doctor_name?.toLowerCase().includes(search.toLowerCase())
    return tabMatch && statusMatch && searchMatch
  })

  const formatDate = (d) => new Date(d).toLocaleDateString('th-TH', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })
  const isUpcoming = (d) => new Date(d) >= new Date()

  return (
    <div className="page-content">
      <div className="container">
        <div className="apts-header fade-in">
          <div>
            <h1 className="section-title">การนัดหมายของฉัน</h1>
            <p className="section-subtitle">จัดการการนัดหมายแพทย์ทั้งหมด</p>
          </div>
          <Link to="/doctors" className="btn btn-primary">
            <Calendar size={16} /> จองนัดใหม่
          </Link>
        </div>

        {/* Tabs */}
        <div className="tabs fade-in" style={{ marginBottom: '1.5rem' }}>
          {TABS.map(t => (
            <button key={t.key} className={`tab-btn ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
              {t.label}
              <span className="tab-count">
                {apts.filter(a => t.statuses.length === 0 || t.statuses.includes(a.status)).length}
              </span>
            </button>
          ))}
        </div>

        {/* Search + filter */}
        <div className="apts-filters card fade-in">
          <div className="apts-search">
            <Search size={16} style={{ color: 'var(--gray-400)' }} />
            <input className="form-input" style={{ border: 'none', boxShadow: 'none' }}
              placeholder="ค้นหาอาการ หรือชื่อแพทย์..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="form-input form-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ width: 'auto' }}>
            <option value="">ทุกสถานะ</option>
            {STATUSES.map(s => <option key={s} value={s}>{STATUS_TH[s]}</option>)}
          </select>
        </div>

        {/* Appointments list */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {[...Array(4)].map((_, i) => (
              <div key={i} className="card" style={{ padding: '1.25rem', display: 'flex', gap: '1rem' }}>
                <div className="skeleton" style={{ width: 60, height: 60, borderRadius: 12 }} />
                <div style={{ flex: 1 }}>
                  <div className="skeleton" style={{ height: 18, width: '40%', marginBottom: '0.5rem' }} />
                  <div className="skeleton" style={{ height: 14, width: '60%' }} />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <Calendar size={48} />
            <h3>ไม่มีการนัดหมาย</h3>
            <p>{tab === 'upcoming' ? 'คุณยังไม่มีนัดหมายที่กำลังจะมาถึง' : 'ไม่พบการนัดหมายที่ตรงเงื่อนไข'}</p>
            <Link to="/doctors" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>ค้นหาแพทย์</Link>
          </div>
        ) : (
          <div className="apts-list">
            {filtered.map(a => (
              <Link to={`/appointments/${a.apt_id}`} key={a.apt_id} className="apt-item card card-hover fade-in">
                <div className="apt-item-date-block" style={{ background: isUpcoming(a.date) ? 'var(--primary-light)' : 'var(--gray-100)' }}>
                  <div className="apt-item-day">{new Date(a.date).getDate()}</div>
                  <div className="apt-item-month">{new Date(a.date).toLocaleString('th-TH', { month: 'short' })}</div>
                </div>
                <div className="apt-item-body">
                  <div className="apt-item-doctor">{a.doctor_name}</div>
                  <div className="apt-item-meta">
                    <span>{a.department}</span>·<span>{a.hospital}</span>
                  </div>
                  <div className="apt-item-symptom">{a.symptom}</div>
                </div>
                <div className="apt-item-right">
                  <span className={`badge ${STATUS_BADGE[a.status]}`}>{STATUS_TH[a.status]}</span>
                  <span className="apt-item-type" style={{ color: a.doctor_consult === 'video' ? 'var(--primary)' : 'var(--gray-500)' }}>
                    {a.doctor_consult === 'video' ? '🎥 ออนไลน์' : '🏥 คลินิก'}
                  </span>
                  <ChevronRight size={16} style={{ color: 'var(--gray-400)' }} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
