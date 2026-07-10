import { getAllCompanies } from './db.js'

// Cloud backup to MongoDB Atlas via Vercel serverless function.
// Only runs when internet is available; failures are silent (local-first).

const VERCEL_API_URL = import.meta.env.VITE_VERCEL_API_URL || ''

export async function syncToCloud() {
  if (!VERCEL_API_URL) {
    return { ok: false, reason: 'لم يتم ضبط رابط الـ API' }
  }
  if (!navigator.onLine) {
    return { ok: false, reason: 'لا يوجد اتصال بالإنترنت' }
  }
  try {
    const docs = await getAllCompanies()
    const res = await fetch(`${VERCEL_API_URL}/api/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companies: docs }),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return { ok: true, count: docs.length }
  } catch (err) {
    return { ok: false, reason: err.message }
  }
}

export async function restoreFromCloud() {
  if (!VERCEL_API_URL) return { ok: false, reason: 'لم يتم ضبط رابط الـ API' }
  if (!navigator.onLine) return { ok: false, reason: 'لا يوجد اتصال بالإنترنت' }
  try {
    const res = await fetch(`${VERCEL_API_URL}/api/companies`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    return { ok: true, companies: data.companies || [] }
  } catch (err) {
    return { ok: false, reason: err.message }
  }
}
