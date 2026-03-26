import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'

export default function Login({ onClose }) {
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(username, password)
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:50,display:'flex',alignItems:'center',justifyContent:'center',padding:'1rem'}}>
      <div style={{background:'white',borderRadius:'1rem',boxShadow:'0 20px 60px rgba(0,0,0,0.2)',width:'100%',maxWidth:'360px',padding:'2rem'}}>
        <h2 style={{fontSize:'1.25rem',fontWeight:600,color:'#1e3a5f',marginBottom:'0.25rem'}}>Admin Login</h2>
        <p style={{fontSize:'0.875rem',color:'#94a3b8',marginBottom:'1.5rem'}}>Bidang KBP – Kanwil DJP Jakarta Pusat</p>
        <form onSubmit={handleLogin} style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
          <div>
            <label style={{display:'block',fontSize:'0.75rem',color:'#64748b',marginBottom:'0.25rem'}}>Username</label>
            <input
              value={username}
              onChange={e => setUsername(e.target.value)}
              style={{width:'100%',border:'1px solid #e2e8f0',borderRadius:'0.5rem',padding:'0.5rem 0.75rem',fontSize:'0.875rem',boxSizing:'border-box'}}
              placeholder="Username"
              required
            />
          </div>
          <div>
            <label style={{display:'block',fontSize:'0.75rem',color:'#64748b',marginBottom:'0.25rem'}}>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={{width:'100%',border:'1px solid #e2e8f0',borderRadius:'0.5rem',padding:'0.5rem 0.75rem',fontSize:'0.875rem',boxSizing:'border-box'}}
              placeholder="Password"
              required
            />
          </div>
          {error && <p style={{color:'#ef4444',fontSize:'0.75rem'}}>{error}</p>}
          <button
            type="submit"
            disabled={loading}
            style={{background:'#1e3a8a',color:'white',padding:'0.625rem',borderRadius:'0.5rem',fontSize:'0.875rem',fontWeight:600,border:'none',cursor:'pointer',opacity:loading?0.5:1}}
          >
            {loading ? 'Memproses...' : 'Login'}
          </button>
        </form>
        <button
          onClick={onClose}
          style={{marginTop:'1rem',fontSize:'0.75rem',color:'#94a3b8',background:'none',border:'none',cursor:'pointer',width:'100%',textAlign:'center'}}
        >
          Tutup
        </button>
      </div>
    </div>
  )
}
