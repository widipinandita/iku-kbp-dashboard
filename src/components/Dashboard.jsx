import { useState, useEffect, useMemo } from 'react'
import { db } from '../firebase'
import { doc, getDoc } from 'firebase/firestore'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts'

const SEKSI = ['KBP I', 'KBP II', 'KBP III', 'KBP IV']
const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4']

const KPI_DEFS = [
  { id:'a', label:'a. Keberatan Tepat Waktu', formula:'SK Tepat Waktu / SK Terbit', targets:{Q1:85,Q2:85,Q3:85,Q4:85}, bySeksi:true,
    calc:(v,q,s)=>{ const tw=parseFloat(v[`a_tw_${q}_${s}`]),t=parseFloat(v[`a_terbit_${q}_${s}`]); return t>0?(tw/t)*100:null }},
  { id:'b', label:'b. Nonkeberatan Tepat Waktu', formula:'SK Tepat Waktu / SK Terbit', targets:{Q1:91,Q2:91,Q3:91,Q4:91}, bySeksi:true,
    calc:(v,q,s)=>{ const tw=parseFloat(v[`b_tw_${q}_${s}`]),t=parseFloat(v[`b_terbit_${q}_${s}`]); return t>0?(tw/t)*100:null }},
  { id:'c', label:'c. Sengketa Perpajakan Dipertahankan', formula:'65%×(Konstanta/SK Terbit) + 35%×(DKB/47%)', targets:{Q1:78,Q2:78,Q3:78,Q4:78}, bySeksi:true,
    calc:(v,q,s)=>{ const k=parseFloat(v[`c_konst_${q}_${s}`]),t=parseFloat(v[`c_terbit_${q}_${s}`]),d=parseFloat(v[`c_dkb_${q}_${s}`]); return (t>0&&!isNaN(k)&&!isNaN(d))?0.65*(k/t)*100+0.35*(d/47)*100:null }},
  { id:'d', label:'d. SUB Tepat Waktu', formula:'SUB Tepat Waktu / SUB Terbit', targets:{Q1:90,Q2:90,Q3:90,Q4:90}, bySeksi:true,
    calc:(v,q,s)=>{ const tw=parseFloat(v[`d_tw_${q}_${s}`]),t=parseFloat(v[`d_terbit_${q}_${s}`]); return t>0?(tw/t)*100:null }},
  { id:'e', label:'e. STg Tepat Waktu', formula:'TG Tepat Waktu / TG Terbit', targets:{Q1:92,Q2:92,Q3:92,Q4:92}, bySeksi:true,
    calc:(v,q,s)=>{ const tw=parseFloat(v[`e_tw_${q}_${s}`]),t=parseFloat(v[`e_terbit_${q}_${s}`]); return t>0?(tw/t)*100:null }},
  { id:'f', label:'f. Argumentasi Hukum Tepat Waktu', formula:'Konstanta Pentul Closing / Pentul Closing Terbit', targets:{Q1:85,Q2:85,Q3:85,Q4:85}, bySeksi:true,
    calc:(v,q,s)=>{ const k=parseFloat(v[`f_konst_${q}_${s}`]),t=parseFloat(v[`f_terbit_${q}_${s}`]); return t>0?(k/t)*100:null }},
  { id:'g', label:'g. Strategi Penanganan Sengketa Pajak', formula:'60%×(SPS Tepat Waktu/SPS Diselesaikan) + 40%×(Resume Tepat Waktu/Resume Diselesaikan)', targets:{Q1:85,Q2:85,Q3:85,Q4:85}, bySeksi:true,
    calc:(v,q,s)=>{ const stw=parseFloat(v[`g_stw_${q}_${s}`]),sd=parseFloat(v[`g_sd_${q}_${s}`]),rtw=parseFloat(v[`g_rtw_${q}_${s}`]),rd=parseFloat(v[`g_rd_${q}_${s}`]); return (sd>0&&rd>0)?0.6*(stw/sd)*100+0.4*(rtw/rd)*100:null }},
  { id:'h', label:'h. Kualitas Kompetensi SDM', formula:'Realisasi langsung (%)', targets:{Q1:50,Q2:60,Q3:70,Q4:85}, bySeksi:false,
    calc:(v,q)=>{ const r=parseFloat(v[`h_real_${q}`]); return isNaN(r)?null:r }},
  { id:'i', label:'i. Penguatan Budaya & Bintal', formula:'Realisasi langsung (%)', targets:{Q1:100,Q2:100,Q3:100,Q4:100}, bySeksi:false,
    calc:(v,q)=>{ const r=parseFloat(v[`i_real_${q}`]); return isNaN(r)?null:r }},
]

