require('dotenv').config()
const express  = require('express')
const cors     = require('cors')
const bcrypt   = require('bcryptjs')
const { v4: uuid } = require('uuid')
const rateLimit = require('express-rate-limit')

const productsRouter = require('./routes/products')
const ordersRouter   = require('./routes/orders')
const authRouter     = require('./routes/auth')
const apiRouter      = require('./routes/api')
const adminRouter    = require('./routes/admin')
const webhookRouter  = require('./routes/webhooks')
const uploadRouter   = require('./routes/upload')
const { query }      = require('./db')
const { requireAdmin } = require('./middleware/auth')

const app  = express()
const PORT = process.env.PORT || 4000

app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'https://forma-store-phi.vercel.app',
    'null',  // ← 로컬 파일 허용
  ]
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(rateLimit({ windowMs: 60_000, max: 200 }))

app.use('/api/products', productsRouter)
app.use('/api/orders',   ordersRouter)
app.use('/api/auth',     authRouter)
app.use('/api/v1',       apiRouter)
app.use('/api/admin',    adminRouter)
app.use('/api/webhooks', webhookRouter)
app.use('/api/upload',   uploadRouter)



// API Key 발급 - admin JWT 인증
app.post('/api/admin/keys', requireAdmin, async (req, res, next) => {
  try {
    const { label = '기본키', permissions = ['products:write'], rate_limit = 100 } = req.body
    const rawKey  = `sk-live-${uuid().replace(/-/g,'').slice(0,24)}`
    const prefix  = rawKey.slice(0, 12)
    const keyHash = await bcrypt.hash(rawKey, 12)
    const { rows: [key] } = await query(`
      INSERT INTO api_keys (key_hash, key_prefix, label, permissions, rate_limit)
      VALUES ($1,$2,$3,$4,$5)
      RETURNING id, key_prefix, label, permissions, rate_limit, created_at
    `, [keyHash, prefix, label, JSON.stringify(permissions), rate_limit])
    res.status(201).json({ ...key, key: rawKey, warning: '이 키는 지금만 확인할 수 있습니다' })
  } catch (e) { next(e) }
})


app.get('/health', (_, res) => res.json({ ok: true, ts: Date.now() }))


app.use((err, req, res, next) => {
  console.error(err)
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' })
})

app.listen(PORT, () => console.log(`Forma API running on port ${PORT}`))



