import { useEffect, useState } from 'react'
import { db } from '../firebase'
import { doc, getDoc } from 'firebase/firestore'

const SEKSI = ['KBP I', 'KBP II', 'KBP III', 'KBP IV']

const KPI_DEFS = [
  { id:'a', label:'a. Keberatan Tepat Waktu', targets:{Q1:85,Q2:85,Q3:85,Q4:85},
    calc:(v,q,s)=>{ const tw=parseFloat(v[`a_tw_${q}_${s}`]),t=parseFloat(v[`a_terbit_${q}_${s}`]); return t>0?(tw/t)*100:null }},
  { id:'b', label:'b. Nonkeberatan Tepat Waktu', targets:{Q1:91,Q2:91,Q3:91,Q4:91},
    calc:(v,q,s)=>{ const tw=parseFloat(v[`b_tw_${q}_${s}`]),t=parseFloat(v[`b_terbit_${q}_${s}`]); return t>0?(tw/t)*100:null }},
  { id:'c', label:'c. Sengketa Perpajakan Dipertahankan', targets:{Q1:78,Q2:78,Q3:78,Q4:78},
    calc:(v,q,s)=>{ const k=parseFloat(v[`c_konst_${q}_${s}`]),t=parseFloat(v[`c_terbit_${q}_${s}`]),d=parseFloat(v[`c_dkb_${q}_${s}`]); return (t>0&&!isNaN(k)&&!isNaN(d))?0.65*(k/t)*100+0.35*(d/47)*100:null }},
  { id:'d', label:'d. SUB Tepat Waktu', targets:{Q1:90,Q2:90,Q3:90,Q4:90},
    calc:(v,q,s)=>{ const tw=parseFloat(v[`d_tw_${q}_${s}`]),t=parseFloat(v[`d_terbit_${q}_${s}`]); return t>0?(tw/t)*100:null }},
  { id:'e', label:'e. STg Tepat Waktu', targets:{Q1:92,Q2:92,Q3:92,Q4:92},
    calc:(v,q,s)=>{ const tw=parseFloat(v[`e_tw_${q}_${s}`]),t=parseFloat(v[`e_terbit_${q}_${s}`]); return t>0?(tw/t)*100:null }},
  { id:'f', label:'f. Argumentasi Hukum Tepat Waktu', targets:{Q1:85,Q2:85,Q3:85,Q4:85},
    calc:(v,q,s)=>{ const k=parseFloat(v[`f_konst_${q}_${s}`]),t=parseFloat(v[`f_terbit_${q}_${s}`]); return t>0?(k/t)*100:null }},
  { id:'g', label:'g. Strategi Penanganan Sengketa Pajak', targets:{Q1:85,Q2:85,Q3:85,Q4:85},
    calc:(v,q,s)=>{ const k=parseFloat(v[`g_konst_${q}_${s}`]),t=parseFloat(v[`g_terbit_${q}_${s}`]); return t>0?(k/t)*100:null }},
]

const sc = (r,t) => {
  if(r===null) return {bar:'#e2e8f0',text:'#94a3b8'}
  if(r>=t) return {bar:'#22c55e',text:'#15803d'}
  if(r>=t*0.9) return {bar:'#f59e0b',text:'#b45309'}
  return {bar:'#ef4444',text:'#b91c1c'}
}
const fmt = v => v===null?'—':v.toFixed(1)+'%'

export default function PerSeksi({ q }) {
  const [vals, setVals] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      try {
        const snap = await getDoc(doc(db, 'kpi_data', `${q}_2025`))
        if (snap.exists()) setVals(snap.data().vals || {})
        else setVals({})
      } catch { setVals({}) }
      setLoading(false)
    }
    fetch()
  }, [q])

  if (loading) return <div style={{color:'#94a3b8',padding:'2rem',textAlign:'center'}}>Memuat data...</div>

  return (
    <div style={{display:'flex',flexDirection:'column',gap:'1.5rem'}}>
      {SEKSI.map(s => {
        const metCount = KPI_DEFS.filter(k => { const v=k.calc(vals,q,s); return v!==null&&v>=k.targets[q] }).length
        const total = KPI_DEFS.filter(k => k.calc(vals,q,s)!==null).length
        return (
          <div key={s} style={{background:'white',borderRadius:'0.75rem',border:'1px solid #e2e8f0',padding:'1.25rem'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'1rem'}}>
              <h2 style={{fontWeight:700,color:'#1e293b',fontSize:'1rem',margin:0}}>Seksi {s}</h2>
              <span style={{fontSize:'0.75rem',background:'#dbeafe',color:'#1e40af',fontWeight:600,padding:'2px 10px',borderRadius:'99px'}}>
                {total>0?`${metCount}/${total} IKU Tercapai`:'Belum ada data'}
              </span>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:'0.75rem'}}>
              {KPI_DEFS.map(kpi => {
                const v = kpi.calc(vals,q,s)
                const c = sc(v,kpi.targets[q])
                return (
                  <div key={kpi.id}>
                    <div style={{display:'flex',justifyContent:'space-between',fontSize:'0.8rem',marginBottom:'4px'}}>
                      <span style={{color:'#475569'}}>{kpi.label}</span>
                      <span style={{fontWeight:600,color:c.text}}>{fmt(v)} <span style={{color:'#94a3b8',fontWeight:400}}>/ {kpi.targets[q]}%</span></span>
                    </
