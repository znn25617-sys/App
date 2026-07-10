import React from 'react'

export default function CompanyList({ companies, onEdit, onDelete, isSearch }) {
  if (companies.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-xl border border-slate-200">
        <span className="text-6xl block mb-4">📋</span>
        <p className="text-slate-500 text-lg">
          {isSearch ? 'لا توجد نتائج مطابقة للبحث' : 'لا توجد شركات بعد. ابدأ بإضافة شركة جديدة.'}
        </p>
      </div>
    )
  }

  return (
    <div>
      {isSearch && (
        <p className="text-sm text-primary-600 font-semibold mb-3">
          نتائج البحث: {companies.length} شركة
        </p>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {companies.map((company) => (
          <CompanyCard
            key={company._id}
            company={company}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  )
}

function CompanyCard({ company, onEdit, onDelete }) {
  const [confirmDelete, setConfirmDelete] = React.useState(false)

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition-shadow fade-in-up">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="bg-primary-100 text-primary-700 text-sm font-bold px-2.5 py-1 rounded-lg">
            #{company.id}
          </span>
          <h3 className="font-bold text-slate-800 text-lg leading-tight">
            {company.company_name}
          </h3>
        </div>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2 text-slate-600">
          <span className="text-slate-400">📍</span>
          <span>{company.company_location}</span>
        </div>
        <div className="flex items-center gap-2 text-slate-600">
          <span className="text-slate-400">📱</span>
          <span dir="ltr">{company.mobile_number}</span>
        </div>
        <div className="flex items-center gap-2 text-slate-600">
          <span className="text-slate-400">🏷️</span>
          <span className="bg-accent-50 text-accent-700 px-2 py-0.5 rounded text-xs font-medium">
            {company.specialization}
          </span>
        </div>
        {company.website_or_page_link && (
          <div className="flex items-center gap-2 text-slate-600">
            <span className="text-slate-400">🔗</span>
            <a
              href={company.website_or_page_link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 hover:text-primary-800 underline truncate"
              dir="ltr"
            >
              {company.website_or_page_link}
            </a>
          </div>
        )}
      </div>

      <div className="flex gap-2 mt-4 pt-3 border-t border-slate-100">
        <button
          onClick={() => onEdit(company)}
          className="flex-1 bg-primary-50 hover:bg-primary-100 text-primary-700 font-medium py-2 rounded-lg text-sm"
        >
          ✏️ تعديل
        </button>
        {confirmDelete ? (
          <div className="flex gap-1">
            <button
              onClick={() => onDelete(company)}
              className="bg-error-500 hover:bg-error-600 text-white font-medium py-2 px-3 rounded-lg text-sm"
            >
              تأكيد
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium py-2 px-3 rounded-lg text-sm"
            >
              إلغاء
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="flex-1 bg-error-50 hover:bg-error-100 text-error-600 font-medium py-2 rounded-lg text-sm"
          >
            🗑️ حذف
          </button>
        )}
      </div>
    </div>
  )
}
