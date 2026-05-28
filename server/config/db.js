const { Pool } = require('pg')

let pool = null

async function connectDB() {
  if (!process.env.DATABASE_URL) {
    console.log('ℹ️ DATABASE_URL not set. Running with the in-memory seed store.')
    return null
  }

  try {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : undefined,
    })

    const client = await pool.connect()
    client.release()
    console.log('✅ PostgreSQL connected')
    return pool
  } catch (error) {
    pool = null
    console.warn(`⚠️ PostgreSQL connection failed, falling back to in-memory seed store: ${error.message}`)
    return null
  }
}

function getPool() {
  return pool
}

module.exports = connectDB
module.exports.getPool = getPool
