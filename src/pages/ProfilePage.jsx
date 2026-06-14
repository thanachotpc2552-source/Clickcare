import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { User, Mail, Phone, Calendar, Droplets, HeartPulse, Shield, LogOut } from 'lucide-react'
import './ProfilePage.css'

export default function ProfilePage() {
  const { user, logout } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const handleLogout = async () => {
    setLoading(true)
    await logout()
    // navigate('/login') will be handled by App.jsx Route protection
  }

  if (!user) return null

  return (
    <div className="page-content">
      <div className="container fade-in">
        <h1 className="section-title" style={{ marginBottom: '1.5rem' }}>โปรไฟล์ของฉัน</h1>

        <div className="profile-layout">
          {/* Main Card */}
          <div className="card profile-main-card">
            <div className="profile-hero">
              <div className="avatar" style={{ width: 96, height: 96, fontSize: '2.5rem', background: 'white', color: 'var(--primary)', border: '4px solid rgba(255,255,255,0.2)' }}>
                {user.name?.charAt(0)}
              </div>
              <div className="profile-hero-info">
                <h2>{user.name}</h2>
                <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.95rem' }}>{user.email}</div>
                <div className="profile-badges">
                  {user.role === 'VIP' && <span className="badge" style={{ background: '#f59e0b', color: 'white' }}>VIP Member</span>}
                  {user.role === 'DOCTOR' && <span className="badge" style={{ background: '#10b981', color: 'white' }}>Doctor</span>}
                  {user.role === 'PATIENT' && <span className="badge" style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}>Patient</span>}
                </div>
              </div>
            </div>

            <div className="profile-info-grid">
              <div className="profile-info-item">
                <div className="profile-info-icon"><User size={16} /></div>
                <div>
                  <div className="profile-info-label">เพศ</div>
                  <div className="profile-info-value">{user.gender || '-'}</div>
                </div>
              </div>
              <div className="profile-info-item">
                <div className="profile-info-icon"><Calendar size={16} /></div>
                <div>
                  <div className="profile-info-label">วันเกิด</div>
                  <div className="profile-info-value">{user.dob ? new Date(user.dob).toLocaleDateString('th-TH') : '-'}</div>
                </div>
              </div>
              <div className="profile-info-item">
                <div className="profile-info-icon"><Phone size={16} /></div>
                <div>
                  <div className="profile-info-label">เบอร์โทรศัพท์</div>
                  <div className="profile-info-value">{user.phone || '-'}</div>
                </div>
              </div>
              <div className="profile-info-item">
                <div className="profile-info-icon"><Mail size={16} /></div>
                <div>
                  <div className="profile-info-label">อีเมล</div>
                  <div className="profile-info-value">{user.email}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Medical Info & Settings */}
          <div className="profile-side">
            <div className="card" style={{ padding: '1.5rem', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <HeartPulse size={18} style={{ color: 'var(--danger)' }} /> ข้อมูลสุขภาพ
              </h3>
              <div className="profile-med-list">
                <div className="profile-med-item">
                  <Droplets size={16} style={{ color: '#ef4444' }} />
                  <div>
                    <div className="profile-info-label">กรุ๊ปเลือด</div>
                    <div className="profile-info-value">{user.blood_type || '-'}</div>
                  </div>
                </div>
                <div className="profile-med-item">
                  <Shield size={16} style={{ color: '#f59e0b' }} />
                  <div>
                    <div className="profile-info-label">ประวัติแพ้ยา</div>
                    <div className="profile-info-value" style={{ color: user.allergies !== 'None' ? 'var(--danger)' : 'inherit' }}>
                      {user.allergies || 'ไม่มีประวัติ'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>การตั้งค่า</h3>
              <button className="btn" style={{ width: '100%', justifyContent: 'flex-start', marginBottom: '0.5rem', background: 'var(--gray-50)', border: '1px solid var(--gray-200)' }} onClick={() => toast('ฟีเจอร์นี้อยู่ระหว่างพัฒนา', 'info')}>
                เปลี่ยนรหัสผ่าน
              </button>
              <button className="btn btn-danger" style={{ width: '100%', justifyContent: 'flex-start' }} onClick={handleLogout} disabled={loading}>
                {loading ? <span className="spinner" /> : <><LogOut size={16} /> ออกจากระบบ</>}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
