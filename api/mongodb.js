// MongoDB Atlas connection helper for Vercel serverless functions.
// Uses the official 'mongodb' Node.js driver with connection pooling.
import { MongoClient } from 'mongodb'

const MONGODB_URI = process.env.MONGODB_URI
const DB_NAME = process.env.MONGODB_DB || 'companies_db'

// Reuse the connection across warm serverless invocations.
let cachedClient = null
let cachedDb = null

export async function getDb() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb }
  }
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable is not set')
  }
  const client = new MongoClient(MONGODB_URI, {
    serverSelectionTimeoutMS: 10000,
    maxPoolSize: 10,
  })
  await client.connect()
  const db = client.db(DB_NAME)
  cachedClient = client
  cachedDb = db
  return { client, db }
}

export async function getCompaniesCollection() {
  const { db } = await getDb()
  return db.collection('companies')
}
