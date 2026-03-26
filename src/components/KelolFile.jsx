import { useState, useEffect } from 'react'
import { db } from '../firebase'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'

const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4']
const KPI_LIST = [
  { id:'a', label:'a. Keberatan Tepat Waktu' },
  { id:'b', label:'b. Nonkeberatan Tepat Waktu' },
  { id:'c', label:'c. Sengketa Perpajakan Dipertahankan' },
  { id:'d', label:'d. SUB Tepat Waktu' },
  { id:'e', label:'e. STg Tepat Waktu' },
  { id:'f', label:'f. Argumentasi Hukum Tepat Waktu' },
  { id:'g', label:'g. Strategi Penanganan Sengketa Pajak' },
]

export default function KelolFile({ q, admin }) {
  const [links, setLinks] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(null)
  const [msg, setMsg] = useState({})

  useEffect(() => {
    const fetchLinks = async () => {
      setLoading(true)
      const result = {}
      for (const kpi of KPI_LIST) {
        for (const qr of QUARTERS) {
          const key = `${kpi.id}_${qr}_2025`
          try {
            const snap = await getDoc(doc(db, 'excel_files', key))
            if (snap.exists()) result[key] = snap.data().url || ''
          } catch {}
        }
      }
      setLinks(result)
      setLoading(false)
    }
    fetchLinks()
  }, [])

  const setLink = (key, val) => setLinks(p => ({ ...p, [key]: val }))

  const saveLink = async (kpiId, quarter) => {
    const key = `${kpiId}_${quarter}_2025`
    setSaving(key)
    try {
      await setDoc(doc(db, 'excel_files', key), {
        url: links[key] || '',
        updatedAt: serverTimestamp(),
        updatedBy: admin.username,
      })
      setMsg(p => ({ ...p, [key]: '✅ Tersimpan' }))
      setTimeout(() => setMsg(p => ({ ...p, [key]: '' })), 2000)
    } catch {
      setMsg(p => ({ ...p, [key]: '❌ Gagal menyimpan' }))
    }
    setSaving(null)
  }

  const s = {
    card: { background:'white', borderRadius:'0.75rem', border:'1px solid #e2e8f0', padding:'1.25rem' },
    th: { padding:'10px 12px', fontSize:'0.8rem', fontWeight:600, color:'white', background:'#1e3a8a', textAlign:'left' },
    td: { padding:'10px 12px', fontSize:'0.8rem', color:'#475569', borderBottom:'1px solid #f1f5f9', verticalAlign:'middle' },
    input: { width:'100%', border:'1px solid #e2e8f0', borderRadius:'6px', padding:'6px 10px', fontSize:'0.8rem', boxSizing:'border-box' },
    btn: { background:'#1e3a8a', color:'white', border:'none', padding:'6px 14px', borderRadius:'6px', fontSize:'0.75rem', fontWeight:600, cursor:'pointer', whiteSpace:'nowrap' },
    btnGray: { background:'#f1f5f9', color:'#64748b', border:'1px solid #e2e8f0', padding:'6px 14px', borderRadius:'6px', fontSize:'0.75rem', cursor:'pointer', whiteSpace:'nowrap' },
  }

  if (loading) return <div style={{color:'#94a3b8',padding:'2rem',textAlign:'center'}}>Memuat data...</div>

  return (
    <div>
      <div style={{background:'#eff6ff',border:'1px solid #bfdbfe',borderRadius:'0.75rem',padding:'0.75rem 1rem',marginBottom:'1.5rem',fontSize:'0.875rem',color:'#1e40af'}}>
        Paste link SharePoint untuk setiap IKU per kuartal. Tombol <strong>Detail</strong> pada Dashboard akan membuka link tersebut di tab baru.
      </div>

      <div style={s.card}>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead>
              <tr>
                <th style={{...s.th,width:'180px'}}>IKU</th>
                <th style={{...s.th,width:'80px',textAlign:'center'}}>Kuartal</th>
                <th style={s.th}>SharePoint Link</th>
                <th style={{...s.th,width:'120px',textAlign:'center'}}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {KPI_LIST.map((kpi, ki) =>
                QUARTERS.map((qr, qi) => {
                  const key = `${kpi.id}_${qr}_2025`
                  const hasLink = !!links[key]
                  return (
                    <tr key={key} style={{background:(ki+qi)%2===0?'white':'#f8fafc'}}>
                      {qi === 0 && (
                        <td style={{...s.td,fontWeight:500,color:'#1e293b'}} rowSpan={4}>
                          {kpi.label}
                        </td>
                      )}
                      <td style={{...s.td,textAlign:'center'}}>
                        <span style={{fontSize:'0.75rem',fontWeight:600,background:'#dbeafe',color:'#1e40af',padding:'2px 8px',borderRadius:'99px'}}>
                          {qr}
                        </span>
                      </td>
                      <td style={s.td}>
                        <input
                          type="url"
                          value={links[key] || ''}
                          onChange={e => setLink(key, e.target.value)}
                          placeholder="https://organisasi.sharepoint.com/..."
                          style={s.input}
                        />
                      </td>
                      <td style={{...s.td,textAlign:'center'}}>
                        <div style={{display:'flex',gap:'4px',justifyContent:'center',alignItems:'center'}}>
                          <button
                            onClick={() => saveLink(kpi.id, qr)}
                            disabled={saving === key}
                            style={{...s.btn,opacity:saving===key?0.5:1}}
                          >
                            {saving === key ? '...' : '💾 Simpan'}
                          </button>
                          {hasLink && (
                            <button onClick={() => window.open(links[key], '_blank')} style={s.btnGray}>
                              🔗 Buka
                            </button>
                          )}
                        </div>
                        {msg[key] && (
                          <div style={{fontSize:'0.7rem',marginTop:'4px',color:msg[key].includes('✅')?'#15803d':'#b91c1c'}}>
                            {msg[key]}
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
