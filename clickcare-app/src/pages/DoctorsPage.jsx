import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Search, Filter, Star, MapPin, Clock, Video, Building2, X } from 'lucide-react'
import './DoctorsPage.css'

const DEPARTMENTS = ['Psychiatry','Dermatology','Gynecology','Cardiology','Pediatrics','Urology','Neurology','Orthopedics','Oncology']
const HOSPITALS = ['Central Health','Siriraj','Chiang Mai Ram','City Hospital','Bumrungrad','Siam Medical','Bangkok General','Phuket International','Thonburi Hospital','Samitivej']

export default function DoctorsPage() {
  const { authFetch } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [dept, setDept] = useState(searchParams.get('department') || '')
  const [hospital, setHospital] = useState(searchParams.get('hospital') || '')
  const [consultType, setConsultType] = useState('')
  const [showFilter, setShowFilter] = useState(false)

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (dept) params.set('department', dept)
    if (hospital) params.set('hospital', hospital)
    if (consultType) params.set('consult_type', consultType)

    authFetch(`/api/doctors?${params}`)
      .then(r => { if (r.success) setDoctors(r.data || []) })
      .finally(() => setLoading(false))
  }, [search, dept, hospital, consultType])

  const activeFilters = [
    dept && { key: 'dept', label: dept, clear: () => setDept('') },
    hospital && { key: 'hospital', label: hospital, clear: () => setHospital('') },
    consultType && { key: 'type', label: consultType === 'video' ? 'ออนไลน์' : 'คลินิก', clear: () => setConsultType('') },
  ].filter(Boolean)

  const ratingStars = (r) => {
    const full = Math.floor(r)
    const half = r % 1 >= 0.5
    return '★'.repeat(full) + (half ? '½' : '')
  }

  return (
    <div className="page-content">
      <div className="container">
        {/* Header */}
        <div className="doctors-header fade-in">
          <div>
            <h1 className="section-title">ค้นหาแพทย์</h1>
            <p className="section-subtitle">พบแพทย์ผู้เชี่ยวชาญกว่า 50 ท่านใน 9 แผนก</p>
          </div>
        </div>

        {/* Search + Filter bar */}
        <div className="doctors-search-bar card fade-in">
          <div className="doctors-search-input">
            <Search size={18} className="doctors-search-icon" />
            <input
              className="form-input doctors-input"
              placeholder="ค้นหาชื่อแพทย์ หรือแผนก..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && <button onClick={() => setSearch('')} style={{ color: 'var(--gray-400)', display: 'flex' }}><X size={16} /></button>}
          </div>
          <div className="doctors-filter-row">
            <select className="form-input form-select" value={dept} onChange={e => setDept(e.target.value)} style={{ minWidth: 160 }}>
              <option value="">ทุกแผนก</option>
              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <select className="form-input form-select" value={hospital} onChange={e => setHospital(e.target.value)} style={{ minWidth: 180 }}>
              <option value="">ทุกโรงพยาบาล</option>
              {HOSPITALS.map(h => <option key={h} value={h}>{h}</option>)}
            </select>
            <select className="form-input form-select" value={consultType} onChange={e => setConsultType(e.target.value)}>
              <option value="">ทุกประเภท</option>
              <option value="video">ออนไลน์ (Video)</option>
              <option value="clinic">คลินิก</option>
            </select>
          </div>
        </div>

        {/* Active filter chips */}
        {activeFilters.length > 0 && (
          <div className="doctors-chips">
            {activeFilters.map(f => (
              <span key={f.key} className="doctors-chip">
                {f.label}
                <button onClick={f.clear}><X size={12} /></button>
              </span>
            ))}
            <button className="doctors-chip-clear" onClick={() => { setDept(''); setHospital(''); setConsultType(''); }}>
              ล้างทั้งหมด
            </button>
          </div>
        )}

        {/* Results count */}
        <div className="doctors-count">
          {loading ? 'กำลังโหลด...' : `พบ ${doctors.length} ท่าน`}
        </div>

        {/* Doctor grid */}
        {loading ? (
          <div className="doctors-grid">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card" style={{ padding: '1.5rem' }}>
                <div className="skeleton" style={{ width: 64, height: 64, borderRadius: '50%', marginBottom: '0.75rem' }} />
                <div className="skeleton" style={{ height: 18, marginBottom: '0.5rem' }} />
                <div className="skeleton" style={{ height: 14, width: '60%', marginBottom: '0.375rem' }} />
                <div className="skeleton" style={{ height: 14, width: '80%' }} />
              </div>
            ))}
          </div>
        ) : doctors.length === 0 ? (
          <div className="empty-state">
            <Search size={48} />
            <h3>ไม่พบแพทย์ที่ค้นหา</h3>
            <p>ลองเปลี่ยนคำค้นหาหรือตัวกรอง</p>
          </div>
        ) : (
          <div className="doctors-grid">
            {doctors.map(d => (
              <Link to={`/doctors/${d.doctor_id}`} key={d.doctor_id} className="doctor-card card card-hover fade-in">
                <div className="doctor-card-top">
                  <div className="avatar avatar-lg" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
                    {d.name?.replace('Dr. ', '').charAt(0)}
                  </div>
                  <div className="doctor-card-badges">
                    <span className={`badge ${d.consult_type === 'video' ? 'badge-confirmed' : 'badge-member'}`} style={{ fontSize: '0.7rem' }}>
                      {d.consult_type === 'video' ? <><Video size={10} /> Video</> : <><Building2 size={10} /> Clinic</>}
                    </span>
                  </div>
                </div>
                <h3 className="doctor-card-name">{d.name}</h3>
                <div className="doctor-card-dept">{d.department}</div>
                <div className="doctor-card-hospital"><MapPin size={12} />{d.hospital}</div>
                <div className="doctor-card-avail"><Clock size={12} />{d.availability}</div>
                <hr className="divider" />
                <div className="doctor-card-footer">
                  <div className="doctor-card-rating">
                    <span className="stars" style={{ fontSize: '0.8rem' }}>{ratingStars(d.rating)}</span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--gray-600)', marginLeft: 4 }}>{d.rating}</span>
                  </div>
                  <span className="doctor-card-fee">฿{d.fee?.toLocaleString()}</span>
                </div>
                <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '0.75rem' }}>
                  จองนัดหมาย
                </button>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
