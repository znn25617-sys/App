import React, { useState, useEffect, useCallback } from 'react'
import SearchBar from './components/SearchBar.jsx'
import CompanyForm from './components/CompanyForm.jsx'
import CompanyList from './components/CompanyList.jsx'
import StatusBar from './components/StatusBar.jsx'
import { getAllCompanies, addCompany, updateCompany, deleteCompany } from './lib/db.js'
import { rebuildIndex, addToIndex, removeFromIndex } from './lib/search.js'
import {
  startP2PSync,
  handleGetAllDocsRequest,
  handleReceiveDocs,
  pushToAllPeers,
} from './lib/p2pSync.js'
import { syncToCloud } from './lib/cloudSync.js'

export default function App() {
  const [companies, setCompanies] = useState([])
  const [searchResults, setSearchResults] = useState(null)
  const [editing, setEditing] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [peers, setPeers] = useState([])
  const [cloudStatus, setCloudStatus] = useState('')
  const [loading, setLoading] = useState(true)

  const loadCompanies = useCallback(async () => {
    const docs = await getAllCompanies()
    setCompanies(docs)
    rebuildIndex(docs)
    setLoading(false)
  }, [])

  useEffect(() => {
    loadCompanies()
    startP2PSync()
    handleGetAllDocsRequest()
    handleReceiveDocs()

    if (window.electronP2P) {
      window.electronP2P.onPeerDiscovered((_peer) => {
        window.electronP2P.getPeers().then(setPeers)
      })
      window.electronP2P.getPeers().then(setPeers)
    }

    // Refresh from peers every 15s (the sync loop also runs, but we want
    // the UI to reflect newly pulled docs).
    const refreshInterval = setInterval(loadCompanies, 15000)
    return () => clearInterval(refreshInterval)
  }, [loadCompanies])

  const handleAdd = async (data) => {
    if (editing) {
      const updated = await updateCompany(editing)
      await loadCompanies()
      setEditing(null)
      setShowForm(false)
      await pushToAllPeers()
      return { ok: true }
    }
    const doc = await addCompany(data)
    addToIndex(doc)
    setCompanies((prev) => [...prev, doc].sort((a, b) => a.id - b.id))
    setShowForm(false)
    await pushToAllPeers()
    return { ok: true }
  }

  const handleEdit = (company) => {
    setEditing(company)
    setShowForm(true)
  }

  const handleDelete = async (company) => {
    await deleteCompany(company._id)
    removeFromIndex(company)
    setCompanies((prev) => prev.filter((c) => c._id !== company._id))
    await pushToAllPeers()
  }

  const handleSearch = (results) => {
    setSearchResults(results)
  }

  const handleCloudSync = async () => {
    setCloudStatus('جارٍ المزامنة مع السحابة...')
    const result = await syncToCloud()
    if (result.ok) {
      setCloudStatus(`تم رفع ${result.count} شركة إلى النسخة السحابية`)
    } else {
      setCloudStatus(`فشل: ${result.reason}`)
    }
    setTimeout(() => setCloudStatus(''), 5000)
  }

  const displayCompanies = searchResults !== null ? searchResults : companies

  return (
    <div className="min-h-screen flex flex-col" dir="rtl">
      <header className="bg-gradient-to-l from-primary-700 to-primary-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <span className="text-3xl">🏢</span>
              دليل الشركات
            </h1>
            <p className="text-primary-100 text-sm mt-1">
              قاعدة بيانات محلية مع مزامنة لاسلكية ونسخة سحابية احتياطية
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleCloudSync}
              className="bg-white/15 hover:bg-white/25 text-white px-4 py-2 rounded-lg font-medium border border-white/20"
            >
              ☁️ نسخة سحابية
            </button>
            <button
              onClick={() => { setEditing(null); setShowForm(true) }}
              className="bg-accent-500 hover:bg-accent-600 text-white px-5 py-2 rounded-lg font-bold shadow-md"
            >
              + إضافة شركة
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-6">
        <SearchBar onSearch={handleSearch} companies={companies} />

        {showForm && (
          <CompanyForm
            onSubmit={handleAdd}
            editing={editing}
            onCancel={() => { setShowForm(false); setEditing(null) }}
          />
        )}

        {loading ? (
          <div className="text-center py-20 text-slate-500 text-lg">جارٍ التحميل...</div>
        ) : (
          <CompanyList
            companies={displayCompanies}
            onEdit={handleEdit}
            onDelete={handleDelete}
            isSearch={searchResults !== null}
          />
        )}
      </main>

      <StatusBar
        peerCount={peers.length}
        totalCount={companies.length}
        cloudStatus={cloudStatus}
      />
    </div>
  )
}