const sc = (r,t) => {
  if(r===null) return {bg:'#f8fafc',text:'#94a3b8',bar:'#e2e8f0',badge:'#f1f5f9',badgeText:'#94a3b8'}
  if(r>=t) return {bg:'#f0fdf4',text:'#15803d',bar:'#22c55e',badge:'#dcfce7',badgeText:'#15803d'}
  if(r>=t*0.9) return {bg:'#fffbeb',text:'#b45309',bar:'#f59e0b',badge:'#fef3c7',badgeText:'#b45309'}
  return {bg:'#fef2f2',text:'#b91c1c',bar:'#ef4444',badge:'#fee2e2',badgeText:'#b91c1c'}
}
const fmt = v => v===null?'—':v.toFixed(1)+'%'

export default function Dashboard({ q, admin }) {
  const [vals, setVals] = useState({})
  const [links, setLinks] = useState({})
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const snap = await getDoc(doc(db, 'kpi_data', `${q}_2026`))
        if (snap.exists()) setVals(snap.data().vals || {})
        else setVals({})
      } catch { setVals({}) }
      setLoading(false)
    }
    fetchData()
  }, [q])

  useEffect(() => {
    const fetchLinks = async () => {
      const result = {}
      for (const kpi of KPI_DEFS.filter(k => k.bySeksi)) {
        const key = `${kpi.id}_${q}_2026`
        try {
          const snap = await getDoc(doc(db, 'excel_files', key))
          if (snap.exists()) result[key] = snap.data().url || ''
        } catch {}
      }
      setLinks(result)
    }
    fetchLinks()
  }, [q])

  const realisasi = useMemo(() => {
    const res = {}
    KPI_DEFS.forEach(kpi => {
      res[kpi.id] = {}
      QUARTERS.forEach(qr => {
        if (kpi.bySeksi) {
          res[kpi.id][qr] = {}
          SEKSI.forEach(s => { res[kpi.id][qr][s] = kpi.calc(vals, qr, s) })
          const valids = SEKSI.map(s => res[kpi.id][qr][s]).filter(v => v!==null)
          res[kpi.id][qr]['_avg'] = valids.length>0 ? valids.reduce((a,b)=>a+b,0)/valids.length : null
        } else {
          res[kpi.id][qr] = kpi.calc(vals, qr)
        }
      })
    })
    return res
  }, [vals])

  const summary = useMemo(() => {
    let met=0,near=0,below=0,nodata=0
    KPI_DEFS.forEach(kpi => {
      const target=kpi.targets[q]
      const real=kpi.bySeksi?realisasi[kpi.id][q]['_avg']:realisasi[kpi.id][q]
      if(real===null){nodata++;return}
      if(real>=target) met++
      else if(real>=target*0.9) near++
      else below++
    })
    return {met,near,below,nodata}
  }, [realisasi, q])

  if (loading) return <div style={{color:'#94a3b8',padding:'2rem',textAlign:'center'}}>Memuat data...</div>

  const s = {
    kpiCard: (bg) => ({background:bg,borderRadius:'0.75rem',border:'1px solid #e2e8f0',overflow:'hidden',marginBottom:'0.75rem'}),
    seksiMini: (bg) => ({borderRadius:'0.5rem',padding:'0.75rem',background:bg,border:'1px solid #f1f5f9',flex:1,minWidth:'120px'}),
    btnDetail: (hasLink) => ({
      fontSize:'0.75rem',padding:'4px 12px',borderRadius:'6px',
      border: hasLink?'none':'1px solid #e2e8f0',
      background: hasLink?'#1e3a8a':'white',
      color: hasLink?'white':'#94a3b8',
      cursor: hasLink?'pointer':'default',
      fontWeight:500,
    }),
  }

  return (
    <div>
      {/* Summary cards */}
      <div style={{display:'flex',gap:'0.75rem',marginBottom:'1.5rem',flexWrap:'wrap'}}>
        {[
          {label:'Tercapai',count:summary.met,bg:'#dcfce7',color:'#15803d',icon:'✅'},
          {label:'Mendekati',count:summary.near,bg:'#fef3c7',color:'#b45309',icon:'⚠️'},
          {label:'Di Bawah',count:summary.below,bg:'#fee2e2',color:'#b91c1c',icon:'❌'},
          {label:'Belum Ada Data',count:summary.nodata,bg:'#f1f5f9',color:'#64748b',icon:'⬜'},
        ].map(c => (
          <div key={c.label} style={{background:c.bg,borderRadius:'0.75rem',padding:'1rem',flex:'1',minWidth:'120px'}}>
            <div style={{fontSize:'1.5rem',fontWeight:700,color:c.color}}>{c.icon} {c.count}</div>
            <div style={{fontSize:'0.75rem',marginTop:'2px',fontWeight:500,color:c.color}}>{c.label}</div>
          </div>
        ))}
      </div>

      {/* KPI Cards */}
      {KPI_DEFS.map(kpi => {
        const target = kpi.targets[q]
        const real = kpi.bySeksi ? realisasi[kpi.id][q]['_avg'] : realisasi[kpi.id][q]
        const c = sc(real, target)
        const isExp = expanded === kpi.id
        const link = links[`${kpi.id}_${q}_2025`]
        const hasLink = !!link

        return (
          <div key={kpi.id} style={s.kpiCard(c.bg)}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'1rem 1.25rem',gap:'0.75rem'}}>
              <button style={{flex:1,textAlign:'left',background:'none',border:'none',cursor:'pointer',padding:0}}
                onClick={()=>setExpanded(isExp?null:kpi.id)}>
                <div style={{fontWeight:600,color:'#1e293b',fontSize:'0.9rem'}}>{kpi.label}</div>
                <div style={{fontSize:'0.75rem',color:'#94a3b8',marginTop:'2px'}}>{kpi.formula}</div>
              </button>
              <div style={{display:'flex',alignItems:'center',gap:'0.5rem',flexShrink:0}}>
                <span style={{fontSize:'0.75rem',fontWeight:600,padding:'3px 10px',borderRadius:'99px',background:c.badge,color:c.badgeText}}>
                  {real!==null?`${fmt(real)} / ${target}%`:`Target: ${target}%`}
                </span>
                {kpi.bySeksi && (
                  <button
                    style={s.btnDetail(hasLink)}
                    onClick={() => hasLink && window.open(link, '_blank')}
                    title={hasLink ? 'Buka di SharePoint' : 'Link belum diset oleh admin'}
                  >
                    🔗 Detail
                  </button>
                )}
                <button onClick={()=>setExpanded(isExp?null:kpi.id)}
                  style={{background:'none',border:'none',cursor:'pointer',color:'#94a3b8',fontSize:'0.875rem',padding:'0 4px'}}>
                  {isExp?'▲':'▼'}
                </button>
              </div>
            </div>

            {isExp && (
              <div style={{padding:'0 1.25rem 1.25rem',borderTop:'1px solid #f1f5f9',background:'white'}}>
                {kpi.bySeksi ? (
                  <>
                    <div style={{display:'flex',gap:'0.75rem',marginTop:'1rem',marginBottom:'1rem',flexWrap:'wrap'}}>
                      {SEKSI.map(se => {
                        const sv = realisasi[kpi.id][q][se]
                        const ss = sc(sv, target)
                        return (
                          <div key={se} style={s.seksiMini(ss.bg)}>
                            <div style={{fontSize:'0.7rem',fontWeight:600,color:'#64748b'}}>Seksi {se}</div>
                            <div style={{fontSize:'1.25rem',fontWeight:700,color:ss.text,marginTop:'2px'}}>{fmt(sv)}</div>
                            <div style={{fontSize:'0.7rem',color:'#94a3b8'}}>Target: {target}%</div>
                          </div>
                        )
                      })}
                    </div>
                    <div style={{height:'200px'}}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={SEKSI.map(se=>({
                            name:se,
                            Realisasi:realisasi[kpi.id][q][se]!==null?+realisasi[kpi.id][q][se].toFixed(2):null,
                            Target:target
                          }))}
                          margin={{top:5,right:10,left:-10,bottom:5}}>
                          <CartesianGrid strokeDasharray="3 3"/>
                          <XAxis dataKey="name" tick={{fontSize:12}}/>
                          <YAxis domain={[0,100]} tick={{fontSize:11}}/>
                          <Tooltip formatter={v=>v!==null?v+'%':'—'}/>
                          <ReferenceLine y={target} stroke="#f59e0b" strokeDasharray="4 4"
                            label={{value:`Target ${target}%`,position:'insideTopRight',fontSize:11,fill:'#b45309'}}/>
                          <Bar dataKey="Realisasi" fill="#1e3a8a" radius={[4,4,0,0]}/>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </>
                ) : (
                  <div style={{height:'180px',marginTop:'1rem'}}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={QUARTERS.map(qr=>({
                          name:qr,
                          Realisasi:realisasi[kpi.id][qr]!==null?+realisasi[kpi.id][qr].toFixed(2):null,
                          Target:kpi.targets[qr]
                        }))}
                        margin={{top:5,right:10,left:-10,bottom:5}}>
                        <CartesianGrid strokeDasharray="3 3"/>
                        <XAxis dataKey="name" tick={{fontSize:12}}/>
                        <YAxis domain={[0,110]} tick={{fontSize:11}}/>
                        <Tooltip formatter={v=>v!==null?v+'%':'—'}/>
                        <Bar dataKey="Realisasi" fill="#1e3a8a" radius={[4,4,0,0]}/>
                        <Bar dataKey="Target" fill="#f59e0b" radius={[4,4,0,0]} opacity={0.6}/>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
