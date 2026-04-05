require('dotenv').config()
const express = require('express')
const cors    = require('cors')
const rateLimit = require('express-rate-limit')

const productsRouter  = require('./routes/products')
const ordersRouter    = require('./routes/orders')
const authRouter      = require('./routes/auth')
const apiRouter       = require('./routes/api')       // external API (with key auth)
const adminRouter     = require('./routes/admin')
const webhookRouter   = require('./routes/webhooks')

const app  = express()
const PORT = process.env.PORT || 4000

// ── Middleware ─────────────────────────────────────────────
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// General rate limit
app.use(rateLimit({ windowMs: 60_000, max: 200 }))

// ── Routes ─────────────────────────────────────────────────
app.use('/api/products', productsRouter)   // public store
app.use('/api/orders',   ordersRouter)     // order flow
app.use('/api/auth',     authRouter)       // login/register
app.use('/api/v1',       apiRouter)        // partner/external API
app.use('/api/admin',    adminRouter)      // admin CMS
app.use('/api/webhooks', webhookRouter)    // inbound webhooks

// Health check
app.get('/health', (_, res) => res.json({ ok: true, ts: Date.now() }))

// Error handler
app.use((err, req, res, next) => {
  console.error(err)
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' })
})

app.listen(PORT, () => console.log(`🚀 Forma API running on port ${PORT}`))
