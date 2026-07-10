import React, { useState, useEffect } from 'react'

const EMPTY = {
  company_name: '',
  company_location: '',
  mobile_number: '',
  specialization: '',
  website_or_page_link: '',
}

export default function CompanyForm({ onSubmit, editing, onCancel }) {
  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState('')

  useEffect(() => {
    if (editing) {
      setForm({
        company_name: editing.company_name || '',
        company_location: editing.company_location || '',
        mobile_number: editing.mobile_number || '',
        specialization: editing.specialization || '',
        website_or_page_link: editing.website_or_page_link || '',
      })
    } else {
      setForm(EMPTY)
    }
  }, [editing])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const payload = editing ? { ...form, _id: editing._id, _rev: editing._rev } : form
      await onSubmit(payload)
      if (!editing) setForm(EMPTY)
    } catch (err) {
      setError(err.message || 'حدث خطأ أثناء الحفظ')
    }
  }

  const inputClass = 'w-full px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-800 focus:ring-2 focus:ring-primary-400 focus:border-primary-400 outline-none'
  const labelClass = 'block text-sm font-semibold text-slate-700 mb-1.5'

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 fade-in-up">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="bg-primary-600 text-white px-6 py-4 rounded-t-2xl">
          <h2 className="text-xl font-bold">
            {editing ? '✏️ تعديل بيانات الشركة' : '➕ إضافة شركة جديدة'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>اسم الشركة <span className="text-error-500">*</span></label>
              <input
                name="company_name"
                value={form.company_name}
                onChange={handleChange}
                required
                className={inputClass}
                placeholder="أدخل اسم الشركة"
              />
            </div>

            <div>
              <label className={labelClass}>رقم الموبايل <span className="text-error-500">*</span></label>
              <input
                name="mobile_number"
                value={form.mobile_number}
                onChange={handleChange}
                required
                className={inputClass}
                placeholder="01XXXXXXXXX"
                dir="ltr"
              />
            </div>

            <div>
              <label className={labelClass}>الموقع <span className="text-error-500">*</span></label>
              <input
                name="company_location"
                value={form.company_location}
                onChange={handleChange}
                required
                className={inputClass}
                placeholder="المدينة، المنطقة"
              />
            </div>

            <div>
              <label className={labelClass}>التخصص <span className="text-error-500">*</span></label>
              <input
                name="specialization"
                value={form.specialization}
                onChange={handleChange}
                required
                className={inputClass}
                placeholder="نوع النشاط"
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>رابط الويب سايت أو الصفحة (اختياري)</label>
            <input
              name="website_or_page_link"
              value={form.website_or_page_link}
              onChange={handleChange}
              className={inputClass}
              placeholder="https://..."
              dir="ltr"
            />
          </div>

          {error && (
            <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 rounded-lg shadow-md"
            >
              {editing ? 'حفظ التعديلات' : 'حفظ الشركة'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="px-6 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-lg"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
