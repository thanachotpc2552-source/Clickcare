import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { Bar, Doughnut, Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, ArcElement,
  PointElement, LineElement, Title, Tooltip, Legend, Filler
} from 'chart.js'
import { Users, Calendar, TrendingUp, AlertTriangle, Activity, BarChart2 } from 'lucide-react'
import './DashboardPage.css'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Title, Tooltip, Legend, Filler)

const CHART_COLORS = ['#006bcd','#00cca9','#f59e0b','#ef4444','#8b5cf6','#ec4899','#10b981','#f97316','#6366f1']

export default function DashboardPage() {
  const { user, authFetch } = useAuth()
  const [stats, setStats] = useState(null)
  const [myApts, setMyApts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      authFetch('/api/stats/overview'),
      authFetch(`/api/appointments?user_id=${user.user_id}`)
    ]).then(([s, a]) => {
      if (s.success) setStats(s.data)
      if (a.success) setMyApts(a.data || [])
    }).finally(() => setLoading(false))
  }, [user.user_id])

  if (loading) return (
    <div className="page-content"><div className="container">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem', marginBottom: '2rem' }}>
        {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 110, borderRadius: 'var(--radius-lg)' }} />)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        {[...Array(2)].map((_, i) => <div key={i} className="skeleton" style={{ height: 300, borderRadius: 'var(--radius-lg)' }} />)}
      </div>
    </div></div>
  )

  // KPIs
  const totalApts = stats?.totalApts || 0
  const completedApts = stats?.byStatus?.find(s => s.status === 'COMPLETED')?.count || 0
  const pendingApts = stats?.byStatus?.find(s => s.status === 'PENDING')?.count || 0
  const completionRate = totalApts > 0 ? Math.round((completedApts / totalApts) * 100) : 0
  const myTotal = myApts.length
  const myUpcoming = myApts.filter(a => ['PENDING','CONFIRMED'].includes(a.status)).length

  // Dept chart
  const deptData = {
    labels: stats?.byDept?.map(d => d.department) || [],
    datasets: [{
      label: 'จำนวนนัดหมาย',
      data: stats?.byDept?.map(d => d.count) || [],
      backgroundColor: CHART_COLORS,
      borderRadius: 6,
    }]
  }

  // Status doughnut
  const statusData = {
    labels: stats?.byStatus?.map(s => s.status) || [],
    datasets: [{
      data: stats?.byStatus?.map(s => s.count) || [],
      backgroundColor: ['#f59e0b','#006bcd','#10b981','#6b7280','#ef4444'],
      borderWidth: 0,
    }]
  }

  // My apt trend (by month)
  const monthCounts = {}
  myApts.forEach(a => {
    const m = new Date(a.date).toLocaleDateString('th-TH', { month: 'short', year: '2-digit' })
    monthCounts[m] = (monthCounts[m] || 0) + 1
  })
  const sortedMonths = Object.entries(monthCounts).sort((a, b) => a[0].localeCompare(b[0]))
  const lineData = {
    labels: sortedMonths.map(([m]) => m),
    datasets: [{
      label: 'การนัดหมายของฉัน',
      data: sortedMonths.map(([, c]) => c),
      borderColor: '#006bcd',
      backgroundColor: 'rgba(0,107,205,0.1)',
      tension: 0.4,
      fill: true,
      pointBackgroundColor: '#006bcd',
    }]
  }

  const chartOpts = { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }
  const doughnutOpts = { responsive: true, plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, padding: 16 } } }, cutout: '65%' }

  const kpis = [
    { label: 'นัดหมายทั้งหมด (ระบบ)', value: totalApts, icon: <Calendar size={20} />, color: '#006bcd', bg: 'var(--primary-light)' },
    { label: 'เสร็จสิ้น', value: completedApts, icon: <TrendingUp size={20} />, color: '#10b981', bg: 'var(--success-light)' },
    { label: 'รอยืนยัน', value: pendingApts, icon: <AlertTriangle size={20} />, color: '#f59e0b', bg: 'var(--warning-light)' },
    { label: 'อัตราสำเร็จ', value: `${completionRate}%`, icon: <Activity size={20} />, color: '#8b5cf6', bg: '#ede9fe' },
  ]

  const myKpis = [
    { label: 'นัดหมายของฉัน', value: myTotal, icon: <Calendar size={18} />, color: '#006bcd' },
    { label: 'กำลังจะมาถึง', value: myUpcoming, icon: <AlertTriangle size={18} />, color: '#f59e0b' },
  ]

  return (
    <div className="page-content">
      <div className="container fade-in">
        <div style={{ marginBottom: '1.75rem' }}>
          <h1 className="section-title">Dashboard</h1>
          <p className="section-subtitle">ภาพรวมระบบ ClickCare</p>
        </div>

        {/* My stats */}
        <div className="dash-my-stats">
          {myKpis.map(k => (
            <div key={k.label} className="card dash-my-kpi">
              <div className="dash-kpi-icon" style={{ color: k.color, background: k.color + '18' }}>{k.icon}</div>
              <div>
                <div className="dash-kpi-val">{k.value}</div>
                <div className="dash-kpi-label">{k.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* System KPIs */}
        <div className="dash-kpi-grid">
          {kpis.map(k => (
            <div key={k.label} className="card dash-kpi-card">
              <div className="dash-kpi-icon" style={{ color: k.color, background: k.bg }}>{k.icon}</div>
              <div className="dash-kpi-val">{k.value}</div>
              <div className="dash-kpi-label">{k.label}</div>
            </div>
          ))}
        </div>

        {/* Charts row 1 */}
        <div className="dash-charts-row">
          <div className="card dash-chart-card">
            <h3 className="dash-chart-title"><BarChart2 size={16} /> นัดหมายแยกตามแผนก</h3>
            <Bar data={deptData} options={chartOpts} />
          </div>
          <div className="card dash-chart-card">
            <h3 className="dash-chart-title">สัดส่วนสถานะนัดหมาย</h3>
            <div style={{ maxWidth: 280, margin: '0 auto' }}>
              <Doughnut data={statusData} options={doughnutOpts} />
            </div>
          </div>
        </div>

        {/* My trend */}
        {sortedMonths.length > 0 && (
          <div className="card dash-chart-card" style={{ marginTop: '1.25rem' }}>
            <h3 className="dash-chart-title">แนวโน้มการนัดหมายของฉัน</h3>
            <Line data={lineData} options={{ ...chartOpts, plugins: { legend: { display: false } } }} />
          </div>
        )}

        {/* Top symptoms */}
        {stats?.topSymptoms && (
          <div className="card" style={{ padding: '1.5rem', marginTop: '1.25rem' }}>
            <h3 className="dash-chart-title">อาการที่พบบ่อยที่สุด</h3>
            <div className="dash-symptom-list">
              {stats.topSymptoms.map((s, i) => (
                <div key={s.symptom} className="dash-symptom-row">
                  <span className="dash-symptom-rank">#{i + 1}</span>
                  <span className="dash-symptom-name">{s.symptom}</span>
                  <div className="dash-symptom-bar-wrap">
                    <div className="dash-symptom-bar" style={{ width: `${(s.count / stats.topSymptoms[0].count) * 100}%` }} />
                  </div>
                  <span className="dash-symptom-count">{s.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
