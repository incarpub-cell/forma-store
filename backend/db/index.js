const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30_000,
})

pool.on('error', (err) => console.error('DB pool error', err))

/**
 * query(sql, params?) → { rows, rowCount }
 */
const query = (text, params) => pool.query(text, params)

/**
 * transaction(async (client) => { ... })
 */
async function transaction(fn) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await fn(client)
    await client.query('COMMIT')
    return result
  } catch (e) {
    await client.query('ROLLBACK')
    throw e
  } finally {
    client.release()
  }
}

module.exports = { query, transaction, pool }
