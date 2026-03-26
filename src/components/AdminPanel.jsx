import { useState, useEffect } from 'react'
import { db } from '../firebase'
import { collection, getDocs, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore'
import { hashPassword } from '../hooks/useAuth'

export default function AdminPanel({ admin }) {
  const [admins, setAdmins] = useState([])
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  const fetchAdmins = async () => {
    const snap = await getDocs(collection(db, 'admins'))
    setAdmins(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  }

  useEffect(() => { fetchAdmins() }, [])

  const addAdmin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMsg('')
    try {
      const hash = await hashPassword(password)
      await addDoc(collection(db, 'admins'), {
        username,
        passwordHash: hash,
        isSuperAdmin: false,
        createdAt: serverTimestamp(),
        createdBy: admin.username,
      })
      setMsg('✅ Admin berhasil ditambahkan.')
      setUsername('')
      setPassword('')
      fetchAdmins()
    } catch {
      setMsg('❌ Gagal menambahkan admin.')
    }
    setLoading(false)
  }

  const removeAdmin = async (id, uname) => {
    if (uname === admin.username) return alert('Tidak bisa menghapus akun sendiri.')
    if (!confirm(`Hapus admin "${uname}"?`)) return
    await deleteDoc(doc(db, 'admins', id))
    fetchAdmins()
  }

  const s = {
    wrap: {maxWidth:'560px',display:'flex',flexDirection:'column',gap:'1.5rem'},
    card: {background:'white',borderRadius:'0.75rem',border:'1px solid #e2e8f0',padding:'1.25rem'},
    title: {fontWeight:600,color:'#1e293b',marginBottom:'1rem',fontSize:'0.95rem'},
    input: {width:'100%',border:'1px solid #e2e8f0',borderRadius:'0.5rem',padding:'0.5rem 0.75rem',fontSize:'0.875rem',boxSizing:'border-box'},
    btn: {background:'#1e3a8a',color:'white',padding:'0.5rem 1rem',borderRadius:'0.5rem',fontSize:'0.875rem',fontWeight:600,border:'none',cursor:'pointer'},
    row: {display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0.75rem',background:'#f8fafc',borderRadius:'0.5rem'},
    badge: {fontSize:'0.7rem',background:'#dbeafe',color:'#1e40af',padding:'2px 8px',borderRadius:'99px',fontWeight:500,marginLeft:'8px'},
    del: {fontSize:'0.75rem',color:'#ef4444',background:'none',border:'none',cursor:'pointer'},
  }

  return (
    <div style={s.wrap}>
      <div style={s.card}>
        <div style={s.title}>Tambah Admin</div>
        <form onSubmit={addAdmin} style={{display:'flex',flexDirection:'column',gap:'0.75rem'}}>
          <input
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="Username baru"
            required
            style={s.input}
          />
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Password"
            required
            style={s.input}
          />
          <button type="submit" disabled={loading} style={{...s.btn,opacity:loading?0.5:1}}>
            {loading ? 'Menyimpan...' : 'Tambah Admin'}
          </button>
          {msg && <p style={{fontSize:'0.875rem',margin:0}}>{msg}</p>}
        </form>
      </div>

      <div style={s.card}>
        <div style={s.title}>Daftar Admin</div>
        <div style={{display:'flex',flexDirection:'column',gap:'0.5rem'}}>
          {admins.map(a => (
            <div key={a.id} style={s.row}>
              <div>
                <span style={{fontWeight:500,color:'#1e293b',fontSize:'0.875rem'}}>{a.username}</span>
                {a.isSuperAdmin && <span style={s.badge}>Super Admin</span>}
              </div>
              {!a.isSuperAdmin && (
                <button onClick={() => removeAdmin(a.id, a.username)} style={s.del}>Hapus</button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
