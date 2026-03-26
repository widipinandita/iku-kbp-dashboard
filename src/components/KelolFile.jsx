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
    tdLeft: {padding:'10px 12px',fontSize:'0.8rem',color:'#475569',borderBottom:
