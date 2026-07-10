import PouchDB from 'pouchdb'

// Local-first offline database. Data persists to disk via LevelDB adapter
// (PouchDB's default in Node/Electron environments).
const localDB = new PouchDB('companies_db')

// Counter document key used to track the last assigned auto-increment id.
const COUNTER_DOC_ID = '_local/auto_increment_counter'

/**
 * Returns the next auto-increment id (starts at 1, counts up: 1, 2, 3, ...).
 * Uses a PouchDB local document so it does not participate in replication,
 * keeping the counter per-device and avoiding sync conflicts.
 */
export async function getNextId() {
  let current = 0
  try {
    const doc = await localDB.get(COUNTER_DOC_ID)
    current = doc.value || 0
  } catch (err) {
    if (err.status !== 404) throw err
    // Counter not yet initialized; start at 0 so the first id is 1.
  }
  const next = current + 1
  await localDB.put({
    _id: COUNTER_DOC_ID,
    value: next,
  })
  return next
}

/**
 * Company schema (الشركات):
 *   id            (Number, auto-increment, mandatory, starts at 1)
 *   company_name  (String, required)  — اسم الشركة
 *   company_location (String, required) — موقع الشركة
 *   mobile_number (String, required)  — رقم الموبايل
 *   specialization (String, required) — التخصص
 *   website_or_page_link (String, optional) — رابط الويب سايت أو الصفحة
 */
export async function addCompany(company) {
  validateCompany(company)
  const id = await getNextId()
  const doc = {
    _id: `company_${id}`,
    id,
    company_name: company.company_name.trim(),
    company_location: company.company_location.trim(),
    mobile_number: company.mobile_number.trim(),
    specialization: company.specialization.trim(),
    website_or_page_link: (company.website_or_page_link || '').trim(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  const result = await localDB.put(doc)
  return { ...doc, _rev: result.rev }
}

export async function updateCompany(doc) {
  validateCompany(doc)
  const existing = await localDB.get(doc._id)
  const updated = {
    ...existing,
    company_name: doc.company_name.trim(),
    company_location: doc.company_location.trim(),
    mobile_number: doc.mobile_number.trim(),
    specialization: doc.specialization.trim(),
    website_or_page_link: (doc.website_or_page_link || '').trim(),
    updatedAt: new Date().toISOString(),
  }
  const result = await localDB.put(updated)
  return { ...updated, _rev: result.rev }
}

export async function deleteCompany(docId) {
  const doc = await localDB.get(docId)
  await localDB.remove(doc)
}

export async function getAllCompanies() {
  const result = await localDB.allDocs({ include_docs: true, attachments: false })
  return result.rows
    .filter((row) => row.id.startsWith('company_'))
    .map((row) => row.doc)
    .sort((a, b) => a.id - b.id)
}

export async function getCompanyById(id) {
  return localDB.get(`company_${id}`)
}

function validateCompany(company) {
  const required = {
    company_name: 'اسم الشركة',
    company_location: 'موقع الشركة',
    mobile_number: 'رقم الموبايل',
    specialization: 'التخصص',
  }
  for (const [key, label] of Object.entries(required)) {
    if (!company[key] || !String(company[key]).trim()) {
      throw new Error(`الحقل مطلوب: ${label}`)
    }
  }
}

export default localDB
