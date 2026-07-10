import React, { useState, useMemo } from 'react'
import { searchCompanies } from '../lib/search.js'

export default function SearchBar({ onSearch, companies }) {
  const [query, setQuery] = useState('')
  const [searchType, setSearchType] = useState('all')

  const placeholder = useMemo(() => {
    const labels = {
      all: 'ابحث بالاسم أو التخصص أو الهاتف أو الموقع...',
      company_name: 'ابحث باسم الشركة...',
      specialization: 'ابحث بالتخصص...',
      mobile_number: 'ابحث برقم الموبايل...',
      company_location: 'ابحث بالموقع...',
    }
    return labels[searchType] || labels.all
  }, [searchType])

  const handleSearch = (value) => {
    setQuery(value)
    if (!value.trim()) {
      onSearch(null)
      return
    }
    // FlexSearch indexes all fields; for field-specific search we filter
    // the FlexSearch results by the selected field.
    const results = searchCompanies(value)
    if (searchType === 'all') {
      onSearch(results)
    } else {
      onSearch(results.filter((c) => {
        const fieldVal = (c[searchType] || '').toString()
        return fieldVal.includes(value.trim())
      }))
    }
  }

  const clearSearch = () => {
    setQuery('')
    onSearch(null)
  }

  return (
    <div className="mb-6 bg-white rounded-xl shadow-sm border border-slate-200 p-4">
      <div className="flex flex-col md:flex-row gap-3">
        <select
          value={searchType}
          onChange={(e) => setSearchType(e.target.value)}
          className="px-4 py-3 rounded-lg border border-slate-300 bg-slate-50 text-slate-700 font-medium focus:ring-2 focus:ring-primary-400 focus:border-primary-400 outline-none md:w-48"
        >
          <option value="all">كل الحقول</option>
          <option value="company_name">اسم الشركة</option>
          <option value="specialization">التخصص</option>
          <option value="mobile_number">رقم الموبايل</option>
          <option value="company_location">الموقع</option>
        </select>

        <div className="relative flex-1">
          <input
            type="text"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder={placeholder}
            className="w-full px-5 py-3 pr-12 rounded-lg border border-slate-300 bg-white text-slate-800 text-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-400 outline-none"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl">
            🔍
          </span>
          {query && (
            <button
              onClick={clearSearch}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xl"
              title="مسح البحث"
            >
              ✕
            </button>
          )}
        </div>
      </div>
      <p className="text-xs text-slate-400 mt-2">
        محرك البحث يعمل دون اتصال بالإنترنت — يبحث فوراً في بياناتك المحلية
      </p>
    </div>
  )
}
