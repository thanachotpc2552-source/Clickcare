import { useState, useRef, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  Heart, Home, Users, Calendar, LayoutDashboard,
  Bell, ChevronDown, LogOut, User, Menu, X, Sparkles
} from 'lucide-react'
import './Navbar.css'

export default function Navbar() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [userOpen, setUserOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const dropRef = useRef(null)

  useEffect(() => {
    function close(e) { if (dropRef.current && !dropRef.current.contains(e.target)) setUserOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  useEffect(() => { setMobileOpen(false) }, [location])

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/')

  const navLinks = [
    { to: '/', label: 'หน้าแรก', icon: <Home size={16} /> },
    { to: '/doctors', label: 'ค้นหาแพทย์', icon: <Users size={16} /> },
    { to: '/appointments', label: 'นัดหมาย', icon: <Calendar size={16} /> },
    ...(user?.role === 'ADMIN' || user?.role === 'DOCTOR' ? [{ to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={16} /> }] : []),
  ]

  const getRoleBadge = () => {
    if (user?.role === 'VIP') return <span className="badge badge-vip" style={{fontSize:'0.7rem',padding:'0.1rem 0.5rem'}}>VIP</span>
    if (user?.role === 'DOCTOR') return <span className="badge badge-doctor" style={{fontSize:'0.7rem',padding:'0.1rem 0.5rem'}}>แพทย์</span>
    return null
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <nav className="navbar">
      <div className="navbar-inner container">
        {/* Logo */}
        <Link to="/" className="navbar-logo">
          <div className="navbar-logo-icon">
            <Heart size={18} fill="white" />
          </div>
          <span>Click<span className="navbar-logo-care">Care</span></span>
        </Link>

        {/* Desktop nav */}
        <div className="navbar-links">
          {navLinks.map(l => (
            <Link
              key={l.to}
              to={l.to}
              className={`navbar-link ${isActive(l.to) ? 'active' : ''}`}
            >
              {l.icon}
              {l.label}
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="navbar-right">
          {/* AI badge */}
          <Link to="/" className="navbar-ai-badge">
            <Sparkles size={13} />
            AI
          </Link>

          {/* User dropdown */}
          <div className="navbar-user" ref={dropRef}>
            <button className="navbar-user-btn" onClick={() => setUserOpen(!userOpen)}>
              <div className="avatar" style={{ width: 34, height: 34, fontSize: '0.8rem' }}>
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div className="navbar-user-info">
                <span className="navbar-user-name">{user?.name?.split(' ')[0]}</span>
                {getRoleBadge()}
              </div>
              <ChevronDown size={14} className={`navbar-chevron ${userOpen ? 'open' : ''}`} />
            </button>

            {userOpen && (
              <div className="navbar-dropdown slide-down">
                <div className="navbar-dropdown-header">
                  <div className="avatar avatar-lg">{user?.name?.charAt(0).toUpperCase()}</div>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--gray-900)' }}>{user?.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>{user?.email}</div>
                    <div style={{ marginTop: 4 }}>{getRoleBadge()}</div>
                  </div>
                </div>
                <hr className="divider" style={{ margin: '0.5rem 0' }} />
                <Link to="/profile" className="navbar-dropdown-item" onClick={() => setUserOpen(false)}>
                  <User size={15} /> โปรไฟล์
                </Link>
                <button className="navbar-dropdown-item danger" onClick={handleLogout}>
                  <LogOut size={15} /> ออกจากระบบ
                </button>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <button className="navbar-hamburger" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="navbar-mobile slide-down">
          {navLinks.map(l => (
            <Link
              key={l.to}
              to={l.to}
              className={`navbar-mobile-link ${isActive(l.to) ? 'active' : ''}`}
            >
              {l.icon}
              {l.label}
            </Link>
          ))}
          <hr className="divider" />
          <Link to="/profile" className="navbar-mobile-link">
            <User size={16} /> โปรไฟล์
          </Link>
          <button className="navbar-mobile-link" style={{ color: 'var(--danger)', width: '100%', textAlign: 'left' }} onClick={handleLogout}>
            <LogOut size={16} /> ออกจากระบบ
          </button>
        </div>
      )}
    </nav>
  )
}
