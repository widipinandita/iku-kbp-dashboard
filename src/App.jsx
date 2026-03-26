import { useState } from 'react'
import { useAuth } from './hooks/useAuth'
import Login from './components/Login'
import Dashboard from './components/Dashboard'
import InputData from './components/InputData'
import PerSeksi from './components/PerSeksi'
import KelolFile from './components/KelolFile'
import AdminPanel from './components/AdminPanel'

export default function App() {
  const { admin, logout } = useAuth()
  const [tab, setTab] = useState('dashboard')
  const [q, setQ] = useState('Q1')
  const [showLogin, setShowLogin] = useState(false)

  return (
    <div style={{minHeight:'100vh',background:'#f8fafc',fontFamily:'system-ui,sans-serif'}}>
      {showLogin && !admin && <Login onClose={() => setShowLogin(false)} />}

      {/* Header */}
      <div style={{background:'#1e3a8a',color:'white',padding:'1rem 1.5rem',display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
        <div>
          <div style={{fontSize:'0.7rem',textTransform:'uppercase',letterSpacing:'0.1em',color:'#93c5fd',marginBottom:'4px'}}>
            Kanwil DJP Jakarta Pusat
          </div>
          <h1 style={{fontSize:'1.15rem',fontWeight:700,margin:0,lineHeight:1.3}}>
            Bidang Keberatan, Banding, dan Pengurangan
          </h1>
          <div style={{fontSize:'0.8rem',color:'#bfdbfe',marginTop:'4px'}}>
            Dashboard Indikator Kinerja Utama (IKU)
          </div>
        </div>
        <div>
          {admin ? (
            <div style={{display:'flex',alignItems:'center',gap:'0.75rem'}}>
              <span style={{fontSize:'0.8rem',color:'#bfdbfe'}}>👤 {admin.username}</span>
              <button onClick={logout}
                style={{background:'rgba(255,255,255,0.15)',color:'white',border:'none',padding:'6px 12px',borderRadius:'6px',fontSize:'0.75rem',cursor:'pointer'}}>
                Logout
              </button>
            </div>
          ) : (
            <button onClick={() => setShowLogin(true)}
              style={{background:'rgba(255,255,255,0.15)',color:'white',border:'none',padding:'8px 16px',borderRadius:'6px',fontSize:'0.8rem',fontWeight:600,cursor:'pointer'}}>
              🔒 Admin Login
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{background:'white',borderBottom:'1px solid #e2e8f0',padding:'0 1.5rem',display:'flex',gap:'0',overflowX:'auto'}}>
        {[
          ['dashboard','📊 Dashboard'],
          ['seksi','👥 Per Seksi'],
          ...(admin ? [
            ['input','✏️ Input Data'],
            ['upload','📁 Kelola File'],
            ['admins','⚙️ Admin'],
          ] : []),
        ].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            style={{
              padding:'0.875rem 1rem',
              fontSize:'0.825rem',
              fontWeight:600,
              border:'none',
              borderBottom: tab===id ? '2px solid #1e3a8a' : '2px solid transparent',
              color: tab===id ? '#1e3a8a' : '#64748b',
              background:'none',
              cursor:'pointer',
              whiteSpace:'nowrap',
            }}>
            {label}
          </button>
        ))}
      </div>

      {/* Quarter Selector */}
      <div style={{background:'white',borderBottom:'1px solid #f1f5f9',padding:'0.75rem 1.5rem',display:'flex',alignItems:'center',gap:'0.75rem'}}>
        <span style={{fontSize:'0.8rem',color:'#64748b',fontWeight:500}}>Periode:</span>
        <div style={{display:'flex',gap:'0.5rem'}}>
          {['Q1','Q2','Q3','Q4'].map(qr => (
            <button key={qr} onClick={() => setQ(qr)}
              style={{
                padding:'4px 14px',
                borderRadius:'99px',
                fontSize:'0.8rem',
                fontWeight:600,
                border:'none',
                cursor:'pointer',
                background: q===qr ? '#1e3a8a' : '#f1f5f9',
                color: q===qr ? 'white' : '#475569',
              }}>
              {qr} 2025
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{padding:'1.5rem',maxWidth:'1100px',margin:'0 auto'}}>
        {tab==='dashboard' && <Dashboard q={q} admin={admin} />}
        {tab==='seksi'     && <PerSeksi q={q} />}
        {tab==='input'     && admin && <InputData q={q} admin={admin} />}
        {tab==='upload'    && admin && <KelolFile q={q} admin={admin} />}
        {tab==='admins'    && admin && <AdminPanel admin={admin} />}
      </div>
    </div>
  )
}
