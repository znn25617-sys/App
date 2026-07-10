// Vercel Serverless Function: sync local companies to MongoDB Atlas.
// Receives a POST with { companies: [...] } and upserts each by its
// auto-increment `id` field, so the cloud backup mirrors local data.

import { getCompaniesCollection } from './mongodb.js'

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { companies } = req.body || {}

    if (!Array.isArray(companies)) {
      return res.status(400).json({ error: 'companies must be an array' })
    }

    const collection = await getCompaniesCollection()

    if (companies.length === 0) {
      return res.status(200).json({ ok: true, upserted: 0, message: 'No companies to sync' })
    }

    // Build bulk upsert operations keyed on the auto-increment `id`.
    const operations = companies.map((company) => ({
      updateOne: {
        filter: { id: company.id },
        update: {
          $set: {
            id: company.id,
            company_name: company.company_name,
            company_location: company.company_location,
            mobile_number: company.mobile_number,
            specialization: company.specialization,
            website_or_page_link: company.website_or_page_link || '',
            updatedAt: new Date(),
          },
          $setOnInsert: {
            createdAt: new Date(),
          },
        },
        upsert: true,
      },
    }))

    const result = await collection.bulkWrite(operations, { ordered: false })

    return res.status(200).json({
      ok: true,
      upserted: result.upsertedCount || 0,
      modified: result.modifiedCount || 0,
      total: companies.length,
    })
  } catch (err) {
    console.error('Sync error:', err)
    return res.status(500).json({ error: err.message })
  }
}
