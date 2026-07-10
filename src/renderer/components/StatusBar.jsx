import React, { useState, useEffect } from 'react'

export default function StatusBar({ peerCount, totalCount, cloudStatus }) {
  const [online, setOnline] = useState(navigator.onLine)

  useEffect(() => {
    const goOnline = () => setOnline(true)
    const goOffline = () => setOnline(false)
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])

  return (
    <footer className="bg-slate-800 text-slate-200 px-6 py-3 text-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${online ? 'bg-success-400' : 'bg-warning-400'}`} />
            <span>{online ? 'متصل بالإنترنت' : 'غير متصل — وضع محلي'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">📡</span>
            <span>الأجهزة المتصلة: {peerCount}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">📊</span>
            <span>إجمالي الشركات: {totalCount}</span>
          </div>
        </div>
        <div className="text-slate-400 text-xs">
          {cloudStatus || 'قاعدة بيانات محلية — مزامنة P2P عبر الواي فاي'}
        </div>
      </div>
    </footer>
  )
}
