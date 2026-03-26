import { useState } from 'react'
import { db } from '../firebase'
import { collection, query, where, getDocs } from 'firebase/firestore'

export async function hashPassword(password) {
  const msgBuffer = new TextEncoder().encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

export function useAuth() {
  const [admin, setAdmin] = useState(() => {
    const saved = sessionStorage.getItem('iku_admin')
    return saved ? JSON.parse(saved) : null
  })

  const login = async (username, password) => {
    const hash = await hashPassword(password)
    const q = query(
      collection(db, 'admins'),
      where('username', '==', username),
      where('passwordHash', '==', hash)
    )
    const snap = await getDocs(q)
    if (snap.empty) throw new Error('Username atau password salah.')
    const data = { id: snap.docs[0].id, ...snap.docs[0].data() }
    sessionStorage.setItem('iku_admin', JSON.stringify(data))
    setAdmin(data)
    return data
  }

  const logout = () => {
    sessionStorage.removeItem('iku_admin')
    setAdmin(null)
  }

  return { admin, login, logout }
}
