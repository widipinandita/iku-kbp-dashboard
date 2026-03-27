import { useState, useEffect } from 'react'
import { db } from '../firebase'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'

const SEKSI = ['KBP I', 'KBP II', 'KBP III', 'KBP IV']

const KPI_DEFS = [
  { id:'a', label:'a. Keberatan Tepat Waktu', formula:'SK Tepat Waktu / SK Terbit', targets:{Q1:85,Q2:85,Q3:85,Q4:85}, bySeksi:true,
    fields:(q,s)=>[{key:`a_tw_${q}_${s}`,label:'SK Tepat Waktu'},{key:`a_terbit_${q}_${s}`,label:'SK Terbit'}],
    calc:(v,q,s)=>{ const tw=parseFloat(v[`a_tw_${q}_${s}`]),t=parseFloat(v[`a_terbit_${q}_${s}`]); return t>0?(tw/t)*100:null }},
  { id:'b', label:'b. Nonkeberatan Tepat Waktu', formula:'SK Tepat Waktu / SK Terbit', targets:{Q1:91,Q2:91,Q3:91,Q4:91}, bySeksi:true,
    fields:(q,s)=>[{key:`b_tw_${q}_${s}`,label:'SK Tepat Waktu'},{key:`b_terbit_${q}_${s}`,label:'SK Terbit'}],
    calc:(v,q,s)=>{ const tw=parseFloat(v[`b_tw_${q}_${s}`]),t=parseFloat(v[`b_terbit_${q}_${s}`]); return t>0?(tw/t)*100:null }},
  { id:'c', label:'c. Sengketa Perpajakan Dipertahankan', formula:'65%×(Konstanta/SK Terbit) + 35%×(DKB/47%)', targets:{Q1:78,Q2:78,Q3:78,Q4:78}, bySeksi:true,
    fields:(q,s)=>[{key:`c_konst_${q}_${s}`,label:'Konstanta SK Banding/Gugat'},{key:`c_terbit_${q}_${s}`,label:'SK Terbit'},{key:`c_dkb_${q}_${s}`,label:'Tingkat Kemenangan (% DKB)'}],
    calc:(v,q,s)=>{ const k=parseFloat(v[`c_konst_${q}_${s}`]),t=parseFloat(v[`c_terbit_${q}_${s}`]),d=parseFloat(v[`c_dkb_${q}_${s}`]); return (t>0&&!isNaN(k)&&!isNaN(d))?0.65*(k/t)*100+0.35*(d/47)*100:null }},
  { id:'d', label:'d. SUB Tepat Waktu', formula:'SUB Tepat Waktu / SUB Terbit', targets:{Q1:90,Q2:90,Q3:90,Q4:90}, bySeksi:true,
    fields:(q,s)=>[{key:`d_tw_${q}_${s}`,label:'SUB Tepat Waktu'},{key:`d_terbit_${q}_${s}`,label:'SUB Terbit'}],
    calc:(v,q,s)=>{ const tw=parseFloat(v[`d_tw_${q}_${s}`]),t=parseFloat(v[`d_terbit_${q}_${s}`]); return t>0?(tw/t)*100:null }},
  { id:'e', label:'e. STg Tepat Waktu', formula:'TG Tepat Waktu / TG Terbit', targets:{Q1:92,Q2:92,Q3:92,Q4:92}, bySeksi:true,
    fields:(q,s)=>[{key:`e_tw_${q}_${s}`,label:'TG Tepat Waktu'},{key:`e_terbit_${q}_${s}`,label:'TG Terbit'}],
    calc:(v,q,s)=>{ const tw=parseFloat(v[`e_tw_${q}_${s}`]),t=parseFloat(v[`e_terbit_${q}_${s}`]); return t>0?(tw/t)*100:null }},
  { id:'f', label:'f. Argumentasi Hukum Tepat Waktu', formula:'Konstanta Pentul Closing / Pentul Closing Terbit', targets:{Q1:85,Q2:85,Q3:85,Q4:85}, bySeksi:true,
    fields:(q,s)=>[{key:`f_konst_${q}_${s}`,label:'Konstanta Pentul Closing'},{key:`f_terbit_${q}_${s}`,label:'Pentul Closing Terbit'}],
    calc:(v,q,s)=>{ const k=parseFloat(v[`f_konst_${q}_${s}`]),t=parseFloat(v[`f_terbit_${q}_${s}`]); return t>0?(k/t)*100:null }},
  { id:'g', label:'g. Strategi Penanganan Sengketa Pajak', formula:'SPS Pajak Tepat Waktu / SPS Selesai', targets:{Q1:85,Q2:85,Q3:85,Q4:85}, bySeksi:true,
    fields:(q,s)=>[{key:`g_tw_${q}_${s}`,label:'SPS Pajak Tepat Waktu'},{key:`g_selesai_${q}_${s}`,label:'SPS Selesai'}],
    calc:(v,q,s)=>{ const tw=parseFloat(v[`g_tw_${q}_${s}`]),t=parseFloat(v[`g_selesai_${q}_${s}`]); return t>0?(tw/t)*100:null }},
  { id:'h', label:'h. Kualitas Kompetensi SDM', formula:'Realisasi langsung (%)', targets:{Q1:50,Q2:60,Q3:70,Q4:85}, bySeksi:false,
    fields:(q)=>[{key:`h_real_${q}`,label:'Realisasi (%)'}],
    calc:(v,q)=>{ const r=parseFloat(v[`h_real_${q}`]); return isNaN(r)?null:r }},
  { id:'i', label:'i. Penguatan Budaya & Bintal', formula:'Realisasi langsung (%)', targets:{Q1:100,Q2:100,Q3:100,Q4:100}, bySeksi:false,
    fields:(q)=>[{key:`i_real_${q}`,label:'Realisasi (%)'}],
    calc:(v,q)=>{ const r=parseFloat(v[`i_real_${q}`]); return isNaN(r)?null:r }},
]

const sc = (r,t) => {
  if(r===null) return '#94a3b8'
  if(r>=t) return '#15803d'
  if(r>=t*0.9) return '#b45309'
  return '#b91c1c'
}
const fmt = v => v===null?'—':v.toFixed(1)+'%'

export default function InputData({ q, admin }) {
  const [vals, setVals] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      try {
        const snap = await getDoc(doc(db, 'kpi_data', `${q}_2026`))
        if (snap.exists()) setVals(snap.data().vals || {})
        else setVals({})
      } catch { setVals({}) }
      setLoading(false)
    }
    fetch()
  }, [q])

  const setVal = (k, v) => setVals(p => ({ ...p, [k]: v }))

  const save = async () => {
    setSaving(true)
    setMsg('')
    try {
      await setDoc(doc(db, 'kpi_data', `${q}_2026`), {
        vals,
        updatedAt: serverTimestamp(),
        updatedBy: admin.username,
      })
      setMsg('✅ Data berhasil disimpan.')
    } catch {
      setMsg('❌ Gagal menyimpan data.')
    }
    setSaving(false)
  }

  if (loading) return <div style={{color:'#94a3b8',padding:'2rem',textAlign:'center'}}>Memuat data...</div>

  const s = {
    card: {background:'white',borderRadius:'0.75rem',border:'1px solid #e2e8f0',padding:'1.25rem',marginBottom:'1rem'},
    title: {fontWeight:600,color:'#1e293b',fontSize:'0.95rem',marginBottom:'4px'},
    sub: {fontSize:'0.75rem',color:'#94a3b8',marginBottom:'1rem'},
    grid: {display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:'0.75rem'},
    seksiCard: {border:'1px solid #f1f5f9',borderRadius:'0.5rem',padding:'0.75rem',background:'#f8fafc'},
    seksiTitle: {fontSize:'0.75rem',fontWeight:700,color:'#1e40af',marginBottom:'0.5rem'},
    row: {display:'flex',alignItems:'center',gap:'0.5rem',marginBottom:'0.5rem'},
    lbl: {fontSize:'0.75rem',color:'#64748b',flex:1},
    input: {width:'80px',border:'1px solid #e2e8f0',borderRadius:'0.375rem',padding:'4px 8px',fontSize:'0.8rem',textAlign:'right'},
    result: {display:'flex',alignItems:'center',gap:'0.5rem',paddingTop:'0.5rem',borderTop:'1px solid #e2e8f0',marginTop:'0.25rem'},
    btn: {background:'#1e3a8a',color:'white',padding:'0.625rem 1.5rem',borderRadius:'0.5rem',fontSize:'0.875rem',fontWeight:600,border:'none',cursor:'pointer'},
  }

  return (
    <div>
      <div style={{background:'#eff6ff',border:'1px solid #bfdbfe',borderRadius:'0.75rem',padding:'0.75rem 1rem',marginBottom:'1.5rem',fontSize:'0.875rem',color:'#1e40af'}}>
        Masukkan data realisasi untuk <strong>{q} 2026</strong>. Klik <strong>Simpan</strong> setelah selesai.
      </div>

      {KPI_DEFS.map(kpi => (
        <div key={kpi.id} style={s.card}>
          <div style={s.title}>{kpi.label}</div>
          <div style={s.sub}>Formula: {kpi.formula} | Target {q}: {kpi.targets[q]}%</div>
          {kpi.bySeksi ? (
            <div style={s.grid}>
              {SEKSI.map(se => {
                const real = kpi.calc(vals, q, se)
                return (
                  <div key={se} style={s.seksiCard}>
                    <div style={s.seksiTitle}>Seksi {se}</div>
                    {kpi.fields(q, se).map(f => (
                      <div key={f.key} style={s.row}>
                        <span style={s.lbl}>{f.label}</span>
                        <input type="number" min="0" value={vals[f.key]||''} onChange={e=>setVal(f.key,e.target.value)} placeholder="0" style={s.input}/>
                      </div>
                    ))}
                    <div style={s.result}>
                      <span style={s.lbl}>Realisasi</span>
                      <span style={{fontWeight:700,fontSize:'0.875rem',color:sc(real,kpi.targets[q])}}>{fmt(real)}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div style={{maxWidth:'280px'}}>
              {kpi.fields(q).map(f => (
                <div key={f.key} style={s.row}>
                  <span style={s.lbl}>{f.label}</span>
                  <input type="number" min="0" max="100" value={vals[f.key]||''} onChange={e=>setVal(f.key,e.target.value)} placeholder="0" style={s.input}/>
                </div>
              ))}
              <div style={s.result}>
                <span style={s.lbl}>Realisasi</span>
                <span style={{fontWeight:700,fontSize:'0.875rem',color:sc(kpi.calc(vals,q),kpi.targets[q])}}>{fmt(kpi.calc(vals,q))}</span>
              </div>
            </div>
          )}
        </div>
      ))}

      <div style={{display:'flex',alignItems:'center',gap:'1rem',marginTop:'0.5rem'}}>
        <button onClick={save} disabled={saving} style={{...s.btn,opacity:saving?0.5:1}}>
          {saving?'Menyimpan...':'💾 Simpan Data'}
        </button>
        {msg && <span style={{fontSize:'0.875rem'}}>{msg}</span>}
      </div>
    </div>
  )
}
