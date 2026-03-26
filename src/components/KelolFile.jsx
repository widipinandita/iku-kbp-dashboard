import { useState, useEffect, useRef } from 'react'
import { db } from '../firebase'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import * as XLSX from 'xlsx'

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
  const [files, setFiles] = useState({})
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [uploadTarget, setUploadTarget] = useState(null)
  const fileInputRef = useRef()

  useEffect(() => {
    const fetchFiles = async () => {
      setLoading(true)
      const result = {}
      for (const kpi of KPI_LIST) {
        for (const qr of QUARTERS) {
          const key = `${kpi.id}_${qr}_2025`
          try {
            const snap = await getDoc(doc(db, 'excel_files', key))
            if (snap.exists()) result[key] = snap.data()
          } catch {}
        }
      }
      setFiles(result)
      setLoading(false)
    }
    fetchFiles()
  }, [])

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const { kpiId, quarter } = uploadTarget
    const reader = new FileReader()
    reader.onload = async (ev) => {
      try {
        const wb = XLSX.read(ev.target.result, { type:'array' })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const data = XLSX.utils.sheet_to_json(ws, { defval:'' })
        const base64 = btoa(String.fromCharCode(...new Uint8Array(ev.target.result)))
        const key = `${kpiId}_${quarter}_2025`
        await setDoc(doc(db, 'excel_files', key), {
          name: file.name,
          base64,
          data,
          uploadedAt: serverTimestamp(),
          uploadedBy: admin.username,
        })
        setFiles(p => ({ ...p, [key]: { name:file.name, base64, data } }))
      } catch { alert('Gagal membaca file Excel.') }
    }
    reader.readAsArrayBuffer(file)
    e.target.value = ''
  }

  const triggerUpload = (kpiId, quarter) => {
    setUploadTarget({ kpiId, quarter })
    setTimeout(() => fileInputRef.current?.click(), 50)
  }

  const downloadFile = (key) => {
    const f = files[key]
    if (!f) return
    const binary = atob(f.base64)
    const bytes = new Uint8Array(binary.length)
    for (let i=0; i<binary.length; i++) bytes[i] = binary.charCodeAt(i)
    const blob = new Blob([bytes], { type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = f.name; a.click()
    URL.revokeObjectURL(url)
  }

  const s = {
    card: {background:'white',borderRadius:'0.75rem',border:'1px solid #e2e8f0',padding:'1.25rem'},
    th: {padding:'10px 12px',fontSize:'0.8rem',fontWeight:600,color:'white',background:'#1e3a8a',textAlign:'center'},
    thLeft: {padding:'10px 12px',fontSize:'0.8rem',fontWeight:600,color:'white',background:'#1e3a8a',textAlign:'left'},
    td: {padding:'10px 12px',fontSize:'0.8rem',color:'#475569',borderBottom:'1px solid #f1f5f9',textAlign:'center'},
    tdLeft: {padding:'10px 12px',fontSize:'0.8rem',color:'#475569',borderBottom:'1px solid #f1f5f9'},
    btnUp: {fontSize:'0.75rem',background:'#f1f5f9',color:'#64748b',border:'1px solid #e2e8f0',padding:'4px 10px',borderRadius:'6px',cursor:'pointer'},
    btnDl: {fontSize:'0.75rem',background:'#1e3a8a',color:'white',border:'none',padding:'4px 10px',borderRadius:'6px',cursor:'pointer'},
  }

  if (loading) return <div style={{color:'#94a3b8',padding:'2rem',textAlign:'center'}}>Memuat data...</div>

  return (
    <div>
      <input ref={fileInputRef} type="file" accept=".xlsx,.xls" style={{display:'none'}} onChange={handleFileUpload}/>

      {modal && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.45)',zIndex:50,display:'flex',alignItems:'center',justifyContent:'center',padding:'1rem'}}
          onClick={() => setModal(null)}>
          <div style={{background:'white',borderRadius:'1rem',width:'100%',maxWidth:'720px',maxHeight:'90vh',overflow:'auto'}}
            onClick={e => e.stopPropagation()}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'1rem 1.5rem',borderBottom:'1px solid #f1f5f9'}}>
              <h2 style={{fontWeight:600,fontSize:'0.95rem',margin:0}}>
                Detail {KPI_LIST.find(k=>k.id===modal.kpiId)?.label} — {modal.quarter} 2025
              </h2>
              <button onClick={()=>setModal(null)} style={{background:'none',border:'none',fontSize:'1.25rem',cursor:'pointer',color:'#94a3b8'}}>✕</button>
            </div>
            <div style={{padding:'1.5rem'}}>
              {files[`${modal.kpiId}_${modal.quarter}_2025`] ? (
                <>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1rem'}}>
                    <span style={{fontSize:'0.875rem',color:'#64748b'}}>
                      📄 <strong>{files[`${modal.kpiId}_${modal.quarter}_2025`].name}</strong>
                    </span>
                    <button onClick={()=>downloadFile(`${modal.kpiId}_${modal.quarter}_2025`)} style={{...s.btnDl,padding:'6px 14px',fontSize:'0.8rem'}}>
                      ⬇ Download Excel
                    </button>
                  </div>
                  <div style={{overflowX:'auto',borderRadius:'0.5rem',border:'1px solid #e2e8f0'}}>
                    <table style={{width:'100%',borderCollapse:'collapse'}}>
                      <thead>
                        <tr>{Object.keys(files[`${modal.kpiId}_${modal.quarter}_2025`].data?.[0]||{}).map(col=>(
                          <th key={col} style={{...s.th,whiteSpace:'nowrap'}}>{col}</th>
                        ))}</tr>
                      </thead>
                      <tbody>
                        {(files[`${modal.kpiId}_${modal.quarter}_2025`].data||[]).slice(0,50).map((row,i)=>(
                          <tr key={i} style={{background:i%2===0?'white':'#f8fafc'}}>
                            {Object.values(row).map((cell,j)=>(
                              <td key={j} style={{...s.td,whiteSpace:'nowrap'}}>{String(cell)}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div style={{textAlign:'center',padding:'2rem'}}>
                  <div style={{fontSize:'2.5rem',marginBottom:'0.75rem'}}>📂</div>
                  <div style={{fontWeight:500,color:'#1e293b',marginBottom:'0.5rem'}}>Belum ada file</div>
                  <div style={{fontSize:'0.875rem',color:'#94a3b8',marginBottom:'1.5rem'}}>Upload file Excel untuk {modal.quarter} 2025</div>
                  <button onClick={()=>{ setModal(null); triggerUpload(modal.kpiId, modal.quarter) }}
                    style={{...s.btnDl,padding:'8px 20px',fontSize:'0.875rem'}}>
                    📤 Upload File Excel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div style={{background:'#eff6ff',border:'1px solid #bfdbfe',borderRadius:'0.75rem',padding:'0.75rem 1rem',marginBottom:'1.5rem',fontSize:'0.875rem',color:'#1e40af'}}>
        Upload file Excel detail realisasi per IKU per kuartal. Klik <strong>Detail</strong> pada Dashboard untuk melihat preview.
      </div>

      <div style={s.card}>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead>
              <tr>
                <th style={{...s.thLeft,borderRadius:'8px 0 0 0'}}>IKU</th>
                {QUARTERS.map(qr=><th key={qr} style={s.th}>{qr} 2025</th>)}
              </tr>
            </thead>
            <tbody>
              {KPI_LIST.map((kpi,i) => (
                <tr key={kpi.id} style={{background:i%2===0?'white':'#f8fafc'}}>
                  <td style={s.tdLeft}>{kpi.label}</td>
                  {QUARTERS.map(qr => {
                    const key = `${kpi.id}_${qr}_2025`
                    const f = files[key]
                    return (
                      <td key={qr} style={s.td}>
                        {f ? (
                          <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'4px'}}>
                            <span style={{fontSize:'0.7rem',color:'#15803d',fontWeight:500}}>✅ {f.name.length>15?f.name.slice(0,15)+'…':f.name}</span>
                            <div style={{display:'flex',gap:'4px'}}>
                              <button onClick={()=>setModal({kpiId:kpi.id,quarter:qr})} style={{...s.btnUp,color:'#1e40af'}}>Lihat</button>
                              <button onClick={()=>triggerUpload(kpi.id,qr)} style={s.btnUp}>Ganti</button>
                            </div>
                          </div>
                        ) : (
                          <button onClick={()=>triggerUpload(kpi.id,qr)} style={s.btnUp}>📤 Upload</button>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
